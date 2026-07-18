import type { GelaenderDerived, GelaenderInputs } from './types';
import {
  GELAENDER_RULES_V0,
  type GelaenderRuleParams,
} from '../../rules/gelaender-rules';

/**
 * Abgeleitete Werte (Ebene «abgeleitete Werte» – reine Funktionen).
 * Stückzahlen sind provisorisch, solange der Regelkatalog nicht
 * freigegeben ist; der Server berechnet beim Absenden erneut.
 */

/** Pfostenanzahl eines Segments: Achsabstand ≤ maxAbstand, symmetrisch. */
export function pfostenAnzahl(laengeMm: number, maxAbstandMm: number): number {
  if (laengeMm <= 0) return 0;
  return Math.max(2, Math.ceil(laengeMm / maxAbstandMm) + 1);
}

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
  const n = Math.ceil(
    (feldLaengeMm - maxLichtAbstandMm) / (stabBreiteMm + maxLichtAbstandMm)
  );
  return Math.max(0, n);
}

export function deriveGelaender(
  inputs: GelaenderInputs,
  stabBreiteMm: number,
  params: GelaenderRuleParams = GELAENDER_RULES_V0
): GelaenderDerived {
  const segmente = inputs.segmentLaengenMm.filter((l) => l > 0);
  const pfostenProSegment = segmente.map((l) =>
    pfostenAnzahl(l, params.maxPfostenabstandMm)
  );

  // L-Form: Der Eckpfosten wird von beiden Segmenten geteilt.
  const eckenGeteilt = segmente.length > 1 ? segmente.length - 1 : 0;
  const pfostenTotal =
    pfostenProSegment.reduce((sum, n) => sum + n, 0) - eckenGeteilt;

  const fuellstaebeProSegment = segmente.map((laenge, i) => {
    const felder = Math.max(1, pfostenProSegment[i] - 1);
    const feldLaenge = laenge / felder;
    return felder * fuellstabAnzahl(feldLaenge, stabBreiteMm, params.maxStabAbstandMm);
  });

  return {
    pfostenProSegment,
    pfostenTotal,
    fuellstaebeProSegment,
    fuellstaebeTotal: fuellstaebeProSegment.reduce((sum, n) => sum + n, 0),
    gesamtlaengeMm: segmente.reduce((sum, l) => sum + l, 0),
    handlaufLaengenMm: segmente,
  };
}
