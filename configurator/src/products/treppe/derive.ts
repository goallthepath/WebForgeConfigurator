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
  const H = inputs.geschosshoeheMm ?? 0;
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
  if (H <= 0) return leer;

  const nAuto = Math.max(2, Math.round(H / params.idealSteigungMm));
  const n = inputs.stufenAnzahlManuell ?? nAuto;
  const steigung = H / n;
  const auftritt = Math.min(
    params.maxAuftrittMm,
    Math.max(params.minAuftrittMm, params.schrittmassMm - 2 * steigung)
  );
  const lauflaenge = (n - 1) * auftritt;
  const schraege = Math.sqrt(H * H + lauflaenge * lauflaenge);
  const neigung = (Math.atan2(H, lauflaenge) * 180) / Math.PI;

  const mitGelaender = inputs.modus !== 'treppe';
  const seiten = !mitGelaender
    ? 0
    : inputs.gelaenderSeite === 'beide'
      ? 2
      : inputs.gelaenderSeite
        ? 1
        : 0;

  const pfostenProSeite =
    seiten > 0
      ? Math.max(2, Math.ceil(schraege / params.maxPfostenabstandSchraegMm) + 1)
      : 0;

  const staebeProSeite =
    seiten > 0 && inputs.fuellung !== 'querstab'
      ? fuellstabAnzahl(lauflaenge, stabBreiteMm, params.maxStabAbstandMm)
      : 0;

  const hoehe = inputs.gelaenderHoeheMm ?? 0;
  const lagen =
    seiten > 0 && inputs.fuellung === 'querstab' && hoehe > 0
      ? querstabLagen(hoehe - 80, stabBreiteMm, params.maxQuerstabAbstandMm)
      : 0;

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

export function treppeMaterialAuszug(
  inputs: TreppeInputs,
  derived: TreppeDerived
): MaterialPosition[] {
  if (derived.steigungenAnzahl === 0) return [];
  const positionen: MaterialPosition[] = [];
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

  if (mitTreppe) {
    positionen.push(
      { bezeichnung: 'Wangen', anzahl: 2, laengeMm: derived.schraegeLaengeMm },
      {
        bezeichnung: `Trittstufen (${inputs.stufentyp ?? 'Typ offen'})`,
        anzahl: derived.stufenAnzahl,
        laengeMm: inputs.laufbreiteMm,
      }
    );
  }
  if (mitGelaender && derived.gelaenderSeiten > 0) {
    positionen.push(
      {
        bezeichnung: `Handlauf (${derived.gelaenderSeiten} Seite${derived.gelaenderSeiten > 1 ? 'n' : ''})`,
        anzahl: derived.gelaenderSeiten,
        laengeMm: derived.schraegeLaengeMm,
      },
      {
        bezeichnung: 'Geländerpfosten',
        anzahl: derived.pfostenProSeite * derived.gelaenderSeiten,
        laengeMm: inputs.gelaenderHoeheMm,
      }
    );
    if (derived.staebeProSeite > 0) {
      positionen.push({
        bezeichnung: 'Füllstäbe',
        anzahl: derived.staebeProSeite * derived.gelaenderSeiten,
        laengeMm: null,
      });
    }
    if (derived.querstabLagen > 0) {
      positionen.push({
        bezeichnung: 'Querstäbe',
        anzahl: derived.querstabLagen * derived.gelaenderSeiten,
        laengeMm: derived.schraegeLaengeMm,
      });
    }
  }
  return positionen;
}
