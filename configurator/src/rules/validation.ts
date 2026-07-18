import type {
  ConfigurationState,
  Profile,
  ValidationResult,
} from '../products/types';
import { isProductionReady } from './profiles';

/**
 * Regelprüfung im Browser – Vorschau; der Server prüft beim Absenden
 * erneut und autoritativ (ADR-003).
 *
 * Regelkatalog-Status: Die fachlichen Grenzwerte sind noch nicht
 * freigegeben (Annahme A-004). Bis zur Freigabe kann keine Konfiguration
 * besser als GELB klassifiziert werden.
 */

export const RULES_APPROVED = false; // wird mit Gate-C-Freigabe pro ruleVersion gesetzt

export function validateConfiguration(
  config: ConfigurationState,
  selectedProfiles: readonly Profile[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(`Profil «${profile.name}» ist nicht mehr verfügbar.`);
    } else if (!isProductionReady(profile)) {
      warnings.push(
        `Profil «${profile.name}» ist noch nicht fachlich freigegeben (${profile.approval}).`
      );
    }
  }

  if (!RULES_APPROVED) {
    warnings.push(
      'Die technischen Produktregeln sind noch nicht fachlich freigegeben – jede Anfrage wird persönlich geprüft.'
    );
  }

  if (config.priceVersion === null) {
    warnings.push('Es liegt noch keine freigegebene Preisversion vor.');
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  if (warnings.length > 0 || !RULES_APPROVED) {
    return { level: 'yellow', warnings, errors };
  }
  return { level: 'green', warnings, errors };
}
