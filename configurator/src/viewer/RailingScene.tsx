// ─────────────────────────────────────────────────────────────────────────
// Für Kinder erklärt: Diese Datei ist die kleine 3D-Bühne. Sie bekommt den
// fertigen Bauplan (wo jeder Pfosten, jeder Stab, jede Platte steht) und
// stellt für jedes Teil ein 3D-Klötzchen auf die Bühne – Zylinder für runde
// Rohre, Schachteln für eckige. Dazu kommen Licht, Schatten, ein Boden mit
// Gitterlinien und eine Kamera, die man mit der Maus herumdrehen kann.
// ─────────────────────────────────────────────────────────────────────────
// 🤧 Schnupfspruch: Liecht a, Kamera los – s Gländer isch e Star, ganz gross!
//    Im Computer glänzt s wie nöi, doch de Schnupf bliibt ehrlich treu.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type {
  GeoDimension,
  GeoPanel,
  GeoSlab,
  ProfileShape,
  RailingGeometry,
} from '../products/gelaender/geometry';

/**
 * 3D-Szene des Geländers. Rendert ausschliesslich das übergebene
 * Geometriemodell – keinerlei Geschäftslogik (Ebenentrennung).
 */

// Die vier Kamera-Plätze: schräg von oben, von vorne, von der Seite, von oben.
export type ViewPreset = 'perspektive' | 'front' | 'seite' | 'oben';

// Kinder-Erklärung: So soll Metall aussehen – ein bisschen glänzend
// (metalness) und ein bisschen rau (roughness), wie ein Löffel aus der Schublade.
const METAL = { metalness: 0.55, roughness: 0.38 };

// Macht aus einer Stangen-Form ein 3D-Klötzchen: Rund → Zylinder
// (wie eine Klopapierrolle), eckig → Schachtel. Und malt es in der Farbe an.
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

// Kinder-Erklärung: Hier malen wir ein kleines Musterbild (128 × 128 Punkte)
// auf eine unsichtbare Maltafel: Weiss heisst «da ist Metall», Schwarz heisst
// «da ist ein Loch». Das Bildchen wird dann wie Tapete immer wieder
// nebeneinander auf die Blechplatte geklebt.
// 🤧 Schnupfspruch: Es Loch im Blech isch kei Pech – es isch gwollt, gäll, du Frech!
//    Schnupf und lueg dur s Lochblech dure, s gseht us wie Chäs vo de Bure.
/**
 * Programmatisch erzeugte Musterkachel (keine externen Dateien):
 * Lochblech, Laserschlitze, Streckmetall-Rauten, Drahtgitter.
 * Weiss = sichtbar, Schwarz = Loch (alphaMap).
 */
function makePatternTexture(kind: string): THREE.Texture {
  // Zuerst die ganze Tafel einfärben: weiss (Blech) – nur beim Gitter schwarz,
  // weil dort das Loch das Meiste ist und nur die Drähte weiss werden.
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = kind === 'gitter' ? '#000' : '#fff';
  ctx.fillRect(0, 0, size, size);

  // Jetzt je nach Muster Löcher (schwarz) oder Stege (weiss) malen.
  if (kind === 'laser-kreise') {
    // Kreise unterschiedlicher Grösse (Tile ≈ 160 mm).
    ctx.fillStyle = '#000';
    const c = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    c(30, 30, 16); c(88, 20, 9); c(64, 74, 20); c(110, 96, 12); c(22, 100, 10);
  } else if (kind === 'laser-quadrate') {
    // Versetztes Quadratraster (Tile ≈ 160 mm).
    ctx.fillStyle = '#000';
    ctx.fillRect(14, 14, 26, 26);
    ctx.fillRect(78, 26, 26, 26);
    ctx.fillRect(30, 78, 26, 26);
    ctx.fillRect(92, 90, 26, 26);
  } else if (kind === 'laser-floral') {
    // Stilisierte Blätter (Tile ≈ 200 mm).
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

  // Die Maltafel wird zum «Tapetenmuster», das sich endlos wiederholt.
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Kinder-Erklärung: Wie gross ist ein Tapeten-Stück in Wirklichkeit?
// 0.08 heisst 8 Zentimeter.
/** Kachelgrösse in m je Muster (für texture.repeat). */
const PATTERN_TILE_M: Record<string, number> = {
  loch: 0.08,
  laser: 0.16,
  'laser-kreise': 0.16,
  'laser-quadrate': 0.16,
  'laser-floral': 0.2,
  streckmetall: 0.06,
  drahtgitter: 0.04,
};

// Malt ein Holzbretter-Muster: braune Streifen mit dunklen Fugen und feinen
// geschwungenen Linien – wie die Maserung auf einem echten Brett.
function makeWoodTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#a5804f';
  ctx.fillRect(0, 0, size, size);
  // Bretter mit Fugen und leichter Maserung
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

// Der Boden oder die Mauer unter dem Geländer. Je nach Untergrund sieht er
// anders aus: Holzbretter, grauer Beton, glänzender Stahl oder halb
// durchsichtig, wenn wir es nicht wissen.
function SlabMesh({ slab, mobile }: { slab: GeoSlab; mobile: boolean }) {
  // «useMemo» heisst: Das Material nur neu machen, wenn sich etwas ändert –
  // wie wenn du ein Bild nur neu malst, wenn jemand eine andere Farbe will.
  const material = useMemo(() => {
    switch (slab.kind) {
      case 'holz': {
        const map = makeWoodTexture();
        map.repeat.set(slab.sizeM[0] / 0.6, slab.sizeM[2] / 0.6);
        return <meshStandardMaterial map={map} roughness={0.85} metalness={0} />;
      }
      case 'stahl':
        return (
          <meshStandardMaterial color="#5a6067" metalness={0.85} roughness={0.35} />
        );
      case 'unbekannt':
        return (
          <meshStandardMaterial
            color="#d9d6cf"
            roughness={0.95}
            metalness={0}
            transparent
            opacity={0.55}
          />
        );
      default:
        return (
          <meshStandardMaterial color="#c6c2ba" roughness={0.95} metalness={0} />
        );
    }
  }, [slab.kind, slab.sizeM]);

  // Kinder-Erklärung: Ein Stahlträger sieht von der Seite aus wie ein «I»:
  // oben ein Brett, unten ein Brett und dazwischen ein schmaler Steg.
  // Darum bauen wir ihn aus drei Schachteln zusammen.
  // Stahltraeger: als liegender I-Traeger angedeutet (Flansche).
  if (slab.kind === 'stahl') {
    const [l, h, b] = slab.sizeM;
    const flansch = h * 0.18;
    return (
      <group position={slab.center} rotation={[0, slab.rotY, 0]}>
        <mesh position={[0, h / 2 - flansch / 2, 0]} receiveShadow={!mobile}>
          <boxGeometry args={[l, flansch, b]} />
          {material}
        </mesh>
        <mesh receiveShadow={!mobile}>
          <boxGeometry args={[l, h - 2 * flansch, b * 0.35]} />
          {material}
        </mesh>
        <mesh position={[0, -h / 2 + flansch / 2, 0]} receiveShadow={!mobile}>
          <boxGeometry args={[l, flansch, b]} />
          {material}
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={slab.center} rotation={[0, slab.rotY, 0]} receiveShadow={!mobile}>
      <boxGeometry args={slab.sizeM} />
      {material}
    </mesh>
  );
}

// Eine Füllungs-Platte (Glas, Blech oder Gitter). Glas ist durchsichtig,
// Blech hat die Geländerfarbe, und bei Lochblech/Gitter kleben wir das
// Muster von oben drauf, damit man durch die Löcher schauen kann.
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
      // Kinder-Erklärung: Für alle Sorten mit Löchern: Muster aussuchen,
      // ausrechnen, wie oft es auf die Platte passt (Breite geteilt durch
      // Kachelgrösse), und als «Loch-Karte» (alphaMap) aufkleben.
      default: {
        let kind = panel.fill.replace(/^(blech|gitter)-/, '');
        if (kind === 'laser' && panel.motiv && panel.motiv !== 'schlitze') {
          kind = `laser-${panel.motiv}`;
        }
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
  }, [panel.fill, panel.motiv, panel.widthM, panel.heightM, color]);

  // 🤧 Schnupfspruch: Glas wie Luft und Blech wie Stei –
  //    s Gländer isch nie ganz allei. Schnupf!
  return (
    <mesh position={panel.center} rotation={[0, panel.rotY, 0]}>
      <boxGeometry args={[panel.widthM, panel.heightM, 0.006]} />
      {material}
    </mesh>
  );
}

// Eine Masslinie in 3D: eine braune Linie, zwei kleine Striche an den Enden
// und in der Mitte ein Schildchen mit der Zahl (z. B. «3000 mm»).
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

// Kinder-Erklärung: Der Kameramann. Wenn man auf «Front» oder «Oben» drückt,
// trägt er die Kamera an einen neuen Platz und richtet sie auf die Mitte
// des Geländers. Er selbst ist unsichtbar (darum «return null»).
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

  // Bei jedem Ansichts-Wechsel: Mitte und Grösse des Geländers ausrechnen und
  // die Kamera je nach Ansicht genug weit weg stellen, damit alles draufpasst.
  // 🤧 Schnupfspruch: D Kamera fahrt um s Gländer ume wie en Bär um de Hunig –
  //    und wer's vo obe gseht, dä findet's sogar lunig.
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

// Die ganze Bühne: Hier wird alles zusammengesetzt – Kamera, Licht, Boden,
// Füsse, Schnörkel, Pfosten, Stangen, Stäbe, Platten, Enden und Masslinien.
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
  // Ein «Griff» für die Maus-Steuerung, und die Mitte des Geländers,
  // um die sich die Kamera drehen soll.
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
      {/* Kinder-Erklärung: Kameramann, Hintergrundfarbe und zwei Lampen
          (eine weiche von oben und eine wie die Sonne, die Schatten wirft). */}
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
      <color attach="background" args={['#efedea']} />
      <hemisphereLight intensity={0.5} groundColor="#b0aca4" />
      <directionalLight
        position={[4, 7, 4]}
        intensity={1.4}
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Baukörper-Andeutung – Darstellung folgt dem Untergrund */}
      {geometry.slabs.map((slab, i) => (
        <SlabMesh key={`slab-${i}`} slab={slab} mobile={mobile} />
      ))}

      {/* Fussplatten, Schwerter, Kragarme – inkl. Anker-Andeutung */}
      {geometry.plates.map((plate, i) => {
        // Kinder-Erklärung: Wo kommen die Schrauben hin? Bei der Fussplatte in
        // die vier Ecken, beim Schwert und bei der Wandlasche zwei übereinander.
        const [l, h, b] = plate.sizeM;
        const bolts: [number, number, number][] =
          plate.kind === 'fussplatte'
            ? [
                [-l / 2 + 0.02, h, -b / 2 + 0.02],
                [l / 2 - 0.02, h, -b / 2 + 0.02],
                [-l / 2 + 0.02, h, b / 2 - 0.02],
                [l / 2 - 0.02, h, b / 2 - 0.02],
              ]
            : plate.kind === 'schwert'
              ? [
                  [0, h / 2 - 0.03, b / 2],
                  [0, -h / 2 + 0.03, b / 2],
                ]
              : plate.kind === 'wandlasche'
                ? [
                    [0, h / 2 - 0.025, 0],
                    [0, -h / 2 + 0.025, 0],
                  ]
                : [];
        return (
          <group
            key={`plate-${i}`}
            position={plate.center}
            rotation={[0, plate.rotY, 0]}
          >
            <mesh castShadow={!mobile}>
              <boxGeometry args={plate.sizeM} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
            {/* Die kleinen Schraubenköpfe (Anker) als Mini-Zylinder. */}
            {bolts.map((pos, bi) => (
              <mesh
                key={bi}
                position={pos}
                rotation={
                  plate.kind === 'schwert'
                    ? [Math.PI / 2, 0, 0]
                    : plate.kind === 'wandlasche'
                      ? [0, 0, Math.PI / 2]
                      : [0, 0, 0]
                }
              >
                <cylinderGeometry args={[0.007, 0.007, 0.016, 12]} />
                <meshStandardMaterial color="#8d9298" metalness={0.8} roughness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Schmiedeornamente (Grundauswahl Charakter-Familie) */}
      {geometry.ornaments.map((orn, i) => {
        // Kinder-Erklärung: Ringe sind Donuts (torus), Voluten sind zwei
        // halbe Donuts übereinander wie ein «S», Körbe sind eine gestreckte Kugel.
        const r = orn.sizeM / 2;
        const tube = 0.006;
        if (orn.kind === 'ringe') {
          return (
            <mesh
              key={`orn-${i}`}
              position={orn.center}
              rotation={[0, orn.rotY, 0]}
            >
              <torusGeometry args={[r, tube, 12, 36]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
          );
        }
        if (orn.kind === 'voluten') {
          // Stilisierte S-Volute aus zwei Halbtori.
          return (
            <group key={`orn-${i}`} position={orn.center} rotation={[0, orn.rotY, 0]}>
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
        // Körbe: gedrungene Kugelform mit Stabansätzen.
        return (
          <group key={`orn-${i}`} position={orn.center} rotation={[0, orn.rotY, 0]}>
            <mesh scale={[1, 1.6, 1]}>
              <sphereGeometry args={[r / 1.7, 14, 14]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[tube, tube, orn.sizeM * 1.6, 10]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
          </group>
        );
      })}

      {/* 🤧 Schnupfspruch: Pfoste stönd wie Tanne im Wald – de Schnupf macht warm, au wänn's chalt. */}
      {/* Kinder-Erklärung: Die Pfosten – ein Klötzchen pro Pfosten, in die Mitte seiner Höhe gestellt. */}
      {geometry.posts.map((post, i) => (
        <mesh
          key={`post-${i}`}
          position={[post.x, post.yBaseM + post.heightM / 2, post.z]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={post.shape} lengthM={post.heightM} color={color} />
        </mesh>
      ))}

      {/* Die waagrechten Stangen: Wir messen, wie lang sie sind (Satz des
          Pythagoras – die schräge Linie im Dreieck) und in welche Richtung
          sie zeigen, und drehen das Klötzchen dann flach hin. */}
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

      {/* Die senkrechten Füllstäbe – genau wie die Pfosten, nur dünner. */}
      {geometry.bars.map((bar, i) => (
        <mesh
          key={`bar-${i}`}
          position={[bar.x, bar.yM + bar.heightM / 2, bar.z]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={bar.shape} lengthM={bar.heightM} color={color} />
        </mesh>
      ))}

      {/* Die Platten: Glas, Blech oder Gitter. */}
      {geometry.panels.map((panel, i) => (
        <PanelMesh key={`panel-${i}`} panel={panel} color={color} />
      ))}

      {/* Die Enden des Handlaufs: Kugel, Drittel-Kugel oder Bogen nach unten. */}
      {/* 🤧 Schnupfspruch: Es Chügeli am End, so isch s Gländer complet –
          kei Ärmel bliibt hange, und de Schnupf isch parat. */}
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
        if (cap.kind === 'kugel-drittel') {
          // Gewoelbte Endkappe (Kugelsegment), buendig auf dem Rohrende.
          const yaw = Math.atan2(cap.dir[0], cap.dir[1]) - Math.PI / 2;
          return (
            <group key={`cap-${i}`} position={cap.position} rotation={[0, yaw, 0]}>
              <mesh rotation={[0, 0, -Math.PI / 2]} scale={[0.45, 1, 1]}>
                <sphereGeometry
                  args={[r * 1.05, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        }
        if (cap.kind === 'endbogen') {
          // Echter 90°-Bogen: Viertel-Torus in der vertikalen Ebene des
          // Laufs, danach kurzer senkrechter Abgang.
          const bogenR = Math.max(r * 2.2, 0.05);
          const abgangL = 0.1;
          const yaw = Math.atan2(cap.dir[0], cap.dir[1]) - Math.PI / 2;
          return (
            <group
              key={`cap-${i}`}
              position={cap.position}
              rotation={[0, yaw, 0]}
            >
              {/* Torus liegt in XZ der Gruppe; um X gekippt in die
                  vertikale Ebene, Zentrum unterhalb der Handlaufachse. */}
              <mesh position={[0, -bogenR, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[bogenR, r, 14, 20, Math.PI / 2]} />
                <meshStandardMaterial color={color} {...METAL} />
              </mesh>
              <mesh position={[bogenR, -bogenR - abgangL / 2, 0]}>
                <cylinderGeometry args={[r, r, abgangL, 16]} />
                <meshStandardMaterial color={color} {...METAL} />
              </mesh>
              <mesh position={[bogenR, -bogenR - abgangL, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[r, 16]} />
                <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        }
        return null;
      })}

      {/* Masslinien nur, wenn das Häkchen gesetzt ist. */}
      {showDimensions &&
        geometry.dimensions.map((dim, i) => <DimensionLine key={i} dim={dim} />)}

      {/* Ein unsichtbarer Boden, der nur Schatten fängt, und ein Gitternetz wie
          auf Häuschenpapier. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <gridHelper args={[20, 40, '#c9c5bd', '#dedbd5']} position={[0, 0, 0]} />

      {/* Die Maus-Steuerung: drehen, zoomen – aber nie unter den Boden schauen. */}
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
