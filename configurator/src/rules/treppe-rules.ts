import type { TreppeDerived, TreppeInputs } from '../products/treppe/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { BFU_RICHTWERTE, RULE_APPROVAL_WARNING } from './gelaender-rules';

/**
 * Regelkatalog Treppe, ruleVersion 0.0.1.
 *
 * Die Schrittmassregel (2×Steigung + Auftritt ≈ 630 mm) ist eine
 * anerkannte Planungsformel; die konkreten Grenzwerte hier sind
 * TESTDATEN (A-004). BFU: Geländer im Treppenlauf mindestens 900 mm.
 * Statik, Norm-Nachweis und Baurecht bleiben fachliche Prüfung –
 * Ampel maximal GELB, Server rechnet beim Absenden erneut.
 */
export interface TreppeRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  idealSteigungMm: number;
  schrittmassMm: number;
  minSteigungMm: number;
  maxSteigungMm: number;
  minAuftrittMm: number;
  maxAuftrittMm: number;
  minSchrittmassMm: number;
  maxSchrittmassMm: number;
  minGeschosshoeheMm: number;
  /** Ab hier braucht es Podeste → individuelle Planung. */
  maxGeschosshoeheMm: number;
  minLaufbreiteMm: number;
  maxLaufbreiteMm: number;
  /** Maximaler Pfostenabstand entlang der Schräge. */
  maxPfostenabstandSchraegMm: number;
  maxStabAbstandMm: number;
  maxQuerstabAbstandMm: number;
  minGelaenderhoeheMm: number;
  maxGelaenderhoeheMm: number;
}

export const TREPPE_RULES_V0: TreppeRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  // TESTDATEN – Plausibilisierung und 3D-Vorschau.
  idealSteigungMm: 175,
  schrittmassMm: 630,
  minSteigungMm: 140,
  maxSteigungMm: 200,
  minAuftrittMm: 230,
  maxAuftrittMm: 320,
  minSchrittmassMm: 590,
  maxSchrittmassMm: 650,
  minGeschosshoeheMm: 400,
  maxGeschosshoeheMm: 3400,
  minLaufbreiteMm: 700,
  maxLaufbreiteMm: 1400,
  maxPfostenabstandSchraegMm: 1500,
  maxStabAbstandMm: 110,
  maxQuerstabAbstandMm: 120,
  minGelaenderhoeheMm: 850,
  maxGelaenderhoeheMm: 1200,
};

/** BFU-Richtwert: Geländer im Treppenlauf mindestens 0,90 m. */
export const BFU_TREPPENLAUF_MIN_MM = 900;

export function validateTreppe(
  inputs: TreppeInputs,
  derived: TreppeDerived,
  selectedProfiles: readonly Profile[],
  params: TreppeRuleParams = TREPPE_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

  const H = inputs.geschosshoeheMm;
  if (H !== null) {
    if (H < params.minGeschosshoeheMm) {
      errors.push(
        `Geschosshöhe ${H} mm liegt unter dem Minimum von ${params.minGeschosshoeheMm} mm.`
      );
    }
    if (H > params.maxGeschosshoeheMm) {
      errors.push(
        `Geschosshöhe ${H} mm: Ein gerader Lauf braucht hier ein Zwischenpodest – bitte als individuelle Ausführung anfragen.`
      );
    }
  }

  if (inputs.laufbreiteMm !== null) {
    if (
      inputs.laufbreiteMm < params.minLaufbreiteMm ||
      inputs.laufbreiteMm > params.maxLaufbreiteMm
    ) {
      errors.push(
        `Laufbreite ${inputs.laufbreiteMm} mm liegt ausserhalb des Bereichs ${params.minLaufbreiteMm}–${params.maxLaufbreiteMm} mm.`
      );
    }
  }

  if (derived.steigungenAnzahl > 0) {
    if (
      derived.steigungMm < params.minSteigungMm ||
      derived.steigungMm > params.maxSteigungMm
    ) {
      errors.push(
        `Steigung ${derived.steigungMm} mm liegt ausserhalb ${params.minSteigungMm}–${params.maxSteigungMm} mm – Stufenzahl anpassen oder individuell planen.`
      );
    }
    if (
      derived.schrittmassMm < params.minSchrittmassMm ||
      derived.schrittmassMm > params.maxSchrittmassMm
    ) {
      warnings.push(
        `Schrittmass ${derived.schrittmassMm} mm liegt ausserhalb des üblichen Bereichs ${params.minSchrittmassMm}–${params.maxSchrittmassMm} mm – Gehkomfort wird fachlich geprüft.`
      );
    }
    if (
      derived.auftrittMm < params.minAuftrittMm ||
      derived.auftrittMm > params.maxAuftrittMm
    ) {
      warnings.push(
        `Auftritt ${derived.auftrittMm} mm liegt ausserhalb des üblichen Bereichs – wird fachlich geprüft.`
      );
    }
  }

  if (mitGelaender && inputs.gelaenderHoeheMm !== null) {
    if (inputs.gelaenderHoeheMm < BFU_TREPPENLAUF_MIN_MM) {
      errors.push(
        `Treppengeländer: BFU-Richtwert mindestens ${BFU_TREPPENLAUF_MIN_MM} mm im Lauf – bitte Höhe anpassen.`
      );
    }
    if (
      inputs.gelaenderHoeheMm < params.minGelaenderhoeheMm ||
      inputs.gelaenderHoeheMm > params.maxGelaenderhoeheMm
    ) {
      errors.push(
        `Geländerhöhe ${inputs.gelaenderHoeheMm} mm liegt ausserhalb des Vorschaubereichs.`
      );
    }
  }

  if (mitGelaender && inputs.kinderschutz !== 'nein') {
    if (inputs.fuellung === 'querstab') {
      warnings.push(
        'Querstäbe wirken als Leiter – im Treppenbereich mit Kindern wird das Schutzziel oft nicht erreicht (BFU). Wir prüfen Alternativen.'
      );
    } else {
      warnings.push(
        `Kinderschutz: Öffnungen werden nach BFU geprüft (${BFU_RICHTWERTE.kugelDurchmesserMm}-mm-Kugel bis ${BFU_RICHTWERTE.kinderschutzZoneMm} mm).`
      );
    }
  }

  if (mitTreppe && inputs.einbauort === 'aussen' && inputs.stufentyp === 'blech-glatt') {
    warnings.push(
      'Glattes Blech aussen: Rutschhemmung wird fachlich beurteilt – Gitterrost oder Tränenblech sind aussen üblich.'
    );
  }

  if (inputs.modus === 'gelaender') {
    warnings.push(
      'Geländer auf bestehende Treppe: Befestigung an Wange/Stufen und Zustand des Bestands werden beim Aufmass geprüft.'
    );
  }

  if (inputs.masseUngefaehr) {
    warnings.push('Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.');
  }

  if (inputs.fuellung === 'geschmiedet') {
    warnings.push(
      'Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.'
    );
  }

  if (mitTreppe) {
    warnings.push(
      'Tragkonstruktion (Wangen, Stufen, Auflager) wird statisch bemessen – Profile hier sind Vorschau.'
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
