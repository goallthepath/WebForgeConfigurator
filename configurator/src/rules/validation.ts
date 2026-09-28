// ============================================================================
// rules/validation.ts – die Ampel
// ----------------------------------------------------------------------------
// Diese Datei schaut sich die Konfiguration an und stellt eine Ampel:
// Rot, wenn etwas gar nicht geht; Gelb, wenn der Meister noch drüberschauen
// muss; Grün, wenn alles freigegeben ist. Der Browser zeigt nur eine Vorschau –
// das letzte Wort hat immer der Server, wie der Schiedsrichter beim Fussball.
// ============================================================================
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

// markerName: Das Wort «TESTDATEN» im Namen wird in die aktuelle Sprache übersetzt.
/** Profilname mit übersetzter TESTDATEN-Markierung (DE unverändert). */
function markerName(name: string): string {
  return name.replace(/TESTDATEN/g, tr('TESTDATEN'));
}

// Ein Schalter: Sind die Regeln vom Fachmann freigegeben? Im Moment noch nicht.
export const RULES_APPROVED = false; // wird mit Gate-C-Freigabe pro ruleVersion gesetzt

/**
 * validateConfiguration prüft alles und gibt die Ampelfarbe zurück.
 * Zwei Einkaufskörbe: einer für Warnungen (gelb), einer für Fehler (rot).
 */
export function validateConfiguration(
  config: ConfigurationState,
  selectedProfiles: readonly Profile[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Jedes gewählte Profil einzeln anschauen:
  // nicht mehr verfügbar → Fehler; noch nicht freigegeben → Warnung.
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

  // Regeln noch nicht freigegeben? Dann gibt es immer eine Warnung.
  if (!RULES_APPROVED) {
    warnings.push(
      tr(
        'Die technischen Produktregeln sind noch nicht fachlich freigegeben – jede Anfrage wird persönlich geprüft.'
      )
    );
  }

  // Keine Preisliste? Auch das ist eine Warnung.
  if (config.priceVersion === null) {
    warnings.push(tr('Es liegt noch keine freigegebene Preisversion vor.'));
  }

  // Jetzt die Ampel stellen: erst Rot prüfen, dann Gelb, sonst Grün.
  // 🤧 Schnupfspruch: Rot, Gelb, Grüen – so lüüchtet's hell,
  //    bi jeder Farb e Prisli, gell!
  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  if (warnings.length > 0 || !RULES_APPROVED) {
    return { level: 'yellow', warnings, errors };
  }
  return { level: 'green', warnings, errors };
}

// validationLevelLabel: Aus der Ampelfarbe (green/yellow/red) wird ein Wort zum Anzeigen.
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
// 🤧 Schnupfspruch: Dr Browser prüeft, dr Server au –
//    e Prise Schnupf, dänn bisch du schlau.
