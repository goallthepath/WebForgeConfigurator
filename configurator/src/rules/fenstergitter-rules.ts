import type { FenstergitterInputs } from '../products/fenstergitter/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { BFU_RICHTWERTE, RULE_APPROVAL_WARNING } from './gelaender-rules';

/**
 * Regelkatalog Fenstergitter, ruleVersion 0.0.1.
 * Alle Zahlenwerte sind TESTDATEN (A-004) – Ampel bleibt maximal GELB,
 * der Server prüft beim Absenden erneut.
 */
export interface FenstergitterRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  /** Spielraum je Seite bei Leibungsmontage (Lichtmass → Aussenmass). */
  leibungSpielMm: number;
  /** Überstand je Seite bei Montage vor der Wand. */
  vorwandUeberstandMm: number;
  /** Maximaler lichter Stababstand. */
  maxStabLichtMm: number;
  minBreiteMm: number;
  maxBreiteMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
  /** Ab dieser Gitterhöhe drei statt zwei Laschen je Seite. */
  dritteLascheAbHoeheMm: number;
}

export const FENSTERGITTER_RULES_V0: FenstergitterRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  leibungSpielMm: 15,
  vorwandUeberstandMm: 60,
  maxStabLichtMm: 130,
  minBreiteMm: 300,
  maxBreiteMm: 2500,
  minHoeheMm: 300,
  maxHoeheMm: 2200,
  dritteLascheAbHoeheMm: 1200,
};

export function validateFenstergitter(
  inputs: FenstergitterInputs,
  selectedProfiles: readonly Profile[],
  params: FenstergitterRuleParams = FENSTERGITTER_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Fluchtweg: fest montierte Gitter sind dort nicht zulässig.
  if (inputs.fluchtweg === 'ja') {
    errors.push(
      'Fluchtweg-Fenster dürfen nicht fest vergittert werden – dafür braucht es eine öffenbare Sonderlösung. Bitte als individuelle Ausführung anfragen.'
    );
  } else if (inputs.fluchtweg === 'unbekannt') {
    warnings.push(
      'Ob das Fenster ein Fluchtweg ist, wird vor der Ausführung verbindlich geklärt (Baurecht/Brandschutz).'
    );
  }

  if (inputs.breiteMm !== null) {
    if (inputs.breiteMm < params.minBreiteMm || inputs.breiteMm > params.maxBreiteMm) {
      errors.push(
        `Breite ${inputs.breiteMm} mm liegt ausserhalb des Bereichs ${params.minBreiteMm}–${params.maxBreiteMm} mm – bitte individuell anfragen.`
      );
    }
  }
  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        `Höhe ${inputs.hoeheMm} mm liegt ausserhalb des Bereichs ${params.minHoeheMm}–${params.maxHoeheMm} mm – bitte individuell anfragen.`
      );
    }
  }

  if (inputs.masseUngefaehr) {
    warnings.push(
      'Ungefähre Masse: Vor der Fertigung wird am Fenster ausgemessen (Aufmass).'
    );
  }

  if (inputs.untergrund === 'unbekannt') {
    warnings.push('Befestigungsuntergrund wird vor Ort geprüft.');
  }
  if (inputs.untergrund === 'backstein') {
    warnings.push(
      'Backstein/Mauerwerk: Dübelwahl und Randabstände werden fachlich bestimmt.'
    );
  }

  if (inputs.einbauort === 'aussen') {
    warnings.push('Ausseneinsatz: Korrosionsschutz wird entsprechend ausgelegt.');
  }

  if (inputs.stabWunschDm !== null) {
    warnings.push(
      `Sonderprofil Stab Ø ${inputs.stabWunschDm} mm: kein Katalogprofil – Machbarkeit wird fachlich geprüft.`
    );
  }

  if (inputs.ornamentTyp) {
    warnings.push(
      'Zierelemente: Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich (Manufaktur).'
    );
  }

  warnings.push(
    `Stabteilung wird einbruchhemmend und kindersicher geprüft (BFU-Richtwert ${BFU_RICHTWERTE.kugelDurchmesserMm}-mm-Kugel).`
  );

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
