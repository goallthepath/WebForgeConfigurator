import type { GartentorDerived, GartentorInputs } from './types';
import {
  GARTENTOR_RULES_V0,
  type GartentorRuleParams,
} from '../../rules/gartentor-rules';
import { fuellstabAnzahl, type MaterialPosition } from '../gelaender/derive';
import { tr } from '../../i18n';

/**
 * Abgeleitete Werte Gartentor (reine Funktionen, provisorisch bis zur
 * fachlichen Freigabe; Server rechnet beim Absenden erneut).
 */
export function deriveGartentor(
  inputs: GartentorInputs,
  stabBreiteMm: number,
  params: GartentorRuleParams = GARTENTOR_RULES_V0
): GartentorDerived {
  const oeffnung = inputs.oeffnungBreiteMm ?? 0;
  const hoehe = inputs.hoeheMm ?? 0;

  let fluegelBreitenMm: number[] = [];
  if (oeffnung > 0 && inputs.fluegelart) {
    if (inputs.fluegelart === 'ein') {
      fluegelBreitenMm = [Math.max(0, oeffnung - 2 * params.spaltMm)];
    } else {
      // Zweiflügelig: symmetrische Teilung, drei Spalte (2 seitlich, 1 Mitte).
      const nutz = Math.max(0, oeffnung - 3 * params.spaltMm);
      fluegelBreitenMm = [Math.round(nutz / 2), Math.round(nutz / 2)];
    }
  }

  const staebeProFluegel =
    inputs.fuellung === 'staketen' || inputs.fuellung === 'geschmiedet'
      ? fuellstabAnzahl(
          fluegelBreitenMm[0] ?? 0,
          stabBreiteMm,
          params.maxStabLichtMm
        )
      : 0;

  const baenderProFluegel =
    hoehe > params.drittesBandAbHoeheMm ? 3 : 2;

  return {
    fluegelBreitenMm,
    staebeProFluegel,
    baenderProFluegel,
    pfostenAnzahl: inputs.seitenbau === 'pfosten' ? 2 : 0,
  };
}

export function torMaterialAuszug(
  inputs: GartentorInputs,
  derived: GartentorDerived
): MaterialPosition[] {
  if (derived.fluegelBreitenMm.length === 0 || !inputs.hoeheMm) return [];
  const h = inputs.hoeheMm - inputs.bodenfreiheitMm;
  const positionen: MaterialPosition[] = [];
  derived.fluegelBreitenMm.forEach((breite, i) => {
    const name =
      derived.fluegelBreitenMm.length > 1
        ? tr('Flügel {n}', { n: i + 1 })
        : tr('Torflügel');
    positionen.push(
      { bezeichnung: tr('{name} Rahmen horizontal', { name }), anzahl: 2, laengeMm: breite },
      { bezeichnung: tr('{name} Rahmen vertikal', { name }), anzahl: 2, laengeMm: h }
    );
    if (derived.staebeProFluegel > 0) {
      positionen.push({
        bezeichnung: tr('{name} Füllstäbe', { name }),
        anzahl: derived.staebeProFluegel,
        laengeMm: null,
      });
    }
  });
  if (derived.pfostenAnzahl > 0 && inputs.hoeheMm) {
    positionen.push({
      bezeichnung: tr('Torpfosten (inkl. Einbindung)'),
      anzahl: derived.pfostenAnzahl,
      laengeMm: inputs.hoeheMm + 600,
    });
  }
  positionen.push({
    bezeichnung: tr('Bänder'),
    anzahl: derived.baenderProFluegel * derived.fluegelBreitenMm.length,
    laengeMm: null,
  });
  if (inputs.schloss && inputs.schloss !== 'ohne') {
    positionen.push({
      bezeichnung:
        inputs.schloss === 'schloss-druecker'
          ? tr('Einsteckschloss mit Drücker')
          : tr('Überwurf/Riegel'),
      anzahl: 1,
      laengeMm: null,
    });
  }
  return positionen;
}
