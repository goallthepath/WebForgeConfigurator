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

export function deriveGelaender(
  inputs: GelaenderInputs,
  stabBreiteMm: number,
  params: GelaenderRuleParams = GELAENDER_RULES_V0
): GelaenderDerived {
  const segmente = inputs.segmentLaengenMm.filter((l) => l > 0);
  // Glasfüllung verlangt engere Pfostenabstände (TESTDATEN-Parameter).
  const maxAbstand =
    inputs.fuellungsart === 'glas'
      ? params.maxPfostenabstandGlasMm
      : params.maxPfostenabstandMm;
  const pfostenProSegment = segmente.map((l) => pfostenAnzahl(l, maxAbstand));

  // Eckpfosten werden zwischen aufeinanderfolgenden Segmenten geteilt.
  const eckenGeteilt = segmente.length > 1 ? segmente.length - 1 : 0;
  const pfostenTotal =
    pfostenProSegment.reduce((sum, n) => sum + n, 0) - eckenGeteilt;

  const felderProSegment = segmente.map((_, i) =>
    Math.max(1, pfostenProSegment[i] - 1)
  );

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

  const hoehe = inputs.hoeheMm ?? 0;
  const lagen =
    inputs.fuellungsart === 'querstab' && hoehe > 0
      ? querstabLagen(
          hoehe - params.bodenfreiheitMm,
          stabBreiteMm,
          params.maxQuerstabAbstandMm
        )
      : 0;

  const flaechenFuellung =
    inputs.fuellungsart === 'glas' ||
    inputs.fuellungsart === 'blech' ||
    inputs.fuellungsart === 'gitter';
  const glasfelderTotal = flaechenFuellung
    ? felderProSegment.reduce((sum, n) => sum + n, 0)
    : 0;

  // Untergurt konstruktiv bei Stab- und Flächenfüllungen (nicht bei Glas
  // zwischen Pfosten und nicht bei Reling – dort übernimmt die unterste Lage).
  const mitUntergurt =
    inputs.mitUntergurt &&
    (mitStaeben ||
      inputs.fuellungsart === 'blech' ||
      inputs.fuellungsart === 'gitter');

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
    obergurtLaengenMm:
      inputs.mitObergurt && inputs.obergurtHoeheMm ? segmente : [],
    knieleisteLaengenMm:
      inputs.mitKnieleiste && inputs.knieleisteHoeheMm ? segmente : [],
  };
}

/**
 * Provisorischer Materialauszug für die Zusammenfassung (und später die
 * Werkstatt-Stückliste). Alle Werte TESTDATEN-basiert.
 */
export interface MaterialPosition {
  bezeichnung: string;
  anzahl: number;
  laengeMm: number | null;
}

export function materialAuszug(
  inputs: GelaenderInputs,
  derived: GelaenderDerived
): MaterialPosition[] {
  const positionen: MaterialPosition[] = [];
  if (derived.pfostenTotal > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: 'Pfosten',
      anzahl: derived.pfostenTotal,
      laengeMm: inputs.hoeheMm,
    });
  }
  derived.handlaufLaengenMm.forEach((laenge, i) => {
    positionen.push({
      bezeichnung:
        derived.handlaufLaengenMm.length > 1
          ? `Handlauf Segment ${i + 1}`
          : 'Handlauf',
      anzahl: 1,
      laengeMm: laenge,
    });
  });
  if (derived.fuellstaebeTotal > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: 'Füllstäbe',
      anzahl: derived.fuellstaebeTotal,
      laengeMm: null,
    });
  }
  if (derived.querstabLagen > 0) {
    inputs.segmentLaengenMm.forEach((laenge, i) => {
      if (laenge > 0) {
        positionen.push({
          bezeichnung:
            inputs.segmentLaengenMm.length > 1
              ? `Querstäbe Segment ${i + 1}`
              : 'Querstäbe',
          anzahl: derived.querstabLagen,
          laengeMm: laenge,
        });
      }
    });
  }
  const gurtPositionen: [readonly number[], string][] = [
    [derived.untergurtLaengenMm, 'Untergurt'],
    [derived.obergurtLaengenMm, 'Obergurt'],
    [derived.knieleisteLaengenMm, 'Knieleiste'],
  ];
  for (const [laengen, name] of gurtPositionen) {
    laengen.forEach((laenge, i) => {
      positionen.push({
        bezeichnung: laengen.length > 1 ? `${name} Segment ${i + 1}` : name,
        anzahl: 1,
        laengeMm: laenge,
      });
    });
  }
  if (inputs.montageart === 'boden' && derived.pfostenTotal > 0) {
    positionen.push({
      bezeichnung: `Fussplatten ${inputs.fussplatteLaengeMm}×${inputs.fussplatteBreiteMm}×${inputs.fussplatteDickeMm} mm (Wunschmass)`,
      anzahl: derived.pfostenTotal,
      laengeMm: null,
    });
  }
  if (derived.glasfelderTotal > 0) {
    const art =
      inputs.fuellungsart === 'glas'
        ? `Glasfelder (${inputs.glasTyp === 'satiniert' ? 'satiniert' : 'klar'})`
        : inputs.fuellungsart === 'blech'
          ? `Blechfelder (${inputs.blechTyp ?? 'voll'})`
          : `Gitterfelder (${inputs.gitterTyp ?? 'streckmetall'})`;
    positionen.push({
      bezeichnung: art,
      anzahl: derived.glasfelderTotal,
      laengeMm: null,
    });
  }
  return positionen;
}
