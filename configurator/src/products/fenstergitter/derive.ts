// Der Taschenrechner fürs Fenstergitter.
// Er rechnet aus: Wie gross wird das Gitter? Wie viele Stäbe passen hinein?
// Wie viele Laschen (kleine Metall-Ohren zum Festschrauben) braucht es?
// Und er schreibt den Einkaufszettel für die Werkstatt.
import type { FenstergitterDerived, FenstergitterInputs } from './types';
import {
  FENSTERGITTER_RULES_V0,
  type FenstergitterRuleParams,
} from '../../rules/fenstergitter-rules';
import { fuellstabAnzahl, type MaterialPosition } from '../gelaender/derive';
import { tr } from '../../i18n';

// deriveFenstergitter: Aus den Antworten werden Zahlen für den Schmied.
/**
 * Abgeleitete Werte Fenstergitter (reine Funktionen, provisorisch bis
 * zur fachlichen Freigabe; Server rechnet beim Absenden erneut).
 */
export function deriveFenstergitter(
  inputs: FenstergitterInputs,
  stabBreiteMm: number,
  params: FenstergitterRuleParams = FENSTERGITTER_RULES_V0
): FenstergitterDerived {
  // Breite und Höhe holen (noch leer? dann 0).
  const b = inputs.breiteMm ?? 0;
  const h = inputs.hoeheMm ?? 0;

  // Stell dir das Fenster im Kinderzimmer vor. Setzt man das Gitter IN die
  // Fensternische, muss es etwas kleiner sein als das Loch (sonst passt es nicht).
  // Schraubt man es VOR die Wand, muss es etwas grösser sein (damit es das Loch abdeckt).
  // Aussenmass des Gitters aus Masstyp und Montageart:
  // Leibung + Lichtmass  → Gitter = Licht − 2×Spiel
  // Vorwand + Lichtmass  → Gitter = Licht + 2×Überstand
  // Aussenmass           → Gitter = Eingabe
  let rahmenBreite = b;
  let rahmenHoehe = h;
  if (inputs.masstyp === 'lichtmass') {
    if (inputs.montage === 'vorwand') {
      rahmenBreite = b + 2 * params.vorwandUeberstandMm;
      rahmenHoehe = h + 2 * params.vorwandUeberstandMm;
    } else {
      rahmenBreite = b - 2 * params.leibungSpielMm;
      rahmenHoehe = h - 2 * params.leibungSpielMm;
    }
  }
  // Ein Gitter kann nicht minus 5 Millimeter gross sein – mindestens 0.
  rahmenBreite = Math.max(0, rahmenBreite);
  rahmenHoehe = Math.max(0, rahmenHoehe);

  // Wie viele Stäbe? Die Lücken dürfen nicht zu breit sein,
  // damit kein Kopf und keine Hand durchpasst.
  // 🤧 Schnupfspruch: Zwüsche de Stäb isch grad Platz für e Muus –
  //    de Einbrächer bliibt dusse und trinkt sin Tee dihei im Huus.
  const stabAnzahl =
    rahmenBreite > 0
      ? fuellstabAnzahl(rahmenBreite, stabBreiteMm, params.maxStabLichtMm)
      : 0;

  // Quergurte (waagrechte Stangen): nur wenn gewünscht, und dann 1 oder 2 – nie mehr.
  const quergurtAnzahl =
    inputs.stabanordnung === 'vertikal-quergurt'
      ? Math.min(2, Math.max(1, inputs.quergurtAnzahl))
      : 0;

  // Laschen: Ein kleines Gitter hält mit 2 pro Seite, ein grosses bekommt 3.
  const laschenProSeite =
    rahmenHoehe > params.dritteLascheAbHoeheMm ? 3 : 2;

  // Alles runden (keine halben Millimeter) und zurückgeben.
  // Laschen total = pro Seite × 2 Seiten (links und rechts).
  return {
    rahmenBreiteMm: Math.round(rahmenBreite),
    rahmenHoeheMm: Math.round(rahmenHoehe),
    stabAnzahl,
    quergurtAnzahl,
    laschenProSeite,
    laschenTotal: laschenProSeite * 2,
  };
}

// gitterMaterialAuszug: Der Einkaufszettel – wie ein Rezept für den Schmied.
// 🤧 Schnupfspruch: Vier Rahmestück, es paar Stäb, e Gurt oder zwee –
//    s Rezept isch churz, und s Gitter hebt ewig, juhee!
export function gitterMaterialAuszug(
  inputs: FenstergitterInputs,
  derived: FenstergitterDerived
): MaterialPosition[] {
  // Kein Gitter? Dann auch kein Einkaufszettel.
  if (derived.rahmenBreiteMm <= 0 || derived.rahmenHoeheMm <= 0) return [];
  // Der Rahmen: 2 waagrechte und 2 senkrechte Stücke, wie ein Bilderrahmen.
  const positionen: MaterialPosition[] = [
    { bezeichnung: tr('Rahmen horizontal'), anzahl: 2, laengeMm: derived.rahmenBreiteMm },
    { bezeichnung: tr('Rahmen vertikal'), anzahl: 2, laengeMm: derived.rahmenHoeheMm },
  ];
  // Die Stäbe, alle so lang wie der Rahmen hoch ist.
  if (derived.stabAnzahl > 0) {
    positionen.push({
      bezeichnung: tr('Gitterstäbe'),
      anzahl: derived.stabAnzahl,
      laengeMm: derived.rahmenHoeheMm,
    });
  }
  // Die Quergurte, so lang wie der Rahmen breit ist.
  if (derived.quergurtAnzahl > 0) {
    positionen.push({
      bezeichnung: tr('Quergurte'),
      anzahl: derived.quergurtAnzahl,
      laengeMm: derived.rahmenBreiteMm,
    });
  }
  // Und die Laschen, je nachdem, wo sie befestigt werden.
  positionen.push({
    bezeichnung:
      inputs.montage === 'vorwand'
        ? tr('Befestigungslaschen (auf Wand)')
        : tr('Befestigungslaschen (in Leibung)'),
    anzahl: derived.laschenTotal,
    laengeMm: null,
  });
  return positionen;
}
