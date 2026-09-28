import type { GartentorInputs } from '../products/gartentor/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { RULE_APPROVAL_WARNING } from './gelaender-rules';
import { tr } from '../i18n';

/**
 * Regelkatalog Gartentor, ruleVersion 0.0.1.
 * Alle Zahlenwerte sind TESTDATEN (A-004) – Ampel bleibt maximal GELB,
 * der Server prüft beim Absenden erneut.
 */
export interface GartentorRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  minOeffnungMm: number;
  /** Maximale lichte Öffnung einflügelig / zweiflügelig. */
  maxOeffnungEinMm: number;
  maxOeffnungZweiMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
  /** Spalt je Seite (Band-/Schlossseite) und zwischen den Flügeln. */
  spaltMm: number;
  minBodenfreiheitMm: number;
  maxBodenfreiheitMm: number;
  /** Ab dieser Torhöhe drei statt zwei Bänder je Flügel. */
  drittesBandAbHoeheMm: number;
  /** Maximaler lichter Stababstand der Füllung. */
  maxStabLichtMm: number;
}

export const GARTENTOR_RULES_V0: GartentorRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  minOeffnungMm: 700,
  maxOeffnungEinMm: 1300,
  maxOeffnungZweiMm: 3200,
  minHoeheMm: 600,
  maxHoeheMm: 1800,
  spaltMm: 15,
  minBodenfreiheitMm: 20,
  maxBodenfreiheitMm: 100,
  drittesBandAbHoeheMm: 1200,
  maxStabLichtMm: 110,
};

export function validateGartentor(
  inputs: GartentorInputs,
  selectedProfiles: readonly Profile[],
  params: GartentorRuleParams = GARTENTOR_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const b = inputs.oeffnungBreiteMm;
  if (b !== null) {
    if (b < params.minOeffnungMm) {
      errors.push(
        tr('Öffnung {b} mm ist schmaler als das Minimum von {min} mm.', {
          b,
          min: params.minOeffnungMm,
        })
      );
    }
    if (inputs.fluegelart === 'ein' && b > params.maxOeffnungEinMm) {
      errors.push(
        tr(
          'Einflügelig bis {max} mm Öffnung – bitte zweiflügelig wählen oder individuell anfragen.',
          { max: params.maxOeffnungEinMm }
        )
      );
    }
    if (inputs.fluegelart === 'zwei' && b > params.maxOeffnungZweiMm) {
      errors.push(
        tr(
          'Öffnung {b} mm überschreitet das Maximum von {max} mm – bitte als Toranlage individuell anfragen.',
          { b, max: params.maxOeffnungZweiMm }
        )
      );
    }
  }

  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        tr('Torhöhe {h} mm liegt ausserhalb des Bereichs {min}–{max} mm.', {
          h: inputs.hoeheMm,
          min: params.minHoeheMm,
          max: params.maxHoeheMm,
        })
      );
    }
  }

  if (
    inputs.bodenfreiheitMm < params.minBodenfreiheitMm ||
    inputs.bodenfreiheitMm > params.maxBodenfreiheitMm
  ) {
    errors.push(
      tr('Bodenfreiheit {b} mm liegt ausserhalb des Bereichs {min}–{max} mm.', {
        b: inputs.bodenfreiheitMm,
        min: params.minBodenfreiheitMm,
        max: params.maxBodenfreiheitMm,
      })
    );
  }

  if (inputs.masseUngefaehr) {
    warnings.push(tr('Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.'));
  }

  if (inputs.untergrund === 'unbekannt') {
    warnings.push(tr('Untergrund/Fundamente werden beim Aufmass geprüft.'));
  } else if (inputs.untergrund && inputs.untergrund !== 'beton') {
    warnings.push(tr('Für Torpfosten in weichem Untergrund werden Fundamente fachlich dimensioniert.'));
  }

  if (inputs.seitenbau === 'mauer') {
    warnings.push(tr('Befestigung an bestehender Mauer: Zustand und Tragfähigkeit werden vor Ort geprüft.'));
  }

  if (inputs.antriebVorbereitung) {
    warnings.push(tr('Antriebs-Vorbereitung (Leerrohr): Die konkrete Motorisierung wird persönlich geprüft und offeriert.'));
  }

  if (inputs.fuellung === 'geschmiedet') {
    warnings.push(tr('Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.'));
  }

  if (inputs.hoeheMm !== null && inputs.hoeheMm > 1400) {
    warnings.push(tr('Hohe Torflügel: Windlast und Bandbelastung werden statisch geprüft.'));
  }

  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(tr('Profil «{name}» ist nicht mehr verfügbar.', { name: tr(profile.name) }));
    } else if (!isProductionReady(profile)) {
      warnings.push(
        tr('Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).', {
          name: tr(profile.name),
          approval: tr(profile.approval),
        })
      );
    }
  }

  if (params.approval !== 'freigegeben') {
    warnings.push(tr(RULE_APPROVAL_WARNING));
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
