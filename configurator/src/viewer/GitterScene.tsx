import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { FenstergitterGeometry } from '../products/fenstergitter/geometry';
import {
  CameraRig,
  DimensionLine,
  METAL,
  OrnamentMesh,
  ShapeMesh,
  WALL_COLOR,
  type ViewPreset,
} from './scene-shared';

/**
 * 3D-Szene Fenstergitter: Wand mit Fensteröffnung, Glas, Gitterrahmen,
 * Stäbe, Quergurte, Zierelemente und Befestigungslaschen.
 * Rendert ausschliesslich das Geometriemodell (Ebenentrennung).
 */
export function GitterScene({
  geometry,
  color,
  showDimensions,
  view,
  mobile,
}: {
  geometry: FenstergitterGeometry;
  color: string;
  showDimensions: boolean;
  view: ViewPreset;
  mobile: boolean;
}) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const { wall, openingW, openingH, frameW, frameH, gitterZ, frameShape } =
    geometry;
  const sillY = geometry.dimensions[1]?.start[1] ?? 0.9;
  const openBot = Math.max(0.2, sillY - 0.02);
  const wallZ = -wall.thickness / 2;
  const frameT = frameShape.hM ?? frameShape.dM ?? 0.03;
  const frameB = frameShape.wM ?? frameShape.dM ?? 0.03;

  const wandTeil = (
    x: number,
    y: number,
    w: number,
    h: number,
    key: string
  ) => (
    <mesh key={key} position={[x, y, wallZ]} receiveShadow={!mobile}>
      <boxGeometry args={[w, h, wall.thickness]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={0.95} metalness={0} />
    </mesh>
  );

  const openTop = openBot + openingH;
  const seitenW = (wall.width - openingW) / 2;

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.2, 1.8, 2.6], fov: 42 }}
      shadows={!mobile}
    >
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
      <color attach="background" args={['#efedea']} />
      <hemisphereLight intensity={0.55} groundColor="#b0aca4" />
      <directionalLight
        position={[3, 5, 5]}
        intensity={1.3}
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Wand mit Fensteröffnung (vier Segmente) */}
      {wandTeil(0, openBot / 2, wall.width, openBot, 'unten')}
      {wandTeil(0, openTop + (wall.height - openTop) / 2, wall.width, wall.height - openTop, 'oben')}
      {wandTeil(-(openingW / 2 + seitenW / 2), openBot + openingH / 2, seitenW, openingH, 'links')}
      {wandTeil(openingW / 2 + seitenW / 2, openBot + openingH / 2, seitenW, openingH, 'rechts')}

      {/* Fensterglas mit Rahmenandeutung */}
      <mesh position={[0, openBot + openingH / 2, -0.13]}>
        <boxGeometry args={[openingW - 0.04, openingH - 0.04, 0.01]} />
        <meshStandardMaterial
          color="#aac6cf"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Gitterrahmen: 2 horizontale + 2 vertikale Profile */}
      {[
        { y: sillY + frameT / 2, len: frameW },
        { y: sillY + frameH - frameT / 2, len: frameW },
      ].map((h, i) => (
        <mesh
          key={`fh-${i}`}
          position={[0, h.y, gitterZ]}
          rotation={[Math.PI / 2, 0, Math.PI / 2]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={frameShape} lengthM={h.len} color={color} />
        </mesh>
      ))}
      {[-1, 1].map((seite) => (
        <mesh
          key={`fv-${seite}`}
          position={[seite * (frameW / 2 - frameB / 2), sillY + frameH / 2, gitterZ]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={frameShape} lengthM={frameH} color={color} />
        </mesh>
      ))}

      {/* Gitterstäbe */}
      {geometry.stäbe.map((stab, i) => (
        <mesh
          key={`stab-${i}`}
          position={[stab.x, stab.yM + stab.heightM / 2, gitterZ]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={stab.shape} lengthM={stab.heightM} color={color} />
        </mesh>
      ))}

      {/* Quergurte */}
      {geometry.gurte.map((gurt, i) => (
        <mesh
          key={`gurt-${i}`}
          position={[(gurt.x1 + gurt.x2) / 2, gurt.y, gitterZ]}
          rotation={[Math.PI / 2, 0, Math.PI / 2]}
        >
          <ShapeMesh shape={gurt.shape} lengthM={gurt.x2 - gurt.x1} color={color} />
        </mesh>
      ))}

      {/* Zierelemente */}
      {geometry.ornaments.map((orn, i) => (
        <OrnamentMesh
          key={`orn-${i}`}
          kind={orn.kind}
          center={orn.center}
          sizeM={orn.sizeM}
          color={color}
        />
      ))}

      {/* Befestigungslaschen mit Anker */}
      {geometry.laschen.map((lasche, i) => (
        <group key={`lasche-${i}`} position={lasche.center}>
          <mesh>
            <boxGeometry args={lasche.sizeM} />
            <meshStandardMaterial color={color} {...METAL} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.03, 10]} />
            <meshStandardMaterial color="#8d9298" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {showDimensions &&
        geometry.dimensions.map((dim, i) => <DimensionLine key={i} dim={dim} />)}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <gridHelper args={[16, 32, '#c9c5bd', '#dedbd5']} />

      <OrbitControls
        ref={controls}
        enableDamping
        maxPolarAngle={Math.PI / 2.05}
        minDistance={0.6}
        maxDistance={15}
      />
    </Canvas>
  );
}
