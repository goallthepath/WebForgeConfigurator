import type { GelaenderInputs } from '../products/gelaender/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';

/**
 * Regelkatalog Geländer, ruleVersion 0.0.1.
 *
 * ACHTUNG: Sämtliche Zahlenwerte sind TESTDATEN für Entwicklung und
 * 3D-Darstellung. Kein Wert ist fachlich freigegeben (Annahme A-004).
 * Solange approval != 'freigegeben', kann keine Konfiguration besser
 * als GELB klassifiziert werden und alle abgeleiteten Stückzahlen
 * gelten als provisorisch. Der Server prüft beim Absenden erneut.
 */
export interface GelaenderRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  /** Maximaler Pfostenabstand (Achsmass) in mm. */
  maxPfostenabstandMm: number;
  /** Maximaler lichter Abstand zwischen Füllstäben in mm. */
  maxStabAbstandMm: number;
  /** Maximaler lichter Abstand zwischen Querstab-Lagen (Reling) in mm. */
  maxQuerstabAbstandMm: number;
  /** Visuelle/prov. Bodenfreiheit der Füllung in mm. */
  bodenfreiheitMm: number;
  /** Maximaler Pfostenabstand bei Glasfüllung in mm. */
  maxPfostenabstandGlasMm: number;
  minSegmentLaengeMm: number;
  maxSegmentLaengeMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
}

export const GELAENDER_RULES_V0: GelaenderRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  // TESTDATEN – dienen nur der Plausibilisierung und 3D-Vorschau.
  maxPfostenabstandMm: 1500,
  maxStabAbstandMm: 110,
  maxQuerstabAbstandMm: 120,
  bodenfreiheitMm: 50,
  maxPfostenabstandGlasMm: 1000,
  minSegmentLaengeMm: 300,
  maxSegmentLaengeMm: 6000,
  minHoeheMm: 800,
  maxHoeheMm: 1300,
};

export const RULE_APPROVAL_WARNING =
  'Die technischen Produktregeln (Abstände, Grenzmasse) sind noch nicht fachlich freigegeben – ' +
  'Stückzahlen und Masse in der Vorschau sind provisorisch. Unser Meister prüft jede Anfrage persönlich.';

export function validateGelaender(
  inputs: GelaenderInputs,
  selectedProfiles: readonly Profile[],
  params: GelaenderRuleParams = GELAENDER_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const segment of inputs.segmentLaengenMm) {
    if (segment < params.minSegmentLaengeMm) {
      errors.push(
        `Segmentlänge ${segment} mm liegt unter dem Minimum von ${params.minSegmentLaengeMm} mm.`
      );
    }
    if (segment > params.maxSegmentLaengeMm) {
      errors.push(
        `Segmentlänge ${segment} mm überschreitet das Maximum von ${params.maxSegmentLaengeMm} mm – bitte als individuelle Ausführung anfragen.`
      );
    }
  }

  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        `Höhe ${inputs.hoeheMm} mm liegt ausserhalb des zulässigen Bereichs (${params.minHoeheMm}–${params.maxHoeheMm} mm).`
      );
    }
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

  if (inputs.masseUngefaehr) {
    warnings.push(
      'Ungefähre Masse: Vor der Offerte ist ein Aufmass oder eine Massbestätigung nötig.'
    );
  }

  if (inputs.untergrund === 'unbekannt') {
    warnings.push('Befestigungsuntergrund muss vor Ort geprüft werden.');
  }

  if (inputs.farbe === 'individuell') {
    warnings.push('Individuelle Farbe: wird als Sonderwunsch persönlich geprüft.');
  }

  if (inputs.fuellungsart === 'querstab') {
    warnings.push(
      'Querstäbe (Reling) gelten als erkletterbar – die Eignung Ihrer Einbausituation wird fachlich geprüft.'
    );
  }

  if (inputs.fuellungsart === 'glas') {
    warnings.push(
      'Glasaufbau und Glasstärke (Sicherheitsglas) werden bei der fachlichen Prüfung verbindlich festgelegt.'
    );
    if (inputs.ohneHandlauf) {
      warnings.push(
        'Ausführung ohne Handlauf: Zulässigkeit wird für Ihre Einbausituation fachlich geprüft.'
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
