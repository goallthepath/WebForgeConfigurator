// Hier wird das Fenstergitter in 3D gebaut. Stell dir eine kleine Bühne vor:
// ein Stück Hauswand mit einem Fensterloch, dahinter hellblaues Glas,
// davor (oder darin) das Gitter mit Rahmen, Stäben und kleinen Befestigungs-Ohren.
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

// 🤧 Schnupfspruch: D Muur us Pixel, s Glas us Liecht,
//    s Gitter us Code – und kei Einbrächer, wo s bricht.
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
  // Fernbedienung für die Kamera (drehen und zoomen).
  const controls = useRef<OrbitControlsImpl | null>(null);
  // Die wichtigsten Masse aus dem Bauplan holen.
  const { wall, openingW, openingH, frameW, frameH, gitterZ, frameShape } =
    geometry;
  // sillY = Höhe der Fensterbank. openBot = Unterkante des Fensterlochs.
  const sillY = geometry.dimensions[1]?.start[1] ?? 0.9;
  const openBot = Math.max(0.2, sillY - 0.02);
  // Die Wand ist dick; ihre Mitte liegt eine halbe Wanddicke hinter der Vorderseite.
  const wallZ = -wall.thickness / 2;
  // Rahmenrohr: wie hoch (frameT) und wie breit (frameB)? Sonst 3 cm.
  const frameT = frameShape.hM ?? frameShape.dM ?? 0.03;
  const frameB = frameShape.wM ?? frameShape.dM ?? 0.03;

  // wandTeil: Ein kleiner Baustein-Helfer, der ein Stück Wand als Klotz baut.
  // Wir brauchen vier davon, um ein Loch für das Fenster frei zu lassen.
  // 🤧 Schnupfspruch: Vier Chlötz um es Loch, und fertig isch d Wand –
  //    so baut me es Fäischter, ganz ohni Zement a de Hand.
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

  // Oberkante des Fensterlochs und Breite der Wandstücke links und rechts:
  // (ganze Wand − Loch) ÷ 2, weil es zwei gleich breite Seiten gibt.
  const openTop = openBot + openingH;
  const seitenW = (wall.width - openingW) / 2;

  // Die Bühne aufbauen.
  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.2, 1.8, 2.6], fov: 42 }}
      shadows={!mobile}
    >
      {/* Kamera, Hintergrund und zwei Lampen (Himmel und Sonne). */}
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
      {/* Wie vier Bauklötze ums Loch: unten, oben, links und rechts. */}
      {wandTeil(0, openBot / 2, wall.width, openBot, 'unten')}
      {wandTeil(0, openTop + (wall.height - openTop) / 2, wall.width, wall.height - openTop, 'oben')}
      {wandTeil(-(openingW / 2 + seitenW / 2), openBot + openingH / 2, seitenW, openingH, 'links')}
      {wandTeil(openingW / 2 + seitenW / 2, openBot + openingH / 2, seitenW, openingH, 'rechts')}

      {/* Fensterglas mit Rahmenandeutung */}
      {/* Das Glas ist halb durchsichtig und leicht bläulich. */}
      {/* 🤧 Schnupfspruch: Hinder em Gitter s Glas, hinder em Glas s Chind –
            es lueget use und winkt em Schmied – so gschwind! */}
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
      {/* Oberes und unteres Rahmenrohr (liegend). */}
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
      {/* Linkes (-1) und rechtes (+1) Rahmenrohr (stehend). */}
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
      {/* Jeder Stab ist eine stehende Eisenstange. */}
      {/* 🤧 Schnupfspruch: Stab für Stab wie Zaunlatte im Garte –
            die stönd ganz still und tüend geduldig warte. */}
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
      {/* Quergurte liegen waagrecht über den Stäben. */}
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
      {/* Verzierungen aus dem Schmiede-Katalog. */}
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
      {/* Jede Lasche: ein Metallplättchen plus ein kleiner Anker (Zylinder) in die Wand. */}
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

      {/* Masslinien, falls eingeschaltet. */}
      {showDimensions &&
        geometry.dimensions.map((dim, i) => <DimensionLine key={i} dim={dim} />)}

      {/* Schattenboden und Bodenraster. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <gridHelper args={[16, 32, '#c9c5bd', '#dedbd5']} />

      {/* Kamera mit Maus oder Finger drehen – wie einen Globus. */}
      {/* 🤧 Schnupfspruch: Rundume luege, zoome und dräihe –
            am Gitter gits nüt z chlage, nume z bestaune – juhe! */}
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
