import { lazy, Suspense, useMemo, useState } from 'react';
import type { GartentorGeometry } from '../products/gartentor/geometry';
import type { ViewPreset } from './scene-shared';
import { tr } from '../i18n';

const TorSceneLazy = lazy(() =>
  import('./TorScene').then((m) => ({ default: m.TorScene }))
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
  { id: 'oben', label: 'Oben' },
  { id: '2d', label: 'Zeichnung' },
];

/** 2D-Frontzeichnung des geschlossenen Tors. */
function TorElevation({ geometry }: { geometry: GartentorGeometry }) {
  const { oeffnungM, hoeheM, bodenM, rahmenShape } = geometry;
  if (oeffnungM <= 0 || hoeheM <= 0) return null;
  const t = rahmenShape.hM ?? rahmenShape.dM ?? 0.03;
  const b = rahmenShape.wM ?? rahmenShape.dM ?? 0.03;
  const pad = 0.45;
  return (
    <svg
      viewBox={`${-oeffnungM / 2 - pad} ${-hoeheM - pad} ${oeffnungM + 2 * pad} ${hoeheM + 2 * pad}`}
      className="elevation-svg"
      role="img"
      aria-label={tr('Masszeichnung des Gartentors (Frontansicht, geschlossen)')}
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={-oeffnungM / 2 - pad}
        y1={0}
        x2={oeffnungM / 2 + pad}
        y2={0}
        stroke="#6b7178"
        strokeWidth={0.02}
      />
      {/* Seiten */}
      {geometry.seiten.map((el, i) => (
        <rect
          key={`seite-${i}`}
          x={el.center[0] - el.sizeM[0] / 2}
          y={-el.center[1] - el.sizeM[1] / 2}
          width={el.sizeM[0]}
          height={el.sizeM[1]}
          fill={el.kind === 'mauer' ? '#c6c2ba' : '#43484e'}
        />
      ))}
      {/* Flügel */}
      {geometry.fluegel.map((fl, i) => {
        const x0 = fl.richtung === 1 ? fl.hingeX : fl.hingeX - fl.breiteM;
        return (
          <g key={`fl-${i}`}>
            <rect
              x={x0}
              y={-hoeheM}
              width={fl.breiteM}
              height={hoeheM - bodenM}
              fill="none"
              stroke="#1f2124"
              strokeWidth={t}
            />
            {fl.stabOffsetsM.map((off, s) => {
              const w = geometry.stabShape.dM ?? geometry.stabShape.wM ?? 0.012;
              const x = fl.hingeX + fl.richtung * off;
              return (
                <rect
                  key={s}
                  x={x - w / 2}
                  y={-hoeheM + t}
                  width={w}
                  height={hoeheM - bodenM - 2 * t}
                  fill="#43484e"
                />
              );
            })}
            {geometry.panelFill && (
              <rect
                x={x0 + b}
                y={-hoeheM + t}
                width={fl.breiteM - 2 * b}
                height={hoeheM - bodenM - 2 * t}
                fill="#8a9096"
                fillOpacity={geometry.panelFill === 'blech-voll' ? 1 : 0.5}
              />
            )}
          </g>
        );
      })}
      {/* Massketten */}
      <g stroke="#a8763e" strokeWidth={0.015}>
        <line x1={-oeffnungM / 2} y1={0.2} x2={oeffnungM / 2} y2={0.2} />
        <text x={0} y={0.34} fontSize={0.13} fill="#43484e" stroke="none" textAnchor="middle">
          {Math.round(oeffnungM * 1000)} mm
        </text>
        <line x1={oeffnungM / 2 + 0.25} y1={0} x2={oeffnungM / 2 + 0.25} y2={-hoeheM} />
        <text
          x={oeffnungM / 2 + 0.37}
          y={-hoeheM / 2}
          fontSize={0.13}
          fill="#43484e"
          stroke="none"
          textAnchor="middle"
          transform={`rotate(-90 ${oeffnungM / 2 + 0.37} ${-hoeheM / 2})`}
        >
          {Math.round(hoeheM * 1000)} mm
        </text>
      </g>
    </svg>
  );
}

export function TorViewer({
  geometry,
  color,
  empty,
  oeffnungsrichtung,
}: {
  geometry: GartentorGeometry;
  color: string;
  empty: boolean;
  oeffnungsrichtung: 'innen' | 'aussen';
}) {
  const webgl = useMemo(supportsWebGL, []);
  const mobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
    []
  );
  const [view, setView] = useState<ViewPreset | '2d'>('perspektive');
  const [showDims, setShowDims] = useState(true);
  const [oeffnung, setOeffnung] = useState(0);

  if (empty) {
    return (
      <div className="viewer-shell" role="img" aria-label={tr('Produktvorschau')}>
        <p className="viewer-empty">
          {tr('Die 3D-Vorschau erscheint, sobald Öffnung und Höhe erfasst sind.')}
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
      {show3d && (
        <div className="tor-slider">
          <label htmlFor="tor-oeffnung">{tr('Tor öffnen')}</label>
          <input
            id="tor-oeffnung"
            type="range"
            min={0}
            max={95}
            step={1}
            value={oeffnung}
            onChange={(e) => setOeffnung(Number(e.target.value))}
          />
          <span>{oeffnung}°</span>
        </div>
      )}
      <div className="viewer-shell">
        {show3d ? (
          <Suspense fallback={<p className="viewer-empty">{tr('3D-Vorschau wird geladen …')}</p>}>
            <TorSceneLazy
              geometry={geometry}
              color={color}
              showDimensions={showDims}
              view={view as ViewPreset}
              mobile={mobile}
              oeffnungGrad={oeffnung}
              oeffnungsrichtung={oeffnungsrichtung}
            />
          </Suspense>
        ) : (
          <TorElevation geometry={geometry} />
        )}
      </div>
      {!webgl && (
        <p className="field-hint">
          {tr(
            'Ihr Gerät unterstützt kein 3D – die Zeichnung zeigt Ihr Tor massstäblich. Die Konfiguration funktioniert vollständig.'
          )}
        </p>
      )}
    </div>
  );
}
