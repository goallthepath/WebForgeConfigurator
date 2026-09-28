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
  const untenMm = inputs.mitUntergurt
    ? inputs.untergurtHoeheMm
    : params.bodenfreiheitMm;
  const obenMm = obergurtHoeheEff(inputs) ?? hoehe;
  const lagen =
    inputs.fuellungsart === 'querstab' && hoehe > 0
      ? querstabLagen(obenMm - untenMm, stabBreiteMm, params.maxQuerstabAbstandMm)
      : 0;

  const flaechenFuellung =
    inputs.fuellungsart === 'glas' ||
    inputs.fuellungsart === 'blech' ||
    inputs.fuellungsart === 'gitter';
  const glasfelderTotal = flaechenFuellung
    ? felderProSegment.reduce((sum, n) => sum + n, 0)
    : 0;

  // Untergurt ist bei allen Füllungsarten wählbar (konstruktiv üblich).
  const mitUntergurt = inputs.mitUntergurt && inputs.fuellungsart !== null;

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
      bezeichnung: tr('Pfosten'),
      anzahl: derived.pfostenTotal,
      laengeMm: inputs.hoeheMm,
    });
  }
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
  if (derived.fuellstaebeTotal > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: tr('Füllstäbe'),
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
              ? tr('Querstäbe Segment {n}', { n: i + 1 })
              : tr('Querstäbe'),
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
        bezeichnung:
          laengen.length > 1
            ? tr('{teil} Segment {n}', { teil: tr(name), n: i + 1 })
            : tr(name),
        anzahl: 1,
        laengeMm: laenge,
      });
    });
  }
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
