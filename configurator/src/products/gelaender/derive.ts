// ─────────────────────────────────────────────────────────────────────────
// Für Kinder erklärt: Diese Datei ist der Rechenmeister. Sie nimmt den
// Wunschzettel des Kunden (wie lang, wie hoch, welche Füllung) und zählt
// daraus aus, wie viele Pfosten, Stäbe und Stangen man braucht – so wie du
// ausrechnest, wie viele Lego-Steine du für eine Mauer brauchst. Am Schluss
// schreibt sie eine Einkaufsliste für die Werkstatt.
// ─────────────────────────────────────────────────────────────────────────
import {
  obergurtAktiv,
  obergurtHoeheEff,
  type GelaenderDerived,
  type GelaenderInputs,
} from './types';
import {
  GELAENDER_RULES_V0,
  type GelaenderRuleParams,
} from '../../rules/gelaender-rules';
import { tr } from '../../i18n';
// 🤧 Schnupfspruch: Zwei mal zwei isch vier, drü Pföschte bruuchsch du hier –
//    rächne tuet de Computer, schnupfe tüemer mir!

/**
 * Abgeleitete Werte (Ebene «abgeleitete Werte» – reine Funktionen).
 * Stückzahlen sind provisorisch, solange der Regelkatalog nicht
 * freigegeben ist; der Server berechnet beim Absenden erneut.
 */

// Wie viele Pfosten braucht ein gerades Stück? Stell dir vor, du steckst
// Stecken in den Boden für einen Gartenzaun: Sie dürfen nicht zu weit
// auseinander sein. Wir teilen die Länge durch den grössten erlaubten
// Abstand (wie viele Schritte passen auf den Weg?), runden auf und zählen
// noch einen dazu – denn am Anfang UND am Ende steht ein Pfosten.
// Mindestens 2 Pfosten gibt es immer, sonst hält nichts.
/** Pfostenanzahl eines Segments: Achsabstand ≤ maxAbstand, symmetrisch. */
export function pfostenAnzahl(laengeMm: number, maxAbstandMm: number): number {
  if (laengeMm <= 0) return 0;
  return Math.max(2, Math.ceil(laengeMm / maxAbstandMm) + 1);
}

// Wie viele senkrechte Stäbe passen zwischen zwei Pfosten? Die Lücken
// dürfen nicht zu gross sein – sonst könnte ein Kinderkopf durchrutschen!
// Wir probieren aus, wie viele Stäbe wir brauchen, damit jede Lücke klein
// genug bleibt.
/**
 * Füllstäbe zwischen zwei Pfosten so verteilen, dass der lichte Abstand
 * das Maximum nicht überschreitet und die Teilung symmetrisch ist.
 */
export function fuellstabAnzahl(
  feldLaengeMm: number,
  stabBreiteMm: number,
  maxLichtAbstandMm: number
): number {
  if (feldLaengeMm <= 0) return 0;
  // n Stäbe erzeugen n+1 Lücken: (feld - n*stab) / (n+1) <= max
  // Kinder-Erklärung: Jeder Stab plus eine Lücke ist wie ein «Päckli».
  // Wir schauen, wie viele solche Päckli in das Feld passen müssen, und
  // runden auf – lieber ein Stab zu viel als eine Lücke zu gross.
  const n = Math.ceil(
    (feldLaengeMm - maxLichtAbstandMm) / (stabBreiteMm + maxLichtAbstandMm)
  );
  return Math.max(0, n);
}

// Dasselbe wie oben, nur liegend: Wie viele waagrechte Stangen (wie bei
// einer Schiffsreling) braucht es übereinander, damit die Lücken klein
// genug sind? Statt der Länge nehmen wir hier die freie Höhe.
/**
 * Anzahl horizontaler Querstab-Lagen (Reling) zwischen Unterkante und
 * Handlauf, sodass der lichte Abstand das Maximum nicht überschreitet.
 */
export function querstabLagen(
  freieHoeheMm: number,
  stabHoeheMm: number,
  maxLichtAbstandMm: number
): number {
  if (freieHoeheMm <= 0) return 0;
  const n = Math.ceil(
    (freieHoeheMm - maxLichtAbstandMm) / (stabHoeheMm + maxLichtAbstandMm)
  );
  return Math.max(0, n);
}

// 🤧 Schnupfspruch: Lieber en Stab z vill als es Loch z gross –
//    so bliibt s Chind dihei und nöd uf de Strooss. Schnupf!
// Die Hauptrechnung: Aus dem Wunschzettel (inputs) wird die Stückliste
// (GelaenderDerived). Wie ein Rezept: Zutaten rein, fertiger Kuchen raus.
export function deriveGelaender(
  inputs: GelaenderInputs,
  stabBreiteMm: number,
  params: GelaenderRuleParams = GELAENDER_RULES_V0
): GelaenderDerived {
  // Zuerst werfen wir alle Stücke weg, die keine Länge haben (0 mm) –
  // die kann man ja nicht bauen.
  const segmente = inputs.segmentLaengenMm.filter((l) => l > 0);
  // Glasfüllung verlangt engere Pfostenabstände (TESTDATEN-Parameter).
  const maxAbstand =
    inputs.fuellungsart === 'glas'
      ? params.maxPfostenabstandGlasMm
      : params.maxPfostenabstandMm;
  // Für jedes gerade Stück zählen wir die Pfosten.
  const pfostenProSegment = segmente.map((l) => pfostenAnzahl(l, maxAbstand));

  // Kinder-Erklärung: Bei einer Ecke gehört der Eckpfosten zu BEIDEN
  // Stücken. Damit wir ihn nicht doppelt zählen, ziehen wir pro Ecke einen ab.
  // Eckpfosten werden zwischen aufeinanderfolgenden Segmenten geteilt.
  const eckenGeteilt = segmente.length > 1 ? segmente.length - 1 : 0;
  const pfostenTotal =
    pfostenProSegment.reduce((sum, n) => sum + n, 0) - eckenGeteilt;

  // Zwischen zwei Pfosten liegt ein «Feld» – wie der Platz zwischen zwei
  // Zaunpfählen. 3 Pfosten ergeben also 2 Felder.
  const felderProSegment = segmente.map((_, i) =>
    Math.max(1, pfostenProSegment[i] - 1)
  );

  // Nur bei senkrechten Stäben (Staketen oder geschmiedet) zählen wir Stäbe:
  // Stäbe pro Feld mal Anzahl Felder. Bei anderen Füllungen: null Stäbe.
  const mitStaeben =
    inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet';
  const fuellstaebeProSegment =
    mitStaeben
      ? segmente.map((laenge, i) => {
          const feldLaenge = laenge / felderProSegment[i];
          return (
            felderProSegment[i] *
            fuellstabAnzahl(feldLaenge, stabBreiteMm, params.maxStabAbstandMm)
          );
        })
      : segmente.map(() => 0);

  // Jetzt die Höhe: Wo fängt die Füllung unten an und wo hört sie oben auf?
  // Nur beim Querstab-Geländer rechnen wir daraus die Anzahl Stangen-Lagen.
  const hoehe = inputs.hoeheMm ?? 0;
  const untenMm = inputs.mitUntergurt
    ? inputs.untergurtHoeheMm
    : params.bodenfreiheitMm;
  const obenMm = obergurtHoeheEff(inputs) ?? hoehe;
  const lagen =
    inputs.fuellungsart === 'querstab' && hoehe > 0
      ? querstabLagen(obenMm - untenMm, stabBreiteMm, params.maxQuerstabAbstandMm)
      : 0;

  // Glas, Blech und Gitter sind ganze Platten: Da zählen wir einfach die
  // Felder – ein Feld, eine Platte, wie Fenster in einem Haus.
  // 🤧 Schnupfspruch: Glas, Blech und Gitter – s Gländer isch es Ritter.
  //    Es schützt di vor em Falle, drum schnupfed mer jetz alle!
  const flaechenFuellung =
    inputs.fuellungsart === 'glas' ||
    inputs.fuellungsart === 'blech' ||
    inputs.fuellungsart === 'gitter';
  const glasfelderTotal = flaechenFuellung
    ? felderProSegment.reduce((sum, n) => sum + n, 0)
    : 0;

  // Untergurt ist bei allen Füllungsarten wählbar (konstruktiv üblich).
  const mitUntergurt = inputs.mitUntergurt && inputs.fuellungsart !== null;

  // Zum Schluss packen wir alles in eine Schachtel und geben sie zurück.
  // Die Handlauf- und Gurtlängen sind gleich lang wie die Stücke selbst.
  return {
    pfostenProSegment,
    pfostenTotal,
    fuellstaebeProSegment,
    fuellstaebeTotal: fuellstaebeProSegment.reduce((sum, n) => sum + n, 0),
    querstabLagen: lagen,
    glasfelderTotal,
    gesamtlaengeMm: segmente.reduce((sum, l) => sum + l, 0),
    handlaufLaengenMm: inputs.ohneHandlauf ? [] : segmente,
    untergurtLaengenMm: mitUntergurt ? segmente : [],
    obergurtLaengenMm: obergurtAktiv(inputs) ? segmente : [],
    knieleisteLaengenMm:
      inputs.mitKnieleiste && inputs.knieleisteHoeheMm ? segmente : [],
  };
}

// Kinder-Erklärung: Eine Zeile auf der Einkaufsliste – WAS (bezeichnung),
// WIE VIELE (anzahl) und WIE LANG (laengeMm, oder null wenn egal).
/**
 * Provisorischer Materialauszug für die Zusammenfassung (und später die
 * Werkstatt-Stückliste). Alle Werte TESTDATEN-basiert.
 */
export interface MaterialPosition {
  bezeichnung: string;
  anzahl: number;
  laengeMm: number | null;
}

// Schreibt die Einkaufsliste für die Werkstatt: Pfosten, Handläufe, Stäbe,
// Gurte, Befestigungsteile und Platten. Jede Zeile ist ein Teil, das der
// Schmied zuschneiden oder bestellen muss.
export function materialAuszug(
  inputs: GelaenderInputs,
  derived: GelaenderDerived
): MaterialPosition[] {
  const positionen: MaterialPosition[] = [];
  // Die Pfosten: so viele wie gezählt, jeder so lang wie das Geländer hoch ist.
  if (derived.pfostenTotal > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: tr('Pfosten'),
      anzahl: derived.pfostenTotal,
      laengeMm: inputs.hoeheMm,
    });
  }
  // Der Handlauf: pro geradem Stück eine Stange (bei mehreren Stücken
  // schreiben wir die Nummer dazu, damit man sie nicht verwechselt).
  derived.handlaufLaengenMm.forEach((laenge, i) => {
    positionen.push({
      bezeichnung:
        derived.handlaufLaengenMm.length > 1
          ? tr('Handlauf Segment {n}', { n: i + 1 })
          : tr('Handlauf'),
      anzahl: 1,
      laengeMm: laenge,
    });
  });
  // Die senkrechten Füllstäbe (falls es welche gibt).
  if (derived.fuellstaebeTotal > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: tr('Füllstäbe'),
      anzahl: derived.fuellstaebeTotal,
      laengeMm: null,
    });
  }
  // Die waagrechten Querstäbe: pro Stück so viele Lagen wie berechnet.
  if (derived.querstabLagen > 0) {
    inputs.segmentLaengenMm.forEach((laenge, i) => {
      if (laenge > 0) {
        positionen.push({
          bezeichnung:
            inputs.segmentLaengenMm.length > 1
              ? tr('Querstäbe Segment {n}', { n: i + 1 })
              : tr('Querstäbe'),
          anzahl: derived.querstabLagen,
          laengeMm: laenge,
        });
      }
    });
  }
  // Die Gurte (Untergurt, Obergurt, Knieleiste) sind alle gleich gebaut –
  // darum stecken wir sie in eine kleine Liste und machen es in einer Schleife.
  // 🤧 Schnupfspruch: En Gurt obe, en Gurt unde, so wird s Gländer rund –
  //    Schnupf, und bliib gsund!
  const gurtPositionen: [readonly number[], string][] = [
    [derived.untergurtLaengenMm, 'Untergurt'],
    [derived.obergurtLaengenMm, 'Obergurt'],
    [derived.knieleisteLaengenMm, 'Knieleiste'],
  ];
  for (const [laengen, name] of gurtPositionen) {
    laengen.forEach((laenge, i) => {
      positionen.push({
        bezeichnung:
          laengen.length > 1
            ? tr('{teil} Segment {n}', { teil: tr(name), n: i + 1 })
            : tr(name),
        anzahl: 1,
        laengeMm: laenge,
      });
    });
  }
  // Die «Füsse» des Geländers: Je nach Montageart braucht jeder Pfosten
  // eine Fussplatte, ein Schwert, einen Kragarm, eine Einbindung – oder
  // bei der Wand-Montage Laschen, mit denen man den Handlauf anschraubt.
  if (derived.pfostenTotal > 0) {
    if (inputs.montageart === 'boden') {
      positionen.push({
        bezeichnung: tr('Fussplatten {l}×{b}×{d} mm (Wunschmass)', {
          l: inputs.fussplatteLaengeMm,
          b: inputs.fussplatteBreiteMm,
          d: inputs.fussplatteDickeMm,
        }),
        anzahl: derived.pfostenTotal,
        laengeMm: null,
      });
    } else if (inputs.montageart === 'seite') {
      positionen.push({
        bezeichnung: tr('Schwerter {h}×{b}×{d} mm (Wunschmass)', {
          h: inputs.schwertHoeheMm,
          b: inputs.schwertBreiteMm,
          d: inputs.schwertDickeMm,
        }),
        anzahl: derived.pfostenTotal,
        laengeMm: null,
      });
    } else if (inputs.montageart === 'unten') {
      positionen.push({
        bezeichnung: tr('Kragarme {s} mm stark (Wunschmass)', {
          s: inputs.kragarmStaerkeMm,
        }),
        anzahl: derived.pfostenTotal,
        laengeMm: inputs.kragarmLaengeMm,
      });
    } else if (inputs.montageart === 'eingelassen') {
      positionen.push({
        bezeichnung: tr('Pfosten-Einbindung {t} mm (Wunschmass)', {
          t: inputs.einlassTiefeMm,
        }),
        anzahl: derived.pfostenTotal,
        laengeMm: null,
      });
    } else if (inputs.montageart === 'wand') {
      positionen.push({
        bezeichnung: tr('Wandlaschen {h}×{b}×{d} mm (Wunschmass)', {
          h: inputs.wandlascheHoeheMm,
          b: inputs.wandlascheBreiteMm,
          d: inputs.wandlascheDickeMm,
        }),
        anzahl: 2 * Math.max(1, derived.handlaufLaengenMm.length ? 1 : 1) * (derived.untergurtLaengenMm.length > 0 ? 2 : 1),
        laengeMm: null,
      });
    }
  }
  // Zum Schluss die Platten (Glas, Blech oder Gitter), eine pro Feld.
  if (derived.glasfelderTotal > 0) {
    const art =
      inputs.fuellungsart === 'glas'
        ? tr(`Glasfelder (${inputs.glasTyp === 'satiniert' ? 'satiniert' : 'klar'})`)
        : inputs.fuellungsart === 'blech'
          ? tr(`Blechfelder (${inputs.blechTyp ?? 'voll'})`)
          : tr(`Gitterfelder (${inputs.gitterTyp ?? 'streckmetall'})`);
    positionen.push({
      bezeichnung: art,
      anzahl: derived.glasfelderTotal,
      laengeMm: null,
    });
  }
  return positionen;
}
