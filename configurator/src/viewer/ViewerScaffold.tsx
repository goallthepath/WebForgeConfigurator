import { lazy, Suspense, useMemo } from 'react';

/**
 * 3D-Viewer-Grundgerüst (3D-001).
 *
 * Verbindlich: Die 3D-Szene verwaltet keine Geschäftsdaten – sie erhält
 * später ausschliesslich ein berechnetes Geometriemodell. Three.js wird
 * lazy geladen, damit der Konfigurator ohne 3D bedienbar bleibt; ohne
 * WebGL erscheint eine verständliche 2D-Auskunft.
 */

const ViewerCanvas = lazy(() => import('./ViewerCanvas'));

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    );
  } catch {
    return false;
  }
}

export function ViewerScaffold() {
  const webgl = useMemo(supportsWebGL, []);

  if (!webgl) {
    return (
      <div className="viewer-shell" role="img" aria-label="Produktvorschau">
        <p>
          Ihr Gerät unterstützt keine 3D-Darstellung. Die Konfiguration
          funktioniert trotzdem vollständig – eine Masszeichnung erhalten
          Sie in der PDF-Zusammenfassung.
        </p>
      </div>
    );
  }

  return (
    <div className="viewer-shell" aria-label="3D-Produktvorschau">
      <Suspense fallback={<p>3D-Vorschau wird geladen …</p>}>
        <ViewerCanvas />
      </Suspense>
    </div>
  );
}
