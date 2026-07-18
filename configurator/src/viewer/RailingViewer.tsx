import { lazy, Suspense, useMemo, useState } from 'react';
import type { RailingGeometry } from '../products/gelaender/geometry';
import { ElevationSvg } from './ElevationSvg';
import type { ViewPreset } from './RailingScene';

const RailingSceneLazy = lazy(() =>
  import('./RailingScene').then((m) => ({ default: m.RailingScene }))
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const VIEWS: { id: ViewPreset | '2d'; label: string }[] = [
  { id: 'perspektive', label: 'Perspektive' },
  { id: 'front', label: 'Front' },
  { id: 'seite', label: 'Seite' },
  { id: 'oben', label: 'Oben' },
  { id: '2d', label: 'Zeichnung' },
];

/**
 * Viewer-Hülle: Ansichts-Presets, Masslinien-Schalter, 3D-Szene
 * (lazy geladen) und 2D-Zeichnung als gleichwertige Ansicht sowie
 * automatischer Fallback ohne WebGL.
 */
export function RailingViewer({
  geometry,
  color,
  empty,
}: {
  geometry: RailingGeometry;
  color: string;
  empty: boolean;
}) {
  const webgl = useMemo(supportsWebGL, []);
  const mobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
    []
  );
  const [view, setView] = useState<ViewPreset | '2d'>('perspektive');
  const [showDims, setShowDims] = useState(true);

  if (empty) {
    return (
      <div className="viewer-shell" role="img" aria-label="Produktvorschau">
        <p className="viewer-empty">
          Die 3D-Vorschau erscheint, sobald Form und Masse gewählt sind.
        </p>
      </div>
    );
  }

  const show3d = webgl && view !== '2d';

  return (
    <div className="viewer-block">
      <div className="viewer-toolbar" role="toolbar" aria-label="Ansicht wählen">
        {VIEWS.filter((v) => webgl || v.id === '2d').map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? 'active' : ''}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
        <label className="dims-toggle">
          <input
            type="checkbox"
            checked={showDims}
            onChange={(e) => setShowDims(e.target.checked)}
          />
          Masslinien
        </label>
      </div>
      <div className="viewer-shell">
        {show3d ? (
          <Suspense fallback={<p className="viewer-empty">3D-Vorschau wird geladen …</p>}>
            <RailingSceneLazy
              geometry={geometry}
              color={color}
              showDimensions={showDims}
              view={view as ViewPreset}
              mobile={mobile}
            />
          </Suspense>
        ) : (
          <ElevationSvg geometry={geometry} />
        )}
      </div>
      {!webgl && (
        <p className="field-hint">
          Ihr Gerät unterstützt kein 3D – die Zeichnung zeigt Ihre Konfiguration
          massstäblich. Die Konfiguration funktioniert vollständig.
        </p>
      )}
    </div>
  );
}
