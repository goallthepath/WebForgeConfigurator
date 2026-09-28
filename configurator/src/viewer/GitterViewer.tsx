import { lazy, Suspense, useMemo, useState } from 'react';
import type { FenstergitterGeometry } from '../products/fenstergitter/geometry';
import type { ViewPreset } from './scene-shared';
import { tr } from '../i18n';

const GitterSceneLazy = lazy(() =>
  import('./GitterScene').then((m) => ({ default: m.GitterScene }))
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
  { id: '2d', label: 'Zeichnung' },
];

/** 2D-Frontzeichnung des Gitters (Fallback und PDF-Basis). */
function GitterElevation({ geometry }: { geometry: FenstergitterGeometry }) {
  const { frameW, frameH, frameShape } = geometry;
  if (frameW <= 0 || frameH <= 0) return null;
  const t = frameShape.hM ?? frameShape.dM ?? 0.03;
  const pad = 0.3;
  return (
    <svg
      viewBox={`${-frameW / 2 - pad} ${-frameH - pad} ${frameW + 2 * pad} ${frameH + 2 * pad}`}
      className="elevation-svg"
      role="img"
      aria-label={tr('Masszeichnung des Fenstergitters (Frontansicht)')}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Rahmen */}
      <rect x={-frameW / 2} y={-frameH} width={frameW} height={frameH} fill="none" stroke="#1f2124" strokeWidth={t} />
      {/* Stäbe */}
      {geometry.stäbe.map((stab, i) => {
        const w = stab.shape.dM ?? stab.shape.wM ?? 0.012;
        return (
          <rect
            key={`s-${i}`}
            x={stab.x - w / 2}
            y={-frameH + t}
            width={w}
            height={frameH - 2 * t}
            fill="#43484e"
          />
        );
      })}
      {/* Quergurte (yBot = Unterkante Rahmen als SVG-Nullpunkt) */}
      {geometry.gurte.map((gurt, i) => (
        <rect
          key={`q-${i}`}
          x={gurt.x1}
          y={-(gurt.y - geometry.dimensions[1].start[1]) - t * 0.4}
          width={gurt.x2 - gurt.x1}
          height={t * 0.8}
          fill="#1f2124"
        />
      ))}
      {/* Zierelemente angedeutet */}
      {geometry.ornaments.map((orn, i) => (
        <circle
          key={`o-${i}`}
          cx={orn.center[0]}
          cy={-(orn.center[1] - geometry.dimensions[1].start[1])}
          r={orn.sizeM / 2}
          fill="none"
          stroke="#43484e"
          strokeWidth={0.01}
        />
      ))}
      {/* Massketten */}
      <g stroke="#a8763e" strokeWidth={0.012}>
        <line x1={-frameW / 2} y1={0.14} x2={frameW / 2} y2={0.14} />
        <text x={0} y={0.26} fontSize={0.11} fill="#43484e" stroke="none" textAnchor="middle">
          {Math.round(frameW * 1000)} mm
        </text>
        <line x1={frameW / 2 + 0.12} y1={0} x2={frameW / 2 + 0.12} y2={-frameH} />
        <text
          x={frameW / 2 + 0.22}
          y={-frameH / 2}
          fontSize={0.11}
          fill="#43484e"
          stroke="none"
          textAnchor="middle"
          transform={`rotate(-90 ${frameW / 2 + 0.22} ${-frameH / 2})`}
        >
          {Math.round(frameH * 1000)} mm
        </text>
      </g>
    </svg>
  );
}

export function GitterViewer({
  geometry,
  color,
  empty,
}: {
  geometry: FenstergitterGeometry;
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
      <div className="viewer-shell" role="img" aria-label={tr('Produktvorschau')}>
        <p className="viewer-empty">
          {tr('Die 3D-Vorschau erscheint, sobald die Fenstermasse erfasst sind.')}
        </p>
      </div>
    );
  }

  const show3d = webgl && view !== '2d';

  return (
    <div className="viewer-block">
      <div className="viewer-toolbar" role="toolbar" aria-label={tr('Ansicht wählen')}>
        {VIEWS.filter((v) => webgl || v.id === '2d').map((v) => (
          <button
            key={v.id}
            type="button"
            className={view === v.id ? 'active' : ''}
            onClick={() => setView(v.id)}
          >
            {tr(v.label)}
          </button>
        ))}
        <label className="dims-toggle">
          <input
            type="checkbox"
            checked={showDims}
            onChange={(e) => setShowDims(e.target.checked)}
          />
          {tr('Masslinien')}
        </label>
      </div>
      <div className="viewer-shell">
        {show3d ? (
          <Suspense fallback={<p className="viewer-empty">{tr('3D-Vorschau wird geladen …')}</p>}>
            <GitterSceneLazy
              geometry={geometry}
              color={color}
              showDimensions={showDims}
              view={view as ViewPreset}
              mobile={mobile}
            />
          </Suspense>
        ) : (
          <GitterElevation geometry={geometry} />
        )}
      </div>
      {!webgl && (
        <p className="field-hint">
          {tr(
            'Ihr Gerät unterstützt kein 3D – die Zeichnung zeigt Ihr Gitter massstäblich. Die Konfiguration funktioniert vollständig.'
          )}
        </p>
      )}
    </div>
  );
}
