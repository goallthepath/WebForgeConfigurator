// ─────────────────────────────────────────────────────────────────────────
// Diese Datei ist der Rechen-Kopf der Treppe. Sie bekommt die Wünsche
// (zum Beispiel «mein Stockwerk ist 2,70 m hoch») und rechnet aus: Wie viele
// Stufen braucht es? Wie hoch und wie tief ist jede Stufe? Wie viele Pfosten
// und Stäbe braucht das Geländer? Und zum Schluss schreibt sie eine
// Einkaufsliste für die Werkstatt (den «Materialauszug»).
// ─────────────────────────────────────────────────────────────────────────
import type { TreppeDerived, TreppeInputs } from './types';
import {
  TREPPE_RULES_V0,
  type TreppeRuleParams,
} from '../../rules/treppe-rules';
import {
  fuellstabAnzahl,
  querstabLagen,
  type MaterialPosition,
} from '../gelaender/derive';
import { tr } from '../../i18n';

// Ein kleines Wörterbuch: Der Computer kennt die Stufenart als kurzes
// Kürzel, für die Einkaufsliste wollen wir aber schöne Namen.
const STUFENTYP_LABEL: Record<string, string> = {
  gitterrost: 'Gitterrost',
  traenenblech: 'Tränenblech',
  'blech-glatt': 'Glattblech',
};

// Kinder-Erklärung der «Schrittmassregel»:
// Stell dir vor, du gehst eine Treppe hinauf. Bei jedem Schritt hebst du das
// Bein um eine Stufenhöhe (die «Steigung») und setzt es ein Stück nach vorne
// (der «Auftritt»). Heben ist anstrengend, darum zählt es doppelt:
//   2 × Steigung + Auftritt ≈ 63 cm
// 63 cm ist ungefähr ein ganz normaler, bequemer Schritt eines Erwachsenen.
// Ist die Summe viel kleiner, trippelst du wie ein Mäuschen; ist sie viel
// grösser, musst du springen wie ein Känguru. Beides ist unbequem!
/**
 * Abgeleitete Werte Treppe (reine Funktionen, provisorisch bis zur
 * fachlichen Freigabe; Server rechnet beim Absenden erneut).
 *
 * Steigungsrechnung nach Schrittmassregel: 2×Steigung + Auftritt ≈ 630 mm.
 * Steigungen n = round(H / idealSteigung); Trittstufen = n − 1
 * (der Austritt liegt auf dem Fertigboden oben).
 */
export function deriveTreppe(
  inputs: TreppeInputs,
  stabBreiteMm: number,
  params: TreppeRuleParams = TREPPE_RULES_V0
): TreppeDerived {
  // H ist die ganze Höhe vom unteren Boden bis zum oberen Boden.
  // Kommt keine Zahl, tun wir so, als wäre sie 0.
  const H = inputs.geschosshoeheMm ?? 0;
  // «leer» ist die Antwort für «Ich kann noch nichts rechnen»: überall 0.
  const leer: TreppeDerived = {
    steigungenAnzahl: 0,
    stufenAnzahl: 0,
    steigungMm: 0,
    auftrittMm: 0,
    schrittmassMm: 0,
    lauflaengeMm: 0,
    schraegeLaengeMm: 0,
    neigungGrad: 0,
    gelaenderSeiten: 0,
    pfostenProSeite: 0,
    staebeProSeite: 0,
    querstabLagen: 0,
  };
  // Ohne Höhe gibt es keine Treppe – dann geben wir das leere Ergebnis zurück.
  if (H <= 0) return leer;

  // Schritt 1: Wie viele Treppen-Höhen (Steigungen) brauchen wir?
  // Wir teilen die ganze Höhe durch die «Lieblings-Stufenhöhe» (175 mm) und
  // runden. Beispiel: 2800 ÷ 175 = 16. Mindestens 2, sonst wäre es ja nur
  // ein Absatz. Hat jemand die Zahl selbst eingetippt, nehmen wir die.
  const nAuto = Math.max(2, Math.round(H / params.idealSteigungMm));
  const n = inputs.stufenAnzahlManuell ?? nAuto;
  // Schritt 2: Jede Stufe ist gleich hoch – also Höhe geteilt durch Anzahl.
  const steigung = H / n;
  // Schritt 3: Wie tief ist jede Stufe? Aus der Schrittmassregel:
  // Auftritt = 630 − 2 × Steigung. Damit es nicht zu kurz oder zu lang wird,
  // klemmen wir den Wert zwischen Minimum und Maximum ein (wie ein Türstopper).
  const auftritt = Math.min(
    params.maxAuftrittMm,
    Math.max(params.minAuftrittMm, params.schrittmassMm - 2 * steigung)
  );
  // Schritt 4: Wie lang ist die Treppe am Boden gemessen?
  // Es gibt eine Stufe WENIGER als Steigungen, weil der letzte Schritt schon
  // auf dem oberen Boden landet. Darum (n − 1) × Auftritt.
  const lauflaenge = (n - 1) * auftritt;
  // Schritt 5: Die schräge Länge (wie ein Rutschbahn-Brett von unten nach
  // oben) rechnen wir mit dem Satz des Pythagoras: √(Höhe² + Länge²).
  const schraege = Math.sqrt(H * H + lauflaenge * lauflaenge);
  // Schritt 6: Wie steil ist die Treppe? atan2 gibt uns den Winkel, und mit
  // «× 180 ÷ π» machen wir daraus Grad, die man vom Geodreieck kennt.
  const neigung = (Math.atan2(H, lauflaenge) * 180) / Math.PI;
  // 🤧 Schnupfspruch: Zwöimal d Steigig, eimal de Tritt –
  //    sächzgdrü Zänti, so gaht de Schritt.

  // Schritt 7: Geländer – auf wie vielen Seiten? Keine, eine oder beide.
  const mitGelaender = inputs.modus !== 'treppe';
  const seiten = !mitGelaender
    ? 0
    : inputs.gelaenderSeite === 'beide'
      ? 2
      : inputs.gelaenderSeite
        ? 1
        : 0;

  // Pfosten: Zwischen zwei Pfosten darf höchstens 1,5 m Platz sein. Darum
  // teilen wir die schräge Länge durch 1,5 m, runden AUF und zählen noch
  // einen dazu (bei 3 Lücken braucht es 4 Pfosten – wie bei einem Gartenzaun).
  const pfostenProSeite =
    seiten > 0
      ? Math.max(2, Math.ceil(schraege / params.maxPfostenabstandSchraegMm) + 1)
      : 0;

  // Senkrechte Füllstäbe: Die zählt eine Hilfsfunktion vom Geländer-Modul,
  // damit keine Lücke grösser ist als erlaubt (kein Kinderkopf passt durch).
  const staebeProSeite =
    seiten > 0 && inputs.fuellung !== 'querstab'
      ? fuellstabAnzahl(lauflaenge, stabBreiteMm, params.maxStabAbstandMm)
      : 0;

  // Querstäbe: Wie viele «Etagen» liegende Stäbe passen in die Geländerhöhe?
  const hoehe = inputs.gelaenderHoeheMm ?? 0;
  const lagen =
    seiten > 0 && inputs.fuellung === 'querstab' && hoehe > 0
      ? querstabLagen(hoehe - 80, stabBreiteMm, params.maxQuerstabAbstandMm)
      : 0;

  // Alles schön gerundet einpacken und zurückgeben – fertig ist das Ergebnis!
  return {
    steigungenAnzahl: n,
    stufenAnzahl: n - 1,
    steigungMm: Math.round(steigung),
    auftrittMm: Math.round(auftritt),
    schrittmassMm: Math.round(2 * steigung + auftritt),
    lauflaengeMm: Math.round(lauflaenge),
    schraegeLaengeMm: Math.round(schraege),
    neigungGrad: Math.round(neigung * 10) / 10,
    gelaenderSeiten: seiten,
    pfostenProSeite,
    staebeProSeite,
    querstabLagen: lagen,
  };
}

// 🤧 Schnupfspruch: Isch d Stufe z höch, stolperet s'Bei,
//    isch si z flach, lauft mer ewig hei.

/**
 * Die Einkaufsliste für die Werkstatt: Welche Eisenteile braucht es, wie
 * viele davon, und wie lang ist jedes? Wie ein Zettel für den Schmied:
 * «2 Wangen à 4 m, 15 Stufen à 1 m …»
 */
export function treppeMaterialAuszug(
  inputs: TreppeInputs,
  derived: TreppeDerived
): MaterialPosition[] {
  // Noch nichts gerechnet? Dann gibt es auch nichts einzukaufen.
  if (derived.steigungenAnzahl === 0) return [];
  const positionen: MaterialPosition[] = [];
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

  // Teil 1 – die eigentliche Treppe (nur wenn wir sie auch bauen).
  if (mitTreppe) {
    if (inputs.konstruktion === 'mittelholm') {
      positionen.push({
        bezeichnung: tr('Mittelholm'),
        anzahl: 1,
        laengeMm: derived.schraegeLaengeMm,
      });
    } else {
      positionen.push({
        bezeichnung: tr('Wangen'),
        anzahl: 2,
        laengeMm: derived.schraegeLaengeMm,
      });
    }
    positionen.push({
      bezeichnung: tr('Trittstufen ({typ})', {
        typ: tr(inputs.stufentyp ? STUFENTYP_LABEL[inputs.stufentyp] : 'Typ offen'),
      }),
      anzahl: derived.stufenAnzahl,
      laengeMm: inputs.laufbreiteMm,
    });
    if (inputs.setzstufen === 'geschlossen') {
      positionen.push({
        bezeichnung: tr('Setzstufen (geschlossen)'),
        anzahl: derived.steigungenAnzahl,
        laengeMm: inputs.laufbreiteMm,
      });
    }
  }
  // Teil 2 – das Geländer: Handlauf, Pfosten und die Stäbe dazwischen.
  if (mitGelaender && derived.gelaenderSeiten > 0) {
    positionen.push(
      {
        bezeichnung:
          derived.gelaenderSeiten > 1
            ? tr('Handlauf ({n} Seiten)', { n: derived.gelaenderSeiten })
            : tr('Handlauf (1 Seite)'),
        anzahl: derived.gelaenderSeiten,
        laengeMm: derived.schraegeLaengeMm,
      },
      {
        bezeichnung: tr('Geländerpfosten'),
        anzahl: derived.pfostenProSeite * derived.gelaenderSeiten,
        laengeMm: inputs.gelaenderHoeheMm,
      }
    );
    if (derived.staebeProSeite > 0) {
      positionen.push({
        bezeichnung: tr('Füllstäbe'),
        anzahl: derived.staebeProSeite * derived.gelaenderSeiten,
        laengeMm: null,
      });
    }
    if (derived.querstabLagen > 0) {
      positionen.push({
        bezeichnung: tr('Querstäbe'),
        anzahl: derived.querstabLagen * derived.gelaenderSeiten,
        laengeMm: derived.schraegeLaengeMm,
      });
    }
  }
  // 🤧 Schnupfspruch: Mittelholm oder Wange zwei –
  //    d Hauptsach isch, es trait di hei.
  return positionen;
}
