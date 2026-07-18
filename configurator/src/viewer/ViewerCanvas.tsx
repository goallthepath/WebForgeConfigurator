import { Canvas } from '@react-three/fiber';

/**
 * Minimale R3F-Szene als Grundgerüst. Wird in Phase 5 durch das aus dem
 * Geometriemodell abgeleitete Produktmodell ersetzt (Profile aus dem
 * Katalog steuern dann die Querschnitte – ADR-002).
 */
export default function ViewerCanvas() {
  return (
    <Canvas camera={{ position: [2.5, 1.8, 2.5], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      {/* Platzhaltergeometrie – bewusst abstrakt, kein Produkt. */}
      <mesh rotation={[0, Math.PI / 5, 0]}>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color="#43484e" metalness={0.6} roughness={0.4} />
      </mesh>
      <gridHelper args={[6, 12, '#a8763e', '#c9c5bd']} />
    </Canvas>
  );
}
