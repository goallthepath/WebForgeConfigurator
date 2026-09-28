// ============================================================================
// viewer/scene-shared.tsx – gemeinsame Bauklötze für die 3D-Welt
// ----------------------------------------------------------------------------
// Stell dir eine Puppenstube vor, in die eine kleine Kamera schaut: Das ist
// unsere 3D-Szene (gebaut mit Three.js). In dieser Datei liegen die Bauklötze,
// die alle Produkte gemeinsam benutzen: Rohre, Stäbe, Masslinien, Muster für
// Lochbleche, eine Holztextur, Schmiede-Schnörkel und eine Kamera, die sich
// je nach Ansicht (vorne, seitlich, oben) an den richtigen Platz stellt.
// Hier wird nur gezeichnet – gerechnet und entschieden wird anderswo.
// ============================================================================
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

/**
 * Gemeinsame 3D-Bausteine aller Produktmodule (Geländer, Fenstergitter,
 * Gartentor). Reine Darstellung – keinerlei Geschäftslogik.
 */

// METAL beschreibt, wie Stahl im Licht aussieht: «metalness» = wie metallisch
// (0 = Plastik, 1 = Spiegel), «roughness» = wie rau (0 = glatt poliert, 1 = stumpf).
// 🤧 Schnupfspruch: Halb glänzig, halb matt, so isch dr Stahl –
//    e Prise Schnupf, und gnueg für s'erschte Mal.
export const METAL = { metalness: 0.55, roughness: 0.38 };

// Die Form eines Stabs im Querschnitt: rund (mit Durchmesser dM) oder eckig
// wie eine Kiste (Breite wM, Höhe hM). Alle Masse in Metern.
export interface SharedShape {
  kind: 'round' | 'box';
  dM?: number;
  wM?: number;
  hM?: number;
}

// ShapeMesh baut die Form eines Stabs: ein Zylinder (rund) oder ein Quader
// (eckig), dazu die glänzende Metall-Farbe. Wie eine Bauklotz-Form plus Farbe.
// 🤧 Schnupfspruch: Zylinder, Chischte, Torus rund –
//    e Prise Schnupf zur rächte Stund.
export function ShapeMesh({
  shape,
  lengthM,
  color,
}: {
  shape: SharedShape;
  lengthM: number;
  color: string;
}) {
  // Runder Stab → ein Zylinder (wie eine Trinkhalm-Röhre).
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
  // Sonst → ein eckiger Quader (wie ein langer Bauklotz).
  return (
    <>
      <boxGeometry args={[shape.wM ?? 0.04, lengthM, shape.hM ?? 0.04]} />
      <meshStandardMaterial color={color} {...METAL} />
    </>
  );
}

// RailMesh: ein liegender Stab von Punkt A nach Punkt B.
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
  // Wie weit liegen Start und Ende auseinander (dx, dz)? Daraus rechnen wir
  // die Länge (Pythagoras – der Satz mit dem rechtwinkligen Dreieck) und
  // den Drehwinkel, damit der Stab genau in die richtige Richtung zeigt.
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  // Den Stab in die Mitte zwischen A und B stellen und passend hinlegen.
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

// Eine Masslinie: Anfangspunkt, Endpunkt und die Beschriftung (z. B. «2400 mm»).
export interface SharedDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

// DimensionLine zeichnet eine Masslinie mit einem kleinen Schild in der Mitte –
// wie das Massband, das der Schlosser beim Kunden anlegt.
export function DimensionLine({ dim }: { dim: SharedDimension }) {
  // Die Mitte der Linie, ein kleines Stück (6 cm) nach oben geschoben, für das Schild.
  const mid: [number, number, number] = [
    (dim.start[0] + dim.end[0]) / 2,
    (dim.start[1] + dim.end[1]) / 2 + 0.06,
    (dim.start[2] + dim.end[2]) / 2,
  ];
  return (
    <group>
      {/* 🤧 Schnupfspruch: Es Masslabel schwebt im Ruum – / e Prise Schnupf, es isch kei Truum. */}
      <Line points={[dim.start, dim.end]} color="#a8763e" lineWidth={1.5} />
      {/* DOM-Label statt troika-Text: kein Font-Fetch, kein Suspense. */}
      <Html position={mid} center zIndexRange={[10, 0]} className="dim-label-wrap">
        <span className="dim-label">{dim.label}</span>
      </Html>
    </group>
  );
}

// makePatternTexture malt ein Muster auf ein kleines Bild (eine Leinwand),
// z. B. ein Lochblech. Später wird das Bild wie Tapete immer wieder
// nebeneinander auf die Flächen geklebt.
/**
 * Programmatisch erzeugte Musterkachel (keine externen Dateien):
 * Lochblech, Laserschnitt-Motive, Streckmetall, Drahtgitter.
 * Weiss = sichtbar, Schwarz = Loch (alphaMap).
 */
export function makePatternTexture(kind: string): THREE.Texture {
  // Eine unsichtbare Leinwand von 128 × 128 Pixeln zum Bemalen.
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Den Hintergrund füllen (beim Gitter schwarz, sonst weiss).
  ctx.fillStyle = kind === 'gitter' ? '#000' : '#fff';
  ctx.fillRect(0, 0, size, size);

  if (kind === 'laser-kreise') {
    // Motiv: verschieden grosse Kreise (wie Käselöcher).
    ctx.fillStyle = '#000';
    const c = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    c(30, 30, 16); c(88, 20, 9); c(64, 74, 20); c(110, 96, 12); c(22, 100, 10);
  } else if (kind === 'laser-quadrate') {
    // Motiv: vier Quadrate.
    ctx.fillStyle = '#000';
    ctx.fillRect(14, 14, 26, 26);
    ctx.fillRect(78, 26, 26, 26);
    ctx.fillRect(30, 78, 26, 26);
    ctx.fillRect(92, 90, 26, 26);
  } else if (kind === 'laser-floral') {
    // Motiv: Blätter (schräg gestellte Ellipsen).
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
    // Klassisches Lochblech: runde Löcher in versetzten Reihen.
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
    // Laserschnitt: Schlitze mit runden Enden.
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
    // Streckmetall: gekreuzte Linien, die Rauten bilden.
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
    // Drahtgitter: eine senkrechte und eine waagrechte Linie – aneinandergereiht ein Netz.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, size);
    ctx.moveTo(0, 2);
    ctx.lineTo(size, 2);
    ctx.stroke();
  }

  // Aus der Zeichnung wird eine «Textur» – ein Aufkleber für 3D-Formen.
  // RepeatWrapping heisst: Der Aufkleber wiederholt sich wie ein Tapetenmuster.
  // 🤧 Schnupfspruch: Lochblech, Streckmetall und Draht –
  //    wär schnupft, isch für jedes parat.
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Wie gross eine Musterkachel in Wirklichkeit ist (in Metern).
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

// makeWoodTexture malt Holzbretter mit Maserung – z. B. für Holztore.
export function makeWoodTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a5804f';
  ctx.fillRect(0, 0, size, size);
  // Alle 32 Pixel ein neues Brett, jedes in einem etwas anderen Braunton,
  // dazu eine dunkle Fuge zwischen den Brettern.
  // 🤧 Schnupfspruch: Jahresring us Pixel gmalt –
  //    e Prise Schnupf, und kei Baum wird alt.
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
    // Drei feine, leicht gewellte Linien pro Brett = die Maserung.
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

// OrnamentMesh: Schmiede-Schnörkel für die Schmiedeoptik.
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
  // r = halbe Grösse, tube = wie dick der Draht des Ornaments ist.
  const r = sizeM / 2;
  const tube = 0.006;
  // Ringe: ein einfacher Donut (Torus).
  if (kind === 'ringe') {
    return (
      <mesh position={center} rotation={[0, rotY, 0]}>
        <torusGeometry args={[r, tube, 12, 36]} />
        <meshStandardMaterial color={color} {...METAL} />
      </mesh>
    );
  }
  // Voluten: zwei halbe Donuts übereinander – wie ein geschwungenes S.
  // 🤧 Schnupfspruch: Voluten dräihed sich im Chreis,
  //    wie d'Prise Schnupf – das jede weiss.
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
  // Körbe: eine gestreckte Kugel mit einem Stab mittendurch.
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

// Farben für Wände und Beton, damit das Produkt nicht in der Luft schwebt.
/** Verputz-/Mauerwerk-Farbe für Wandkontexte. */
export const WALL_COLOR = '#ded9d0';
export const CONCRETE_COLOR = '#c6c2ba';

// Die Grenzen der Szene – wie ein Schuhkarton, in den das ganze Produkt passt.
export interface SceneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  heightM: number;
}

// Die vier Kamera-Ansichten: schräg (perspektive), von vorne, von der Seite, von oben.
export type ViewPreset = 'perspektive' | 'front' | 'seite' | 'oben';

// CameraRig ist der Kameramann der Puppenstube.
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
  // Die Kamera aus der 3D-Szene holen (useThree ist das Werkzeugfach von Three.js).
  const camera = useThree((state) => state.camera);

  // useEffect = «Mach das jedes Mal, wenn sich die Ansicht oder die Grösse ändert».
  // 🤧 Schnupfspruch: D'Kamera flüügt ums Gländer ume,
  //    und ich schnupf und fang a summe.
  useEffect(() => {
    // Die Mitte des Produkts und seine grösste Ausdehnung (mindestens 2,2 m).
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    const size = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxZ - bounds.minZ,
      bounds.heightM,
      2.2
    );
    // Für jede Ansicht ein Standplatz für die Kamera.
    // 🤧 Schnupfspruch: Front, Siite, Obe – rundum gluegt,
    //    e Prise Schnupf, und s'Bild isch guet.
    const positions: Record<ViewPreset, [number, number, number]> = {
      perspektive: [cx - size * 0.55, size * 0.6 + bounds.heightM / 2, cz + size * 1.05],
      front: [cx, bounds.heightM / 2, cz + size * 1.35],
      seite: [cx + size * 1.35, bounds.heightM / 2, cz],
      oben: [cx, size * 1.6, cz + 0.001],
    };
    // Kamera hinstellen …
    camera.position.set(...positions[view]);
    // … und dafür sorgen, dass sie auf die Mitte des Produkts schaut.
    if (controls.current) {
      controls.current.target.set(cx, bounds.heightM / 2, cz);
      controls.current.update();
    }
  }, [view, bounds, camera, controls]);

  // Der Kameramann ist unsichtbar – er zeichnet selber nichts.
  return null;
}
