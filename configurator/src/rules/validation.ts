import type {
  ConfigurationState,
  Profile,
  ValidationResult,
} from '../products/types';
import { tr } from '../i18n';
import { approvalLabel, isProductionReady } from './profiles';

/**
 * Regelprüfung im Browser – Vorschau; der Server prüft beim Absenden
 * erneut und autoritativ (ADR-003).
 *
 * Regelkatalog-Status: Die fachlichen Grenzwerte sind noch nicht
 * freigegeben (Annahme A-004). Bis zur Freigabe kann keine Konfiguration
 * besser als GELB klassifiziert werden.
 */

/** Profilname mit übersetzter TESTDATEN-Markierung (DE unverändert). */
function markerName(name: string): string {
  return name.replace(/TESTDATEN/g, tr('TESTDATEN'));
}

export const RULES_APPROVED = false; // wird mit Gate-C-Freigabe pro ruleVersion gesetzt

export function validateConfiguration(
  config: ConfigurationState,
  selectedProfiles: readonly Profile[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(tr('Profil «{name}» ist nicht mehr verfügbar.', { name: markerName(profile.name) }));
    } else if (!isProductionReady(profile)) {
      warnings.push(
        tr('Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).', {
          name: markerName(profile.name),
          approval: approvalLabel(profile.approval),
        })
      );
    }
  }

  if (!RULES_APPROVED) {
    warnings.push(
      tr(
        'Die technischen Produktregeln sind noch nicht fachlich freigegeben – jede Anfrage wird persönlich geprüft.'
      )
    );
  }

  if (config.priceVersion === null) {
    warnings.push(tr('Es liegt noch keine freigegebene Preisversion vor.'));
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  if (warnings.length > 0 || !RULES_APPROVED) {
    return { level: 'yellow', warnings, errors };
  }
  return { level: 'green', warnings, errors };
}

/** Anzeigetext der Ampelstufe (Grün/Gelb/Rot) in der aktuellen Sprache. */
export function validationLevelLabel(level: ValidationResult['level']): string {
  switch (level) {
    case 'green':
      return tr('Grün');
    case 'yellow':
      return tr('Gelb');
    case 'red':
      return tr('Rot');
  }
}
