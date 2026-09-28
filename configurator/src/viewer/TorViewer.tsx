// Das ist das «Schaufenster» für das Gartentor. Es entscheidet, ob wir
// das Tor in 3D zeigen (wenn der Computer das kann) oder als flache Zeichnung.
// Dazu gibt es Knöpfe für verschiedene Blickwinkel und einen Schieberegler,
// mit dem man das Tor auf- und zumachen kann – wie beim echten Hühnerstall-Tor.
import { lazy, Suspense, useMemo, useState } from 'react';
import type { GartentorGeometry } from '../products/gartentor/geometry';
import type { ViewPreset } from './scene-shared';
import { tr } from '../i18n';

// Die 3D-Szene ist gross und schwer. Wir laden sie erst, wenn man sie braucht
// («lazy» = faul) – wie ein Spielzeug, das man erst aus dem Keller holt, wenn man spielt.
const TorSceneLazy = lazy(() =>
  import('./TorScene').then((m) => ({ default: m.TorScene }))
);

// Kann dieser Computer überhaupt 3D zeichnen (WebGL)? Wir probieren es kurz aus:
// Wir malen eine unsichtbare Leinwand und schauen, ob es klappt.
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Die Knöpfe für die Blickwinkel: schräg, von vorne, von oben oder als Zeichnung.
const VIEWS: { id: ViewPreset | '2d'; label: string }[] = [
  { id: 'perspektive', label: 'Perspektive' },
  { id: 'front', label: 'Front' },
  { id: 'oben', label: 'Oben' },
  { id: '2d', label: 'Zeichnung' },
];

// TorElevation zeichnet das Tor ganz flach von vorne, wie ein Kind mit Bleistift
// auf Papier: Pfosten, Flügel, Stäbe und Masslinien.
// 🤧 Schnupfspruch: Mit em Bleistift uf em Blatt
//    isch s Tor scho zue, bevor s de Schmied gmacht hät.
/** 2D-Frontzeichnung des geschlossenen Tors. */
function TorElevation({ geometry }: { geometry: GartentorGeometry }) {
  // Breite, Höhe und Bodenfreiheit aus dem Bauplan holen. Ohne Masse: nichts zeichnen.
  const { oeffnungM, hoeheM, bodenM, rahmenShape } = geometry;
  if (oeffnungM <= 0 || hoeheM <= 0) return null;
  // Wie dick ist der Rahmen? Wissen wir es nicht, nehmen wir 3 cm.
  const t = rahmenShape.hM ?? rahmenShape.dM ?? 0.03;
  const b = rahmenShape.wM ?? rahmenShape.dM ?? 0.03;
  // Ein bisschen Rand rundherum, damit die Masslinien Platz haben.
  const pad = 0.45;
  // Achtung, kleiner Trick: In einem SVG-Bild geht y nach UNTEN.
  // Darum schreiben wir überall ein Minus vor die Höhe, damit das Tor nicht kopfsteht.
  return (
    <svg
      viewBox={`${-oeffnungM / 2 - pad} ${-hoeheM - pad} ${oeffnungM + 2 * pad} ${hoeheM + 2 * pad}`}
      className="elevation-svg"
      role="img"
      aria-label={tr('Masszeichnung des Gartentors (Frontansicht, geschlossen)')}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Die Bodenlinie – hier fängt die Welt an. */}
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
        // Wo fängt der Flügel links an? Hängt er links, beim Scharnier;
        // hängt er rechts, dann eine Flügelbreite links vom Scharnier.
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
            {/* Die Stäbe, einer nach dem anderen. */}
            {fl.stabOffsetsM.map((off, s) => {
              const w = geometry.stabShape.dM ?? geometry.stabShape.wM ?? 0.012;
              // Stab-Position = Scharnier + Richtung × Abstand.
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
            {/* Bei Blech: eine graue Fläche; gelochtes Blech etwas durchsichtig. */}
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
      {/* 🤧 Schnupfspruch: Es Massband, e Pfiil und e Zahl dezue –
            dänn weiss au s Gitterli, wie gross es isch – und git Rueh. */}
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

// TorViewer: Der Rahmen um alles herum – mit Knöpfen, Schieberegler und Bild.
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
  // Einmal nachschauen, ob 3D geht, und das Ergebnis merken.
  const webgl = useMemo(supportsWebGL, []);
  // Kleiner Bildschirm (Handy)? Dann rechnen wir etwas sparsamer.
  const mobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
    []
  );
  // Welcher Blickwinkel ist gerade gewählt?
  const [view, setView] = useState<ViewPreset | '2d'>('perspektive');
  // Sollen die Masslinien sichtbar sein?
  const [showDims, setShowDims] = useState(true);
  // Wie weit ist das Tor offen? 0° = zu, 95° = fast ganz offen.
  const [oeffnung, setOeffnung] = useState(0);

  // Noch keine Masse? Dann zeigen wir nur einen freundlichen Hinweis.
  if (empty) {
    return (
      <div className="viewer-shell" role="img" aria-label={tr('Produktvorschau')}>
        <p className="viewer-empty">
          {tr('Die 3D-Vorschau erscheint, sobald Öffnung und Höhe erfasst sind.')}
        </p>
      </div>
    );
  }

  // 3D nur, wenn der Computer es kann UND nicht «Zeichnung» gewählt ist.
  const show3d = webgl && view !== '2d';

  // 🤧 Schnupfspruch: Dräi d Kamera links, dräi d Kamera rächts –
  //    s Tor bliibt grad, und de Schnupf isch ächt.
  return (
    <div className="viewer-block">
      {/* Die Knopfleiste oben: Blickwinkel und Masslinien ein/aus. */}
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
        {/* Häkchen für die Masslinien. */}
        <label className="dims-toggle">
          <input
            type="checkbox"
            checked={showDims}
            onChange={(e) => setShowDims(e.target.checked)}
          />
          {tr('Masslinien')}
        </label>
      </div>
      {/* Der Schieberegler zum Öffnen – wie wenn man das Tor mit der Hand aufstösst. */}
      {/* 🤧 Schnupfspruch: Null Grad isch zue und nüünzg Grad isch offe –
            und wer s offe lat, dem isch s Hüehnli devo gloffe. */}
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
        {/* Entweder das 3D-Tor (mit Ladehinweis) oder die flache Zeichnung. */}
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
      {/* Kein 3D? Kein Problem – wir erklären, dass die Zeichnung genauso gut ist. */}
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
