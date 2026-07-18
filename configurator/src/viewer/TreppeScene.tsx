import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { TreppeGeometry, SchraegRail } from '../products/treppe/geometry';
import {
  CameraRig,
  CONCRETE_COLOR,
  DimensionLine,
  makePatternTexture,
  METAL,
  OrnamentMesh,
  ShapeMesh,
  type ViewPreset,
} from './scene-shared';

/**
 * 3D-Szene Treppe & Treppengeländer. Bei «nur Geländer» erscheint die
 * Bestandstreppe grau-transparent. Rendert ausschliesslich das
 * Geometriemodell (Ebenentrennung).
 */

/** Beliebig geneigter Stab zwischen zwei Punkten (Handlauf an der Schrägen). */
function SlopedRail({
  rail,
  color,
  opacity,
}: {
  rail: SchraegRail;
  color: string;
  opacity?: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...rail.start);
    const end = new THREE.Vector3(...rail.end);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return {
      position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: quat,
      length: len,
    };
  }, [rail]);

  return (
    <mesh position={position} quaternion={quaternion}>
      {rail.shape.kind === 'round' ? (
        <cylinderGeometry
          args={[(rail.shape.dM ?? 0.04) / 2, (rail.shape.dM ?? 0.04) / 2, length, 18]}
        />
      ) : (
        <boxGeometry args={[rail.shape.wM ?? 0.03, length, rail.shape.hM ?? 0.03]} />
      )}
      <meshStandardMaterial
        color={color}
        {...METAL}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

export function TreppeScene({
  geometry,
  color,
  showDimensions,
  view,
  mobile,
}: {
  geometry: TreppeGeometry;
  color: string;
  showDimensions: boolean;
  view: ViewPreset;
  mobile: boolean;
}) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const bestand = geometry.treppeBestand;
  const treppenFarbe = bestand ? '#9aa0a5' : color;
  const treppenOpacity = bestand ? 0.45 : 1;

  const stufenMaterial = useMemo(() => {
    if (geometry.stufentyp === 'gitterrost') {
      const map = makePatternTexture('drahtgitter');
      map.repeat.set(8, 24);
      return (
        <meshStandardMaterial
          color={treppenFarbe}
          {...METAL}
          alphaMap={map}
          alphaTest={0.4}
          side={THREE.DoubleSide}
          transparent={bestand}
          opacity={treppenOpacity}
        />
      );
    }
    if (geometry.stufentyp === 'traenenblech') {
      const map = makePatternTexture('loch');
      map.repeat.set(6, 18);
      return (
        <meshStandardMaterial
          color={treppenFarbe}
          {...METAL}
          roughness={0.55}
          map={map}
          transparent={bestand}
          opacity={treppenOpacity}
        />
      );
    }
    return (
      <meshStandardMaterial
        color={treppenFarbe}
        {...METAL}
        transparent={bestand}
        opacity={treppenOpacity}
      />
    );
  }, [geometry.stufentyp, treppenFarbe, bestand, treppenOpacity]);

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, 2]}
      camera={{ position: [-1.8, 2.0, 3.0], fov: 42 }}
      shadows={!mobile}
    >
      <CameraRig view={view} bounds={geometry.bounds} controls={controls} />
      <color attach="background" args={['#efedea']} />
      <hemisphereLight intensity={0.55} groundColor="#b0aca4" />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.3}
        castShadow={!mobile}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Boden unten und Podest/Decke oben */}
      <mesh
        position={[geometry.lauflaengeM + 0.55, geometry.hoeheM - 0.11, 0]}
        receiveShadow={!mobile}
      >
        <boxGeometry args={[1.1, 0.22, geometry.breiteM + 0.8]} />
        <meshStandardMaterial color={CONCRETE_COLOR} roughness={0.95} />
      </mesh>

      {/* Tragkonstruktion: Wangen oder Mittelholm (geneigt) */}
      {geometry.traeger.map((traeger, i) => (
        <mesh
          key={`w-${i}`}
          position={traeger.center}
          rotation={[0, 0, traeger.neigungRad]}
          castShadow={!mobile}
        >
          <boxGeometry args={[traeger.laengeM, traeger.hoeheM, traeger.dickeM]} />
          <meshStandardMaterial
            color={treppenFarbe}
            {...METAL}
            transparent={bestand}
            opacity={treppenOpacity}
          />
        </mesh>
      ))}

      {/* Geschlossene Setzstufen */}
      {geometry.setzstufen.map((setz, i) => (
        <mesh key={`sz-${i}`} position={setz.center} castShadow={!mobile}>
          <boxGeometry args={setz.sizeM} />
          <meshStandardMaterial
            color={treppenFarbe}
            {...METAL}
            transparent={bestand}
            opacity={treppenOpacity}
          />
        </mesh>
      ))}

      {/* Trittstufen */}
      {geometry.stufen.map((stufe, i) => (
        <mesh key={`s-${i}`} position={stufe.center} castShadow={!mobile}>
          <boxGeometry args={stufe.sizeM} />
          {stufenMaterial}
        </mesh>
      ))}

      {/* Geländer: Pfosten, Handlauf/Gurte, Füllstäbe */}
      {geometry.pfosten.map((post, i) => (
        <mesh
          key={`p-${i}`}
          position={[post.base[0], post.base[1] + post.hoeheM / 2, post.base[2]]}
          castShadow={!mobile}
        >
          <ShapeMesh shape={post.shape} lengthM={post.hoeheM} color={color} />
        </mesh>
      ))}
      {geometry.rails.map((rail, i) => (
        <SlopedRail key={`r-${i}`} rail={rail} color={color} />
      ))}
      {geometry.staebe.map((stab, i) => (
        <mesh
          key={`st-${i}`}
          position={[stab.base[0], stab.base[1] + stab.hoeheM / 2, stab.base[2]]}
        >
          <ShapeMesh shape={stab.shape} lengthM={stab.hoeheM} color={color} />
        </mesh>
      ))}
      {/* Handlauf-Abschlüsse */}
      {geometry.endCaps.map((cap, i) => {
        const r = (cap.shape.dM ?? cap.shape.hM ?? 0.04) / 2;
        const dirX = cap.dir[0] >= 0 ? 1 : -1;
        if (cap.kind === 'gerade') return null;
        if (cap.kind === 'kugel') {
          return (
            <mesh
              key={`cap-${i}`}
              position={[cap.position[0] + dirX * r * 1.4, cap.position[1], cap.position[2]]}
            >
              <sphereGeometry args={[r * 1.8, 18, 18]} />
              <meshStandardMaterial color={color} {...METAL} roughness={0.32} />
            </mesh>
          );
        }
        if (cap.kind === 'kugel-drittel') {
          return (
            <mesh
              key={`cap-${i}`}
              position={cap.position}
              rotation={[0, 0, dirX > 0 ? -Math.PI / 2 : Math.PI / 2]}
              scale={[0.45, 1, 1]}
            >
              <sphereGeometry args={[r * 1.05, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={color} {...METAL} side={THREE.DoubleSide} />
            </mesh>
          );
        }
        // Endbogen: Viertel-Torus nach unten plus kurzer Abgang.
        const bogenR = Math.max(r * 2.2, 0.05);
        return (
          <group
            key={`cap-${i}`}
            position={cap.position}
            rotation={[0, dirX > 0 ? 0 : Math.PI, 0]}
          >
            <mesh position={[0, -bogenR, 0]}>
              <torusGeometry args={[bogenR, r, 14, 20, Math.PI / 2]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
            <mesh position={[bogenR, -bogenR - 0.05, 0]}>
              <cylinderGeometry args={[r, r, 0.1, 14]} />
              <meshStandardMaterial color={color} {...METAL} />
            </mesh>
          </group>
        );
      })}

      {geometry.ornamentTyp &&
        geometry.ornamentZentren.map((zentrum, i) => (
          <OrnamentMesh
            key={`orn-${i}`}
            kind={geometry.ornamentTyp!}
            center={zentrum}
            sizeM={geometry.ornamentSizeM}
            color={color}
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
        maxDistance={18}
      />
    </Canvas>
  );
}
