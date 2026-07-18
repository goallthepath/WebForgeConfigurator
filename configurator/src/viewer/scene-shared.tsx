import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * Gemeinsame 3D-Bausteine aller Produktmodule (Geländer, Fenstergitter,
 * Gartentor). Reine Darstellung – keinerlei Geschäftslogik.
 */

export const METAL = { metalness: 0.55, roughness: 0.38 };

export interface SharedShape {
  kind: 'round' | 'box';
  dM?: number;
  wM?: number;
  hM?: number;
}

export function ShapeMesh({
  shape,
  lengthM,
  color,
}: {
  shape: SharedShape;
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

/** Horizontaler Stab zwischen zwei Punkten (Handlauf, Gurt, Rahmen). */
export function RailMesh({
  start,
  end,
  shape,
  color,
  castShadow,
}: {
  start: [number, number, number];
  end: [number, number, number];
  shape: SharedShape;
  color: string;
  castShadow?: boolean;
}) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <mesh
      position={[(start[0] + end[0]) / 2, start[1], (start[2] + end[2]) / 2]}
      rotation={[Math.PI / 2, 0, angle]}
      castShadow={castShadow}
    >
      <ShapeMesh shape={shape} lengthM={len} color={color} />
    </mesh>
  );
}

export interface SharedDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

export function DimensionLine({ dim }: { dim: SharedDimension }) {
  const mid: [number, number, number] = [
    (dim.start[0] + dim.end[0]) / 2,
    (dim.start[1] + dim.end[1]) / 2 + 0.06,
    (dim.start[2] + dim.end[2]) / 2,
  ];
  return (
    <group>
      <Line points={[dim.start, dim.end]} color="#a8763e" lineWidth={1.5} />
      {/* DOM-Label statt troika-Text: kein Font-Fetch, kein Suspense. */}
      <Html position={mid} center zIndexRange={[10, 0]} className="dim-label-wrap">
        <span className="dim-label">{dim.label}</span>
      </Html>
    </group>
  );
}

/**
 * Programmatisch erzeugte Musterkachel (keine externen Dateien):
 * Lochblech, Laserschnitt-Motive, Streckmetall, Drahtgitter.
 * Weiss = sichtbar, Schwarz = Loch (alphaMap).
 */
export function makePatternTexture(kind: string): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = kind === 'gitter' ? '#000' : '#fff';
  ctx.fillRect(0, 0, size, size);

  if (kind === 'laser-kreise') {
    ctx.fillStyle = '#000';
    const c = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    c(30, 30, 16); c(88, 20, 9); c(64, 74, 20); c(110, 96, 12); c(22, 100, 10);
  } else if (kind === 'laser-quadrate') {
    ctx.fillStyle = '#000';
    ctx.fillRect(14, 14, 26, 26);
    ctx.fillRect(78, 26, 26, 26);
    ctx.fillRect(30, 78, 26, 26);
    ctx.fillRect(92, 90, 26, 26);
  } else if (kind === 'laser-floral') {
    ctx.fillStyle = '#000';
    const blatt = (x: number, y: number, s: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    blatt(36, 36, 22, 0.7);
    blatt(92, 60, 18, -0.5);
    blatt(48, 100, 20, 1.9);
    blatt(108, 112, 14, 0.3);
  } else if (kind === 'loch') {
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
export const PATTERN_TILE_M: Record<string, number> = {
  loch: 0.08,
  laser: 0.16,
  'laser-kreise': 0.16,
  'laser-quadrate': 0.16,
  'laser-floral': 0.2,
  streckmetall: 0.06,
  drahtgitter: 0.04,
};

export function makeWoodTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a5804f';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 32) {
    ctx.fillStyle = ['#a5804f', '#9a7648', '#af8a57', '#a07b4c'][(y / 32) % 4];
    ctx.fillRect(0, y, size, 30);
    ctx.strokeStyle = 'rgba(90,62,30,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 31);
    ctx.lineTo(size, y + 31);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,90,50,0.35)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const yy = y + 6 + k * 8;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(size * 0.3, yy + 2, size * 0.7, yy - 2, size, yy + 1);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Stilisiertes Schmiedeornament (Ringe, Voluten, Körbe). */
export function OrnamentMesh({
  kind,
  center,
  rotY = 0,
  sizeM,
  color,
}: {
  kind: 'ringe' | 'voluten' | 'koerbe';
  center: [number, number, number];
  rotY?: number;
  sizeM: number;
  color: string;
}) {
  const r = sizeM / 2;
  const tube = 0.006;
  if (kind === 'ringe') {
    return (
      <mesh position={center} rotation={[0, rotY, 0]}>
        <torusGeometry args={[r, tube, 12, 36]} />
        <meshStandardMaterial color={color} {...METAL} />
      </mesh>
    );
  }
  if (kind === 'voluten') {
    return (
      <group position={center} rotation={[0, rotY, 0]}>
        <mesh position={[0, r / 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[r / 1.6, tube, 12, 24, Math.PI]} />
          <meshStandardMaterial color={color} {...METAL} />
        </mesh>
        <mesh position={[0, -r / 1.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[r / 1.6, tube, 12, 24, Math.PI]} />
          <meshStandardMaterial color={color} {...METAL} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={center} rotation={[0, rotY, 0]}>
      <mesh scale={[1, 1.6, 1]}>
        <sphereGeometry args={[r / 1.7, 14, 14]} />
        <meshStandardMaterial color={color} {...METAL} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[tube, tube, sizeM * 1.6, 10]} />
        <meshStandardMaterial color={color} {...METAL} />
      </mesh>
    </group>
  );
}

/** Verputz-/Mauerwerk-Farbe für Wandkontexte. */
export const WALL_COLOR = '#ded9d0';
export const CONCRETE_COLOR = '#c6c2ba';

export interface SceneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  heightM: number;
}

export type ViewPreset = 'perspektive' | 'front' | 'seite' | 'oben';

/**
 * Bewegt Kamera und Controls-Ziel beim Preset-Wechsel, OHNE den Canvas
 * neu aufzubauen (ein Remount würde je Wechsel einen WebGL-Kontext
 * verlieren).
 */
export function CameraRig({
  view,
  bounds,
  controls,
}: {
  view: ViewPreset;
  bounds: SceneBounds;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const size = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxZ - bounds.minZ,
      bounds.heightM,
      2.2
    );
    const positions: Record<ViewPreset, [number, number, number]> = {
      perspektive: [cx - size * 0.55, size * 0.6 + bounds.heightM / 2, cz + size * 1.05],
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
