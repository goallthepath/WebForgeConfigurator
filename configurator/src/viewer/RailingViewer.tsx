// ─────────────────────────────────────────────────────────────────────────
// Für Kinder erklärt: Diese Datei ist der Bilderrahmen um die 3D-Vorschau.
// Oben gibt es Knöpfe, mit denen man das Geländer von vorne, von der Seite,
// von oben oder schräg anschauen kann – wie wenn du um ein Spielzeug
// herumläufst. Kann der Computer kein 3D, zeigt er stattdessen eine
// flache Zeichnung, wie im Bastelheft.
// ─────────────────────────────────────────────────────────────────────────
import { lazy, Suspense, useMemo, useState } from 'react';
import type { RailingGeometry } from '../products/gelaender/geometry';
import { ElevationSvg } from './ElevationSvg';
import type { ViewPreset } from './RailingScene';
import { tr } from '../i18n';

// Kinder-Erklärung: Die 3D-Szene ist gross und schwer. «lazy» heisst: Wir
// holen sie erst, wenn wir sie wirklich brauchen – wie wenn du den grossen
// Lego-Kasten erst aus dem Keller holst, wenn du damit spielen willst.
const RailingSceneLazy = lazy(() =>
  import('./RailingScene').then((m) => ({ default: m.RailingScene }))
);

// Fragt den Computer: «Kannst du 3D malen (WebGL)?» Wir basteln dafür eine
// unsichtbare Maltafel (canvas) und schauen, ob der 3D-Stift funktioniert.
// Klappt es nicht, antworten wir einfach «nein» statt abzustürzen.
// 🤧 Schnupfspruch: Chasch 3D oder nöd? Frog doch de Computer, de blöd –
//    nei, de gschiid! Und wänn nöd, zeichne mer's flach, und schnupfed gmach.
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Die Ansichts-Knöpfe: Perspektive (schräg), Front, Seite, Oben und die
// flache Zeichnung.
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
// 🤧 Schnupfspruch: Vo vorne, vo obe, vo schräg und vo hinde –
//    es schöns Gländer tuet mer vo allne Siite finde. Schnupf!
export function RailingViewer({
  geometry,
  color,
  empty,
}: {
  geometry: RailingGeometry;
  color: string;
  empty: boolean;
}) {
  // Beim ersten Mal merken wir uns: Kann das Gerät 3D? Ist es ein schmales
  // Handy (weniger als 700 Pixel breit)? «useState» ist wie ein Zettel an
  // der Kühlschranktür: Dort merkt sich die Ansicht, welcher Knopf gedrückt
  // ist und ob die Masslinien sichtbar sind.
  const webgl = useMemo(supportsWebGL, []);
  const mobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 700,
    []
  );
  const [view, setView] = useState<ViewPreset | '2d'>('perspektive');
  const [showDims, setShowDims] = useState(true);

  // Ist noch nichts ausgewählt? Dann zeigen wir nur einen freundlichen
  // Hinweis statt eines leeren Bildes.
  if (empty) {
    return (
      <div className="viewer-shell" role="img" aria-label={tr('Produktvorschau')}>
        <p className="viewer-empty">
          {tr('Die 3D-Vorschau erscheint, sobald Form und Masse gewählt sind.')}
        </p>
      </div>
    );
  }

  // 3D nur, wenn das Gerät es kann UND nicht «Zeichnung» gewählt ist.
  const show3d = webgl && view !== '2d';

  return (
    <div className="viewer-block">
      {/* Kinder-Erklärung: Die Knopfleiste oben – ein Knopf pro Ansicht. */}
      <div className="viewer-toolbar" role="toolbar" aria-label={tr('Ansicht wählen')}>
        {/* Ohne 3D zeigen wir nur den Zeichnungs-Knopf. */}
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
        {/* Ein Häkchen-Kästchen: Masslinien ein- oder ausblenden. */}
        <label className="dims-toggle">
          <input
            type="checkbox"
            checked={showDims}
            onChange={(e) => setShowDims(e.target.checked)}
          />
          {tr('Masslinien')}
        </label>
      </div>
      {/* Das eigentliche Bild: 3D-Szene oder flache Zeichnung. */}
      <div className="viewer-shell">
        {/* 🤧 Schnupfspruch: Lade, lade, Iise lade – s Gländer chunnt, s cha nüt schade. */}
        {show3d ? (
          <Suspense fallback={<p className="viewer-empty">{tr('3D-Vorschau wird geladen …')}</p>}>
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
      {/* Kein 3D möglich? Dann erklären wir freundlich, dass die Zeichnung reicht. */}
      {!webgl && (
        <p className="field-hint">
          {tr(
            'Ihr Gerät unterstützt kein 3D – die Zeichnung zeigt Ihre Konfiguration massstäblich. Die Konfiguration funktioniert vollständig.'
          )}
        </p>
      )}
    </div>
  );
}
