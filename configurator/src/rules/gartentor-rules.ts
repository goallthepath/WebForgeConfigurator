import type { GartentorInputs } from '../products/gartentor/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { RULE_APPROVAL_WARNING } from './gelaender-rules';

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
        `Öffnung ${b} mm ist schmaler als das Minimum von ${params.minOeffnungMm} mm.`
      );
    }
    if (inputs.fluegelart === 'ein' && b > params.maxOeffnungEinMm) {
      errors.push(
        `Einflügelig bis ${params.maxOeffnungEinMm} mm Öffnung – bitte zweiflügelig wählen oder individuell anfragen.`
      );
    }
    if (inputs.fluegelart === 'zwei' && b > params.maxOeffnungZweiMm) {
      errors.push(
        `Öffnung ${b} mm überschreitet das Maximum von ${params.maxOeffnungZweiMm} mm – bitte als Toranlage individuell anfragen.`
      );
    }
  }

  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        `Torhöhe ${inputs.hoeheMm} mm liegt ausserhalb des Bereichs ${params.minHoeheMm}–${params.maxHoeheMm} mm.`
      );
    }
  }

  if (
    inputs.bodenfreiheitMm < params.minBodenfreiheitMm ||
    inputs.bodenfreiheitMm > params.maxBodenfreiheitMm
  ) {
    errors.push(
      `Bodenfreiheit ${inputs.bodenfreiheitMm} mm liegt ausserhalb des Bereichs ${params.minBodenfreiheitMm}–${params.maxBodenfreiheitMm} mm.`
    );
  }

  if (inputs.masseUngefaehr) {
    warnings.push('Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.');
  }

  if (inputs.untergrund === 'unbekannt') {
    warnings.push('Untergrund/Fundamente werden beim Aufmass geprüft.');
  } else if (inputs.untergrund && inputs.untergrund !== 'beton') {
    warnings.push(
      'Für Torpfosten in weichem Untergrund werden Fundamente fachlich dimensioniert.'
    );
  }

  if (inputs.seitenbau === 'mauer') {
    warnings.push(
      'Befestigung an bestehender Mauer: Zustand und Tragfähigkeit werden vor Ort geprüft.'
    );
  }

  if (inputs.antriebVorbereitung) {
    warnings.push(
      'Antriebs-Vorbereitung (Leerrohr): Die konkrete Motorisierung wird persönlich geprüft und offeriert.'
    );
  }

  if (inputs.fuellung === 'geschmiedet') {
    warnings.push(
      'Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.'
    );
  }

  if (inputs.hoeheMm !== null && inputs.hoeheMm > 1400) {
    warnings.push(
      'Hohe Torflügel: Windlast und Bandbelastung werden statisch geprüft.'
    );
  }

  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(`Profil «${profile.name}» ist nicht mehr verfügbar.`);
    } else if (!isProductionReady(profile)) {
      warnings.push(
        `Profil «${profile.name}» ist noch nicht fachlich freigegeben (${profile.approval}).`
      );
    }
  }

  if (params.approval !== 'freigegeben') {
    warnings.push(RULE_APPROVAL_WARNING);
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
