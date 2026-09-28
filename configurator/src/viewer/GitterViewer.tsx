// Das Schaufenster fürs Fenstergitter: Hier sieht man das Gitter in 3D
// oder – wenn der Computer kein 3D kann – als flache Zeichnung.
// Oben gibt es Knöpfe für verschiedene Blickwinkel und für die Masslinien.
import { lazy, Suspense, useMemo, useState } from 'react';
import type { FenstergitterGeometry } from '../products/fenstergitter/geometry';
import type { ViewPreset } from './scene-shared';
import { tr } from '../i18n';

// Die 3D-Szene wird erst geladen, wenn man sie braucht («lazy» = faul).
const GitterSceneLazy = lazy(() =>
  import('./GitterScene').then((m) => ({ default: m.GitterScene }))
);

// Kann dieser Computer 3D zeichnen? Wir probieren es mit einer unsichtbaren Leinwand aus.
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Die Blickwinkel-Knöpfe: schräg, von vorne, von der Seite oder als Zeichnung.
const VIEWS: { id: ViewPreset | '2d'; label: string }[] = [
  { id: 'perspektive', label: 'Perspektive' },
  { id: 'front', label: 'Front' },
  { id: 'seite', label: 'Seite' },
  { id: '2d', label: 'Zeichnung' },
];

// GitterElevation: Das Gitter flach von vorne gezeichnet, wie mit Lineal und Bleistift.
// 🤧 Schnupfspruch: Es Lineal, en Bleistift, es Blatt und es Gitter druf –
//    so plant de Schmied, bevor er am Amboss haut druf.
/** 2D-Frontzeichnung des Gitters (Fallback und PDF-Basis). */
function GitterElevation({ geometry }: { geometry: FenstergitterGeometry }) {
  // Masse holen. Kein Gitter? Dann nichts zeichnen.
  const { frameW, frameH, frameShape } = geometry;
  if (frameW <= 0 || frameH <= 0) return null;
  // Rahmendicke (sonst 3 cm) und etwas Rand für die Masslinien.
  const t = frameShape.hM ?? frameShape.dM ?? 0.03;
  const pad = 0.3;
  // In SVG zeigt y nach unten – darum die Minuszeichen bei den Höhen.
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
        // Stabdicke (sonst 12 mm), dann einen schmalen, hohen Balken zeichnen.
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
      {/* Jeder Quergurt ist ein flacher, breiter Balken quer über das Gitter. */}
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
      {/* 🤧 Schnupfspruch: Es Gitter mit Mass, es Mass mit Pfiil –
            de Schlosser isch zfride, und de Kunde lachet vil. */}
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

// GitterViewer: Rahmen mit Knöpfen und dem Bild (3D oder Zeichnung).
export function GitterViewer({
  geometry,
  color,
  empty,
}: {
  geometry: FenstergitterGeometry;
  color: string;
  empty: boolean;
}) {
  // Einmal testen, ob 3D geht, und das Ergebnis merken.
  const webgl = useMemo(supportsWebGL, []);
  // Kleiner Bildschirm? Dann sparsamer rechnen.
  const mobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
    []
  );
  // Gewählter Blickwinkel und ob die Masslinien sichtbar sind.
  const [view, setView] = useState<ViewPreset | '2d'>('perspektive');
  const [showDims, setShowDims] = useState(true);

  // Noch keine Masse? Dann nur ein freundlicher Hinweis.
  if (empty) {
    return (
      <div className="viewer-shell" role="img" aria-label={tr('Produktvorschau')}>
        <p className="viewer-empty">
          {tr('Die 3D-Vorschau erscheint, sobald die Fenstermasse erfasst sind.')}
        </p>
      </div>
    );
  }

  // 3D nur, wenn möglich UND nicht «Zeichnung» gewählt.
  const show3d = webgl && view !== '2d';

  // 🤧 Schnupfspruch: Vo vorne es Gitter, vo de Siite en Strich –
  //    so dünn isch s Iise, und glich hebt s fürchterlich.
  return (
    <div className="viewer-block">
      {/* Knopfleiste: Blickwinkel und Masslinien. */}
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
      {/* Entweder 3D (mit Ladehinweis) oder die flache Zeichnung. */}
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
      {/* Ohne 3D erklären wir, dass die Zeichnung massstäblich und genauso gut ist. */}
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
