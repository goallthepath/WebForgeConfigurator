import type { FenstergitterDerived, FenstergitterInputs } from './types';
import {
  FENSTERGITTER_RULES_V0,
  type FenstergitterRuleParams,
} from '../../rules/fenstergitter-rules';
import { fuellstabAnzahl, type MaterialPosition } from '../gelaender/derive';

/**
 * Abgeleitete Werte Fenstergitter (reine Funktionen, provisorisch bis
 * zur fachlichen Freigabe; Server rechnet beim Absenden erneut).
 */
export function deriveFenstergitter(
  inputs: FenstergitterInputs,
  stabBreiteMm: number,
  params: FenstergitterRuleParams = FENSTERGITTER_RULES_V0
): FenstergitterDerived {
  const b = inputs.breiteMm ?? 0;
  const h = inputs.hoeheMm ?? 0;

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
  rahmenBreite = Math.max(0, rahmenBreite);
  rahmenHoehe = Math.max(0, rahmenHoehe);

  const stabAnzahl =
    rahmenBreite > 0
      ? fuellstabAnzahl(rahmenBreite, stabBreiteMm, params.maxStabLichtMm)
      : 0;

  const quergurtAnzahl =
    inputs.stabanordnung === 'vertikal-quergurt'
      ? Math.min(2, Math.max(1, inputs.quergurtAnzahl))
      : 0;

  const laschenProSeite =
    rahmenHoehe > params.dritteLascheAbHoeheMm ? 3 : 2;

  return {
    rahmenBreiteMm: Math.round(rahmenBreite),
    rahmenHoeheMm: Math.round(rahmenHoehe),
    stabAnzahl,
    quergurtAnzahl,
    laschenProSeite,
    laschenTotal: laschenProSeite * 2,
  };
}

export function gitterMaterialAuszug(
  inputs: FenstergitterInputs,
  derived: FenstergitterDerived
): MaterialPosition[] {
  if (derived.rahmenBreiteMm <= 0 || derived.rahmenHoeheMm <= 0) return [];
  const positionen: MaterialPosition[] = [
    { bezeichnung: 'Rahmen horizontal', anzahl: 2, laengeMm: derived.rahmenBreiteMm },
    { bezeichnung: 'Rahmen vertikal', anzahl: 2, laengeMm: derived.rahmenHoeheMm },
  ];
  if (derived.stabAnzahl > 0) {
    positionen.push({
      bezeichnung: 'Gitterstäbe',
      anzahl: derived.stabAnzahl,
      laengeMm: derived.rahmenHoeheMm,
    });
  }
  if (derived.quergurtAnzahl > 0) {
    positionen.push({
      bezeichnung: 'Quergurte',
      anzahl: derived.quergurtAnzahl,
      laengeMm: derived.rahmenBreiteMm,
    });
  }
  positionen.push({
    bezeichnung: `Befestigungslaschen (${inputs.montage === 'vorwand' ? 'auf Wand' : 'in Leibung'})`,
    anzahl: derived.laschenTotal,
    laengeMm: null,
  });
  return positionen;
}
