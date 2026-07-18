import { lazy, Suspense, useMemo, useState } from 'react';
import type { TreppeGeometry } from '../products/treppe/geometry';
import type { ViewPreset } from './scene-shared';

const TreppeSceneLazy = lazy(() =>
  import('./TreppeScene').then((m) => ({ default: m.TreppeScene }))
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
  { id: 'seite', label: 'Seite' },
  { id: 'front', label: 'Front' },
  { id: '2d', label: 'Schnitt' },
];

/** 2D-Seitenansicht (Treppenschnitt) – Fallback und PDF-Basis. */
function TreppeSchnitt({ geometry }: { geometry: TreppeGeometry }) {
  const { hoeheM: H, lauflaengeM: L } = geometry;
  if (H <= 0) return null;
  const gh = geometry.pfosten[0]?.hoeheM ?? 0;
  const pad = 0.45;
  const stufenPfad: string[] = [`M 0 0`];
  const n = geometry.stufen.length + 1;
  const s = H / n;
  const a = n > 1 ? L / (n - 1) : L;
  for (let k = 1; k <= n; k++) {
    stufenPfad.push(`L ${(k - 1) * a} ${-k * s}`);
    if (k < n) stufenPfad.push(`L ${k * a} ${-k * s}`);
  }
  const bestandFarbe = geometry.treppeBestand ? '#b3b8bc' : '#1f2124';

  return (
    <svg
      viewBox={`${-pad} ${-(H + Math.max(gh, 0.3)) - pad} ${L + 2 * pad + 0.8} ${H + Math.max(gh, 0.3) + 2 * pad}`}
      className="elevation-svg"
      role="img"
      aria-label="Treppenschnitt (Seitenansicht)"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Böden */}
      <line x1={-pad} y1={0} x2={0.4} y2={0} stroke="#6b7178" strokeWidth={0.02} />
      <line x1={L} y1={-H} x2={L + pad + 0.8} y2={-H} stroke="#6b7178" strokeWidth={0.02} />
      {/* Stufenlinie */}
      <path d={stufenPfad.join(' ')} fill="none" stroke={bestandFarbe} strokeWidth={0.03} />
      {/* Wange als Schräge */}
      <line
        x1={0}
        y1={-0.05}
        x2={L}
        y2={-H - 0.05}
        stroke={bestandFarbe}
        strokeWidth={0.09}
        strokeOpacity={geometry.treppeBestand ? 0.6 : 1}
      />
      {/* Geländer */}
      {gh > 0 && (
        <g stroke="#43484e" strokeWidth={0.025}>
          <line x1={0} y1={-gh} x2={L} y2={-H - gh} strokeWidth={0.04} />
          {geometry.pfosten
            .filter((p) => p.base[2] === geometry.pfosten[0].base[2])
            .map((p, i) => (
              <line
                key={i}
                x1={p.base[0]}
                y1={-p.base[1]}
                x2={p.base[0]}
                y2={-(p.base[1] + p.hoeheM)}
              />
            ))}
        </g>
      )}
      {/* Masse */}
      <g stroke="#a8763e" strokeWidth={0.015}>
        <line x1={L + 0.3} y1={0} x2={L + 0.3} y2={-H} />
        <text
          x={L + 0.42}
          y={-H / 2}
          fontSize={0.13}
          fill="#43484e"
          stroke="none"
          textAnchor="middle"
          transform={`rotate(-90 ${L + 0.42} ${-H / 2})`}
        >
          {Math.round(H * 1000)} mm
        </text>
        <line x1={0} y1={0.2} x2={L} y2={0.2} />
        <text x={L / 2} y={0.34} fontSize={0.13} fill="#43484e" stroke="none" textAnchor="middle">
          {Math.round(L * 1000)} mm
        </text>
      </g>
    </svg>
  );
}

export function TreppeViewer({
  geometry,
  color,
  empty,
}: {
  geometry: TreppeGeometry;
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
          Die 3D-Vorschau erscheint, sobald die Geschosshöhe erfasst ist.
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
            <TreppeSceneLazy
              geometry={geometry}
              color={color}
              showDimensions={showDims}
              view={view as ViewPreset}
              mobile={mobile}
            />
          </Suspense>
        ) : (
          <TreppeSchnitt geometry={geometry} />
        )}
      </div>
      {!webgl && (
        <p className="field-hint">
          Ihr Gerät unterstützt kein 3D – der Schnitt zeigt Ihre Treppe
          massstäblich. Die Konfiguration funktioniert vollständig.
        </p>
      )}
    </div>
  );
}
