import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type {
  GeoDimension,
  GeoPanel,
  ProfileShape,
  RailingGeometry,
} from '../products/gelaender/geometry';

/**
 * 3D-Szene des Geländers. Rendert ausschliesslich das übergebene
 * Geometriemodell – keinerlei Geschäftslogik (Ebenentrennung).
 */

export type ViewPreset = 'perspektive' | 'front' | 'seite' | 'oben';

const METAL = { metalness: 0.55, roughness: 0.38 };

function ShapeMesh({
  shape,
  lengthM,
  color,
}: {
  shape: ProfileShape;
  lengthM: number;
  color: string;
}) {
  if (shape.kind === 'round') {
    return (
      <>
        <cylinderGeometry
          args={[(shape.dM ?? 0.04) / 2, (shape.dM ?? 0.04) / 2, lengthM, 20]}
        />
        <meshStandardMaterial color={color} {...METAL} />
      </>
    );
  }
  return (
    <>
      <boxGeometry args={[shape.wM ?? 0.04, lengthM, shape.hM ?? 0.04]} />
      <meshStandardMaterial color={color} {...METAL} />
    </>
  );
}

/**
 * Programmatisch erzeugte Musterkachel (keine externen Dateien):
 * Lochblech, Laserschlitze, Streckmetall-Rauten, Drahtgitter.
 * Weiss = sichtbar, Schwarz = Loch (alphaMap).
 */
function makePatternTexture(kind: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = kind === 'gitter' ? '#000' : '#fff';
  ctx.fillRect(0, 0, size, size);

  if (kind === 'loch') {
    // Rundlochung, versetzte Reihen (Tile ≈ 80 mm).
    ctx.fillStyle = '#000';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = col * 32 + (row % 2 === 0 ? 8 : 24);
        const y = row * 32 + 16;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === 'laser') {
    // Vertikale Langloch-Schlitze, versetzt (Tile ≈ 160 mm).
    ctx.fillStyle = '#000';
    const slot = (x: number, y: number, w: number, h: number) => {
      const r = w / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };
    slot(18, 12, 12, 44);
    slot(58, 34, 12, 44);
    slot(98, 12, 12, 44);
    slot(18, 76, 12, 44);
    slot(58, 98, 12, 26);
    slot(98, 76, 12, 44);
  } else if (kind === 'streckmetall') {
    // Rautenstege auf transparentem Grund (Tile ≈ 60 mm).
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 10;
    for (let i = -1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-16, i * 64 - 16);
      ctx.lineTo(size + 16, i * 64 + 48);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size + 16, i * 64 - 16);
      ctx.lineTo(-16, i * 64 + 48);
      ctx.stroke();
    }
  } else if (kind === 'drahtgitter') {
    // Feines Quadratgitter (Tile ≈ 40 mm ⇒ Masche ~40 mm, BFU-Richtwert).
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, size);
    ctx.moveTo(0, 2);
    ctx.lineTo(size, 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Kachelgrösse in m je Muster (für texture.repeat). */
const PATTERN_TILE_M: Record<string, number> = {
  loch: 0.08,
  laser: 0.16,
  streckmetall: 0.06,
  drahtgitter: 0.04,
};

function PanelMesh({ panel, color }: { panel: GeoPanel; color: string }) {
  const material = useMemo(() => {
    switch (panel.fill) {
      case 'glas-klar':
        return (
          <meshStandardMaterial
            color="#bfd8dd"
            transparent
            opacity={0.3}
            roughness={0.05}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        );
      case 'glas-satiniert':
        return (
          <meshStandardMaterial
            color="#dfe8ea"
            transparent
            opacity={0.75}
            roughness={0.7}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        );
      case 'blech-voll':
        return <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />;
      default: {
        const kind = panel.fill.replace(/^(blech|gitter)-/, '');
        const texture = makePatternTexture(kind);
        const tile = PATTERN_TILE_M[kind] ?? 0.08;
        texture.repeat.set(panel.widthM / tile, panel.heightM / tile);
        return (
          <meshStandardMaterial
            color={color}
            {...METAL}
            alphaMap={texture}
            alphaTest={0.5}
            side={THREE.DoubleSide}
          />
        );
      }
    }
  }, [panel.fill, panel.widthM, panel.heightM, color]);

  return (
    <mesh position={panel.center} rotation={[0, panel.rotY, 0]}>
      <boxGeometry args={[panel.widthM, panel.heightM, 0.006]} />
      {material}
    </mesh>
  );
}

function DimensionLine({ dim }: { dim: GeoDimension }) {
  const mid: [number, number, number] = [
    (dim.start[0] + dim.end[0]) / 2,
    (dim.start[1] + dim.end[1]) / 2 + 0.06,
    (dim.start[2] + dim.end[2]) / 2,
  ];
  return (
    <group>
      <Line points={[dim.start, dim.end]} color="#a8763e" lineWidth={1.5} />
      <Line
        points={[dim.start, [dim.start[0], dim.start[1] + 0.05, dim.start[2]]]}
        color="#a8763e"
        lineWidth={1}
      />
      <Line
        points={[dim.end, [dim.end[0], dim.end[1] + 0.05, dim.end[2]]]}
        color="#a8763e"
        lineWidth={1}
      />
      {/* DOM-Label statt troika-Text: kein Font-Fetch, kein Suspense –
          die Szene kann dadurch nie am Laden eines Fonts hängenbleiben. */}
      <Html position={mid} center zIndexRange={[10, 0]} className="dim-label-wrap">
        <span className="dim-label">{dim.label}</span>
      </Html>
    </group>
  );
}

/**
 * Bewegt Kamera und Controls-Ziel beim Preset-Wechsel, OHNE den Canvas
 * neu aufzubauen (ein Remount würde je Wechsel einen neuen WebGL-Kontext
 * erzeugen und alte Kontexte verlieren).
 */
function CameraRig({
  view,
  bounds,
  controls,
}: {
  view: ViewPreset;
  bounds: RailingGeometry['bounds'];
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const size = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxZ - bounds.minZ,
      2.2
    );
    const positions: Record<ViewPreset, [number, number, number]> = {
      perspektive: [cx - size * 0.55, size * 0.6, cz + size * 1.05],
      front: [cx, bounds.heightM / 2, cz + size * 1.35],
      seite: [cx + size * 1.35, bounds.heightM / 2, cz],
      oben: [cx, size * 1.6, cz + 0.001],
    };
    camera.position.set(...positions[view]);
    if (controls.current) {
      controls.current.target.set(cx, bounds.heightM / 2, cz);
      controls.current.update();
    }
  }, [view, bounds, camera, controls]);

  return null;
}

export function RailingScene({
  geometry,
  color,
  showDimensions,
  view,
  mobile,
}: {
  geometry: RailingGeometry;
  color: string;
  showDimensions: boolean;
  view: ViewPreset;
  mobile: boolean;
}) {
  const controls = useRef<OrbitControlsImpl | null>(null);

  const center = useMemo<[number, number, number]>(
    () => [
      (geometry.bounds.minX + geometry.bounds.maxX) / 2,
      geometry.bounds.heightM / 2,
      (geometry.bounds.minZ + geometry.bounds.maxZ) / 2,
    ],
    [geometry.bounds]
  );

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.5, 1.6, 3.2], fov: 42 }}
      shadows={!mobile}
    >
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
      <color attach="background" args={['#efedea']} />
      <hemisphereLight intensity={0.5} groundColor="#b0aca4" />
      <directionalLight
        position={[4, 7, 4]}
        intensity={1.4}
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Baukörper-Andeutung (Betonplatte/Mauerkrone) */}
      {geometry.slabs.map((slab, i) => (
        <mesh
          key={`slab-${i}`}
          position={slab.center}
          rotation={[0, slab.rotY, 0]}
          receiveShadow={!mobile}
        >
          <boxGeometry args={slab.sizeM} />
          <meshStandardMaterial color="#c6c2ba" roughness={0.95} metalness={0} />
        </mesh>
      ))}

      {/* Fussplatten, Schwerter, Kragarme */}
      {geometry.plates.map((plate, i) => (
        <mesh
          key={`plate-${i}`}
          position={plate.center}
          rotation={[0, plate.rotY, 0]}
          castShadow={!mobile}
        >
          <boxGeometry args={plate.sizeM} />
          <meshStandardMaterial color={color} {...METAL} />
        </mesh>
      ))}

      {geometry.posts.map((post, i) => (
        <mesh
          key={`post-${i}`}
          position={[post.x, post.yBaseM + post.heightM / 2, post.z]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={post.shape} lengthM={post.heightM} color={color} />
        </mesh>
      ))}

      {geometry.rails.map((rail, i) => {
        const dx = rail.end[0] - rail.start[0];
        const dz = rail.end[2] - rail.start[2];
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);
        return (
          <mesh
            key={`rail-${i}`}
            position={[
              (rail.start[0] + rail.end[0]) / 2,
              rail.start[1],
              (rail.start[2] + rail.end[2]) / 2,
            ]}
            rotation={[Math.PI / 2, 0, angle]}
            castShadow={!mobile}
          >
            <ShapeMesh shape={rail.shape} lengthM={len} color={color} />
          </mesh>
        );
      })}

      {geometry.bars.map((bar, i) => (
        <mesh
          key={`bar-${i}`}
          position={[bar.x, bar.yM + bar.heightM / 2, bar.z]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={bar.shape} lengthM={bar.heightM} color={color} />
        </mesh>
      ))}

      {geometry.panels.map((panel, i) => (
        <PanelMesh key={`panel-${i}`} panel={panel} color={color} />
      ))}

      {geometry.endCaps.map((cap, i) => {
        const r = (cap.shape.dM ?? cap.shape.hM ?? 0.04) / 2;
        if (cap.kind === 'kugel') {
          return (
            <mesh
              key={`cap-${i}`}
              position={[
                cap.position[0] + cap.dir[0] * r * 1.6,
                cap.position[1],
                cap.position[2] + cap.dir[1] * r * 1.6,
              ]}
            >
              <sphereGeometry args={[r * 1.8, 20, 20]} />
              <meshStandardMaterial color={color} {...METAL} roughness={0.35} />
            </mesh>
          );
        }
        if (cap.kind === 'endbogen') {
          const bogenL = 0.14;
          return (
            <mesh
              key={`cap-${i}`}
              position={[
                cap.position[0] + cap.dir[0] * r * 2,
                cap.position[1] - bogenL / 2,
                cap.position[2] + cap.dir[1] * r * 2,
              ]}
            >
              <cylinderGeometry args={[r, r, bogenL, 16]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
          );
        }
        return null;
      })}

      {showDimensions &&
        geometry.dimensions.map((dim, i) => <DimensionLine key={i} dim={dim} />)}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <gridHelper args={[20, 40, '#c9c5bd', '#dedbd5']} position={[0, 0, 0]} />

      <OrbitControls
        ref={controls}
        target={center}
        enableDamping
        maxPolarAngle={Math.PI / 2.05}
        minDistance={0.8}
        maxDistance={20}
      />
    </Canvas>
  );
}
