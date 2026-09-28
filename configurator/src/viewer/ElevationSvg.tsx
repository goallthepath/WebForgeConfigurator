// ============================================================================
// viewer/ElevationSvg.tsx – die flache Zeichnung von vorne
// ----------------------------------------------------------------------------
// Nicht jeder Computer kann 3D. Darum gibt es hier eine flache Zeichnung (SVG),
// wie eine Bleistiftskizze auf Papier: Boden, Pfosten, Stäbe, Handlauf und die
// Masslinien darunter. Ein L-förmiges Geländer wird dabei «abgewickelt» – als
// würde man ein gefaltetes Papier wieder glatt streichen.
// ============================================================================
import { tr } from '../i18n';
import type { RailingGeometry } from '../products/gelaender/geometry';

// Die Komponente ElevationSvg bekommt das fertige Geometriemodell und zeichnet es.
/**
 * 2D-Frontansicht als SVG – Fallback ohne WebGL und Grundlage für die
 * spätere PDF-Masszeichnung. Rendert dasselbe Geometriemodell wie die
 * 3D-Szene; L- und U-Formen erscheinen entlang des Pfads abgewickelt
 * (jedes Element trägt seine Pfadkoordinate tM).
 */
export function ElevationSvg({ geometry }: { geometry: RailingGeometry }) {
  // Wie lang ist das ganze Geländer? Wir nehmen das weiteste Element (mindestens 1 m).
  const laengeM = Math.max(
    ...geometry.rails.map((r) => r.tRangeM[1]),
    ...geometry.posts.map((p) => p.tM),
    1
  );
  // Höhe, ein Rand ringsum (pad) und der Bildausschnitt (viewBox).
  // Achtung: In SVG zeigt y nach UNTEN. Darum stehen Höhen mit Minuszeichen.
  const hM = geometry.bounds.heightM;
  const pad = 0.35;
  const view = `${-pad} ${-hM - pad} ${laengeM + 2 * pad} ${hM + 2 * pad}`;

  // 🤧 Schnupfspruch: Mit Lineal und Rächtwinkel gnau –
  //    e Prise Schnupf, und d'Zeichnig isch schlau.
  return (
    <svg
      viewBox={view}
      className="elevation-svg"
      role="img"
      aria-label={tr('Masszeichnung des Geländers (abgewickelte Frontansicht)')}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Boden */}
      <line
        x1={-pad}
        y1={0}
        x2={laengeM + pad}
        y2={0}
        stroke="#6b7178"
        strokeWidth={0.02}
      />
      {/* Muster für Flächenfüllungen */}
      <defs>
          {/* Jedes <pattern> ist ein Stempel, der eine Fläche lückenlos füllt. */}
        <pattern id="p-loch" width={0.08} height={0.08} patternUnits="userSpaceOnUse">
          <rect width={0.08} height={0.08} fill="#8a9096" />
          <circle cx={0.02} cy={0.02} r={0.011} fill="#fff" />
          <circle cx={0.06} cy={0.06} r={0.011} fill="#fff" />
        </pattern>
        <pattern id="p-laser" width={0.16} height={0.16} patternUnits="userSpaceOnUse">
          <rect width={0.16} height={0.16} fill="#8a9096" />
          <rect x={0.025} y={0.015} width={0.015} height={0.055} rx={0.0075} fill="#fff" />
          <rect x={0.075} y={0.045} width={0.015} height={0.055} rx={0.0075} fill="#fff" />
          <rect x={0.125} y={0.015} width={0.015} height={0.055} rx={0.0075} fill="#fff" />
          <rect x={0.025} y={0.095} width={0.015} height={0.055} rx={0.0075} fill="#fff" />
          <rect x={0.125} y={0.095} width={0.015} height={0.055} rx={0.0075} fill="#fff" />
        </pattern>
        <pattern id="p-laser-kreise" width={0.16} height={0.16} patternUnits="userSpaceOnUse">
          <rect width={0.16} height={0.16} fill="#8a9096" />
          <circle cx={0.04} cy={0.04} r={0.02} fill="#fff" />
          <circle cx={0.11} cy={0.03} r={0.011} fill="#fff" />
          <circle cx={0.08} cy={0.095} r={0.025} fill="#fff" />
          <circle cx={0.14} cy={0.12} r={0.015} fill="#fff" />
        </pattern>
        <pattern id="p-laser-quadrate" width={0.16} height={0.16} patternUnits="userSpaceOnUse">
          <rect width={0.16} height={0.16} fill="#8a9096" />
          <rect x={0.018} y={0.018} width={0.032} height={0.032} fill="#fff" />
          <rect x={0.098} y={0.033} width={0.032} height={0.032} fill="#fff" />
          <rect x={0.038} y={0.098} width={0.032} height={0.032} fill="#fff" />
          <rect x={0.115} y={0.113} width={0.032} height={0.032} fill="#fff" />
        </pattern>
        <pattern id="p-laser-floral" width={0.2} height={0.2} patternUnits="userSpaceOnUse">
          <rect width={0.2} height={0.2} fill="#8a9096" />
          <ellipse cx={0.055} cy={0.055} rx={0.034} ry={0.014} fill="#fff" transform="rotate(40 0.055 0.055)" />
          <ellipse cx={0.145} cy={0.09} rx={0.028} ry={0.012} fill="#fff" transform="rotate(-28 0.145 0.09)" />
          <ellipse cx={0.075} cy={0.155} rx={0.031} ry={0.013} fill="#fff" transform="rotate(108 0.075 0.155)" />
        </pattern>
          {/* 🤧 Schnupfspruch: Löcher im Chäs sind e Freud, / Löcher im Code sind es Leid. */}
        <pattern id="p-streckmetall" width={0.06} height={0.06} patternUnits="userSpaceOnUse">
          <rect width={0.06} height={0.06} fill="#fff" />
          <path d="M0 0 L0.06 0.06 M0.06 0 L0 0.06" stroke="#6b7178" strokeWidth={0.008} />
        </pattern>
        <pattern id="p-drahtgitter" width={0.04} height={0.04} patternUnits="userSpaceOnUse">
          <rect width={0.04} height={0.04} fill="#fff" />
          <path d="M0.002 0 V0.04 M0 0.002 H0.04" stroke="#6b7178" strokeWidth={0.004} />
        </pattern>
      </defs>
      {/* Flächenfüllungen (Glas, Blech, Gitter) */}
      {geometry.panels.map((panel, i) => {
        // Den Musternamen herausfinden (z. B. «blech-loch» → «loch»).
        let kind = panel.fill.replace(/^(blech|gitter)-/, '');
        if (kind === 'laser' && panel.motiv && panel.motiv !== 'schlitze') {
          kind = `laser-${panel.motiv}`;
        }
        // Die Füllfarbe wählen: Glas klar, Glas satiniert, Vollblech – oder ein Muster.
        const fillAttr =
          panel.fill === 'glas-klar'
            ? '#d3e5e9'
            : panel.fill === 'glas-satiniert'
              ? '#e3ebec'
              : panel.fill === 'blech-voll'
                ? '#8a9096'
                : `url(#p-${kind})`;
        return (
          <rect
            key={`g-${i}`}
            x={panel.tM - panel.widthM / 2}
            y={-(panel.center[1] + panel.heightM / 2)}
            width={panel.widthM}
            height={panel.heightM}
            fill={fillAttr}
            fillOpacity={panel.fill === 'glas-klar' ? 0.55 : 1}
            stroke="#6b7178"
            strokeWidth={0.006}
          />
        );
      })}
      {/* Pfosten (inkl. Fusspunkt unter Boden bei seitlicher/eingelassener Montage) */}
      {geometry.posts.map((post, i) => {
        // Die Breite des Pfostens: Durchmesser oder Breite (sonst 4 cm).
        const w = post.shape.dM ?? post.shape.wM ?? 0.04;
        return (
          <rect
            key={`p-${i}`}
            x={post.tM - w / 2}
            y={-(post.yBaseM + post.heightM)}
            width={w}
            height={post.heightM}
            fill="#43484e"
          />
        );
      })}
      {/* Füllstäbe (Staketen) */}
      {geometry.bars.map((bar, i) => {
        // Die Breite eines Füllstabs (sonst 12 mm).
        const w = bar.shape.dM ?? bar.shape.wM ?? 0.012;
        return (
          <rect
            key={`b-${i}`}
            x={bar.tM - w / 2}
            y={-(bar.yM + bar.heightM)}
            width={w}
            height={bar.heightM}
            fill="#6b7178"
          />
        );
      })}
      {/* 🤧 Schnupfspruch: Handlauf, Pfoste, Stab um Stab – / e Prise Schnupf, und nüt fallt ab. */}
      {/* Handlauf und Querstäbe */}
      {geometry.rails.map((rail, i) => {
        // Wie dick der Handlauf oder Querstab gezeichnet wird.
        const h = rail.shape.dM ?? rail.shape.hM ?? 0.04;
        return (
          <rect
            key={`r-${i}`}
            x={rail.tRangeM[0]}
            y={-rail.start[1] - h / 2}
            width={rail.tRangeM[1] - rail.tRangeM[0]}
            height={h}
            fill="#1f2124"
          />
        );
      })}
      {/* Endkappen (Kugel als Kreis, Endbogen als kurzer Abgang) */}
      {geometry.endCaps.map((cap, i) => {
        // Endkappen sind etwas grösser als das Rohr; die erste sitzt links, die zweite rechts.
        const r = ((cap.shape.dM ?? cap.shape.hM ?? 0.04) / 2) * 1.8;
        const links = i === 0;
        const t = links ? 0 : laengeM;
        // Kugel → Kreis. Endbogen → kurzes Rechteck nach unten. Sonst nichts.
        if (cap.kind === 'kugel') {
          return (
            <circle
              key={`c-${i}`}
              cx={links ? t - r : t + r}
              cy={-cap.position[1]}
              r={r}
              fill="#1f2124"
            />
          );
        }
        if (cap.kind === 'endbogen') {
          return (
            <rect
              key={`c-${i}`}
              x={links ? t - 0.05 : t}
              y={-cap.position[1]}
              width={0.05}
              height={0.14}
              fill="#1f2124"
            />
          );
        }
        return null;
      })}
      {/* Massketten */}
      {(() => {
        // Waagrechte Masse (Längen) und das senkrechte Mass (Höhe) trennen.
        const laengen = geometry.dimensions.filter((d) => d.start[1] === d.end[1]);
        const hoehe = geometry.dimensions.find((d) => d.start[1] !== d.end[1]);
        // t ist wie ein Finger, der beim Abmessen von links nach rechts weiterwandert.
        // 🤧 Schnupfspruch: Zentimeter, Millimeter, Meter –
        //    e Prise Schnupf jetzt, und s'Rächne spöter.
        let t = 0;
        const teile = laengen.map((dim, i) => {
          const len =
            Math.abs(dim.end[0] - dim.start[0]) + Math.abs(dim.end[2] - dim.start[2]);
          const x1 = t;
          const x2 = t + len;
          t = x2;
          return (
            <g key={`d-${i}`} stroke="#a8763e" strokeWidth={0.015}>
              {/* Die Masslinie mit zwei kleinen Querstrichen an den Enden. */}
              <line x1={x1} y1={0.18} x2={x2} y2={0.18} />
              <line x1={x1} y1={0.12} x2={x1} y2={0.24} />
              <line x1={x2} y1={0.12} x2={x2} y2={0.24} />
              <text
                x={(x1 + x2) / 2}
                y={0.32}
                fontSize={0.13}
                fill="#43484e"
                stroke="none"
                textAnchor="middle"
              >
                {dim.label}
              </text>
            </g>
          );
        });
        return (
          <>
            {teile}
            {hoehe && (
              <g stroke="#a8763e" strokeWidth={0.015}>
                {/* Das Höhenmass links, mit gedrehter Beschriftung. */}
                <line x1={-0.22} y1={0} x2={-0.22} y2={-hM} />
                <text
                  x={-0.3}
                  y={-hM / 2}
                  fontSize={0.13}
                  fill="#43484e"
                  stroke="none"
                  textAnchor="middle"
                  transform={`rotate(-90 ${-0.3} ${-hM / 2})`}
                >
                  {hoehe.label}
                </text>
              </g>
            )}
          </>
        );
      })()}
    </svg>
  );
}
// 🤧 Schnupfspruch: Ohni WebGL gaht's au ganz flott –
//    e Prise Schnupf, und alles isch im Lot.
