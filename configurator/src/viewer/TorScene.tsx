// Hier wird das Gartentor wirklich in 3D gebaut – mit der Bibliothek Three.js.
// Stell dir eine kleine Bühne vor: Licht an, Boden hin, Pfosten aufstellen,
// Flügel einhängen. Die Flügel können sich um ihre Scharniere drehen,
// genau wie eine Schranktür.
import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type {
  GartentorGeometry,
  TorFluegel,
} from '../products/gartentor/geometry';
import {
  CameraRig,
  CONCRETE_COLOR,
  DimensionLine,
  makePatternTexture,
  METAL,
  OrnamentMesh,
  PATTERN_TILE_M,
  ShapeMesh,
  type ViewPreset,
} from './scene-shared';

/**
 * 3D-Szene Gartentor mit animierbarer Flügelöffnung (öffnungGrad 0–95°).
 * Rendert ausschliesslich das Geometriemodell (Ebenentrennung).
 */

// Fluegel: Baut EINEN Torflügel aus Rahmen, Stäben, Blech, Scharnieren und Schloss.
// Der ganze Flügel ist eine Gruppe, die sich wie ein Stück um das Scharnier dreht.
// 🤧 Schnupfspruch: De Flügel dräiht sich um sis Band
//    wie s Chind am Karussell – rundume, Hand in Hand.
function Fluegel({
  fluegel,
  geometry,
  color,
  winkelRad,
  mobile,
}: {
  fluegel: TorFluegel;
  geometry: GartentorGeometry;
  color: string;
  winkelRad: number;
  mobile: boolean;
}) {
  // Masse aus dem Bauplan holen.
  const { rahmenShape, stabShape, hoeheM, bodenM } = geometry;
  // rT = wie hoch das Rahmenrohr ist, rB = wie breit. Unbekannt? 3 cm.
  const rT = rahmenShape.hM ?? rahmenShape.dM ?? 0.03;
  const rB = rahmenShape.wM ?? rahmenShape.dM ?? 0.03;
  // Innenhöhe = Flügelhöhe minus oben und unten je ein Rahmenrohr.
  const innenH = hoeheM - bodenM - 2 * rT;
  // b = Breite des Flügels; r = in welche Richtung er vom Scharnier weggeht.
  const b = fluegel.breiteM;
  const r = fluegel.richtung; // +1: Flügel erstreckt sich nach +x von der Bandachse

  // Das Material für eine Blechfüllung. useMemo merkt es sich, damit wir das
  // Lochmuster nicht bei jedem Bild neu malen müssen.
  const panelMaterial = useMemo(() => {
    if (!geometry.panelFill) return null;
    // Volles Blech: einfach eine glatte Metallfläche.
    if (geometry.panelFill === 'blech-voll') {
      return <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />;
    }
    // Gelochtes Blech oder Laser-Motiv: Wir malen ein Muster, das Löcher
    // durchsichtig macht (wie ein Scherenschnitt).
    let kind = geometry.panelFill.replace(/^blech-/, '');
    if (kind === 'laser' && geometry.motiv && geometry.motiv !== 'schlitze') {
      kind = `laser-${geometry.motiv}`;
    }
    // Das Muster ist eine kleine Kachel. Wie oft passt sie in die Fläche?
    // Breite ÷ Kachelgrösse = so oft nebeneinander, Höhe ÷ Kachelgrösse = so oft übereinander.
    const texture = makePatternTexture(kind);
    const tile = PATTERN_TILE_M[kind] ?? 0.08;
    texture.repeat.set((b - 2 * rB) / tile, innenH / tile);
    return (
      <meshStandardMaterial
        color={color}
        {...METAL}
        alphaMap={texture}
        alphaTest={0.5}
        side={THREE.DoubleSide}
      />
    );
  }, [geometry.panelFill, geometry.motiv, b, rB, innenH, color]);

  // Die ganze Gruppe steht beim Scharnier und wird um die senkrechte Achse gedreht.
  return (
    <group position={[fluegel.hingeX, 0, 0]} rotation={[0, winkelRad, 0]}>
      {/* Rahmen: 2 horizontal, 2 vertikal */}
      {[bodenM + rT / 2, hoeheM - rT / 2].map((y, i) => (
        <mesh
          key={`h-${i}`}
          position={[r * (b / 2), y, 0]}
          rotation={[Math.PI / 2, 0, Math.PI / 2]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={rahmenShape} lengthM={b} color={color} />
        </mesh>
      ))}
      {/* Die zwei senkrechten Rahmenrohre, links und rechts. */}
      {[rB / 2, b - rB / 2].map((off, i) => (
        <mesh
          key={`v-${i}`}
          position={[r * off, bodenM + (hoeheM - bodenM) / 2, 0]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={rahmenShape} lengthM={hoeheM - bodenM} color={color} />
        </mesh>
      ))}

      {/* Füllung */}
      {fluegel.stabOffsetsM.map((off, i) => (
        <mesh
          key={`s-${i}`}
          position={[r * off, bodenM + rT + innenH / 2, 0]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={stabShape} lengthM={innenH} color={color} />
        </mesh>
      ))}
      {/* Blechfüllung als dünne Platte (5 mm). */}
      {panelMaterial && (
        <mesh position={[r * (b / 2), bodenM + rT + innenH / 2, 0]}>
          <boxGeometry args={[b - 2 * rB, innenH, 0.005]} />
          {panelMaterial}
        </mesh>
      )}
      {/* Geschmiedetes Ornament in der Mitte des Flügels. */}
      {geometry.ornamentTyp && (
        <OrnamentMesh
          kind={geometry.ornamentTyp}
          center={[r * (b / 2), bodenM + rT + innenH / 2, 0]}
          sizeM={Math.min(b * 0.4, innenH * 0.45)}
          color={color}
        />
      )}

      {/* Bänder an der Drehachse */}
      {/* Jedes Band ist ein kleiner Zylinder, wie eine Garnrolle. */}
      {/* 🤧 Schnupfspruch: Drü Bänder am Flügel, jedes guet gschmiert –
            so gaht s Tor ganz liisli, und niemer wird gstört. */}
      {fluegel.bandYs.map((y, i) => (
        <mesh key={`band-${i}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.07, 14]} />
          <meshStandardMaterial color="#3c4247" metalness={0.75} roughness={0.3} />
        </mesh>
      ))}

      {/* Schloss und Drücker an der Schliesskante */}
      {fluegel.mitSchloss && (
        <group position={[r * (b - rB / 2), bodenM + (hoeheM - bodenM) * 0.55, 0]}>
          <mesh>
            <boxGeometry args={[0.035, 0.16, 0.045]} />
            <meshStandardMaterial color={color} {...METAL} />
          </mesh>
          {/* Ein Drücker auf jeder Seite: einer aussen, einer innen. */}
          {[0.028, -0.028].map((z, i) => (
            <group key={i} position={[0, 0.02, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.007, 0.007, 0.02, 10]} />
                <meshStandardMaterial color="#2c2f33" metalness={0.8} roughness={0.25} />
              </mesh>
              <mesh position={[-r * 0.045, 0, z > 0 ? 0.012 : -0.012]}>
                <boxGeometry args={[0.1, 0.012, 0.012]} />
                <meshStandardMaterial color="#2c2f33" metalness={0.8} roughness={0.25} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

// TorScene: Die ganze Bühne mit Kamera, Licht, Boden, Pfosten und Flügeln.
// 🤧 Schnupfspruch: Chamera, Liecht und Bode – d Bühni isch parat,
//    jetzt tritt s Törli uf, ganz elegant und grad.
export function TorScene({
  geometry,
  color,
  showDimensions,
  view,
  mobile,
  oeffnungGrad,
  oeffnungsrichtung,
}: {
  geometry: GartentorGeometry;
  color: string;
  showDimensions: boolean;
  view: ViewPreset;
  mobile: boolean;
  /** 0–95° Flügelöffnung (nur Vorschau). */
  oeffnungGrad: number;
  oeffnungsrichtung: 'innen' | 'aussen';
}) {
  // Die Fernbedienung für die Kamera (drehen, zoomen).
  const controls = useRef<OrbitControlsImpl | null>(null);
  // zSign ist +1 oder -1 und sagt, ob der Flügel zu uns her oder von uns weg aufgeht.
  // Betrachter steht aussen (+z): «aussen» öffnet zum Betrachter.
  const zSign = oeffnungsrichtung === 'aussen' ? 1 : -1;

  // Die Bühne (Canvas). Auf Handys etwas weniger scharf, damit es flüssig läuft.
  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.6, 1.5, 2.8], fov: 42 }}
      shadows={!mobile}
    >
      {/* Die Kamera fährt zum gewählten Blickwinkel. */}
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
      {/* Hintergrundfarbe und zwei Lampen: Himmelslicht und eine «Sonne» mit Schatten. */}
      <color attach="background" args={['#efedea']} />
      <hemisphereLight intensity={0.55} groundColor="#b0aca4" />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.3}
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Seiten: Mauer oder Torpfosten */}
      {geometry.seiten.map((el, i) =>
        el.kind === 'mauer' ? (
          <mesh key={i} position={el.center} castShadow={!mobile} receiveShadow>
            <boxGeometry args={el.sizeM} />
            <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.95} />
          </mesh>
        ) : (
          <mesh key={i} position={el.center} castShadow={!mobile}>
            <ShapeMesh
              shape={el.shape ?? { kind: 'box', wM: 0.08, hM: 0.08 }}
              lengthM={el.sizeM[1]}
              color={color}
            />
          </mesh>
        )
      )}

      {/* Winkel: Grad in Bogenmass umrechnen (180° = π). Richtung und innen/aussen
          bestimmen, ob plus oder minus gedreht wird. */}
      {/* Flügel (Öffnungswinkel je Bandseite gespiegelt) */}
      {geometry.fluegel.map((fluegel, i) => (
        <Fluegel
          key={i}
          fluegel={fluegel}
          geometry={geometry}
          color={color}
          winkelRad={
            fluegel.richtung * zSign * -THREE.MathUtils.degToRad(oeffnungGrad)
          }
          mobile={mobile}
        />
      ))}

      {/* Masslinien, falls eingeschaltet. */}
      {showDimensions &&
        geometry.dimensions.map((dim, i) => <DimensionLine key={i} dim={dim} />)}

      {/* Unsichtbarer Boden, der nur Schatten fängt, und ein Gitter-Muster am Boden. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
      <gridHelper args={[16, 32, '#c9c5bd', '#dedbd5']} />

      {/* Mit Maus oder Finger die Kamera drehen – wie einen Globus. */}
      {/* 🤧 Schnupfspruch: Dräih d Wält um s Törli, nöd s Törli um d Wält –
            im 3D isch das gratis, im Garte chostet s Gäld. */}
      <OrbitControls
        ref={controls}
        enableDamping
        maxPolarAngle={Math.PI / 2.05}
        minDistance={0.8}
        maxDistance={16}
      />
    </Canvas>
  );
}
