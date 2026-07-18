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
  const { rahmenShape, stabShape, hoeheM, bodenM } = geometry;
  const rT = rahmenShape.hM ?? rahmenShape.dM ?? 0.03;
  const rB = rahmenShape.wM ?? rahmenShape.dM ?? 0.03;
  const innenH = hoeheM - bodenM - 2 * rT;
  const b = fluegel.breiteM;
  const r = fluegel.richtung; // +1: Flügel erstreckt sich nach +x von der Bandachse

  const panelMaterial = useMemo(() => {
    if (!geometry.panelFill) return null;
    if (geometry.panelFill === 'blech-voll') {
      return <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />;
    }
    let kind = geometry.panelFill.replace(/^blech-/, '');
    if (kind === 'laser' && geometry.motiv && geometry.motiv !== 'schlitze') {
      kind = `laser-${geometry.motiv}`;
    }
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
      {panelMaterial && (
        <mesh position={[r * (b / 2), bodenM + rT + innenH / 2, 0]}>
          <boxGeometry args={[b - 2 * rB, innenH, 0.005]} />
          {panelMaterial}
        </mesh>
      )}
      {geometry.ornamentTyp && (
        <OrnamentMesh
          kind={geometry.ornamentTyp}
          center={[r * (b / 2), bodenM + rT + innenH / 2, 0]}
          sizeM={Math.min(b * 0.4, innenH * 0.45)}
          color={color}
        />
      )}

      {/* Bänder an der Drehachse */}
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
  const controls = useRef<OrbitControlsImpl | null>(null);
  // Betrachter steht aussen (+z): «aussen» öffnet zum Betrachter.
  const zSign = oeffnungsrichtung === 'aussen' ? 1 : -1;

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.6, 1.5, 2.8], fov: 42 }}
      shadows={!mobile}
    >
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
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
        minDistance={0.8}
        maxDistance={16}
      />
    </Canvas>
  );
}
