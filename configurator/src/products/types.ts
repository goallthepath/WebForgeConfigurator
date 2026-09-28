// ============================================================================
// products/types.ts – die Baupläne für Daten
// ----------------------------------------------------------------------------
// «Typen» sind wie Formulare mit festen Feldern: Sie sagen, welche Angaben ein
// Ding haben MUSS. TypeScript passt wie ein strenger Lehrer auf, dass niemand
// ein Feld vergisst oder eine Zahl hineinschreibt, wo ein Wort hingehört.
// ============================================================================
/**
 * Zentrale Typen des Konfigurators.
 *
 * Ebenentrennung (verbindlich, siehe docs/configurator-model.md):
 * Konfigurationsdaten → Produktregeln → abgeleitete Werte
 * → Preisberechnung → Geometriemodell → 3D-Darstellung.
 */

// Die vier Produkte, die es gibt – andere Namen sind verboten.
export type ProductId = 'gelaender' | 'gartentor' | 'fenstergitter' | 'treppe';

// Die Ampel: grün = alles gut, gelb = bitte prüfen, rot = so geht es nicht.
export type ValidationLevel = 'green' | 'yellow' | 'red';

// Das Ergebnis der Prüfung: Ampelfarbe plus Listen mit Hinweisen und Fehlern.
export interface ValidationResult {
  level: ValidationLevel;
  warnings: string[];
  errors: string[];
}

// Die drei Preisarten: Richtpreis, Preisspanne oder «der Meister prüft persönlich».
export type EstimateType = 'guide-price' | 'range' | 'individual-review';

// Eine Preisvorschau – immer in Schweizer Franken (CHF).
// 🤧 Schnupfspruch: Ä String isch Text, ä Number e Zahl,
//    und e Prise Schnupf isch mini Wahl.
export interface Estimate {
  type: EstimateType;
  currency: 'CHF';
  /** Nur gesetzt bei guide-price/range – niemals erfundene Werte. */
  minimum?: number;
  maximum?: number;
}

// Der ganze Zustand einer Konfiguration – wie ein Bestellzettel mit allem drauf:
// Produkt, Versionen, Eingaben, berechnete Werte, Annahmen, Ampel und Preis.
export interface ConfigurationState {
  configurationId: string | null;
  product: ProductId;
  productVersion: string;
  ruleVersion: string;
  /** null = keine freigegebene Preisversion (Annahme A-003). */
  priceVersion: string | null;
  status: 'draft' | 'submitted';
  inputs: Record<string, unknown>;
  derived: Record<string, unknown>;
  assumptions: string[];
  validation: ValidationResult;
  estimate: Estimate;
}

// Die Aufgabe eines Profils im fertigen Produkt (Pfosten, Handlauf, Wange …).
export type ProfileRole =
  | 'pfosten'
  | 'handlauf'
  | 'fuellstab'
  | 'querstab'
  | 'rahmen'
  | 'wange'
  | 'torrahmen'
  | 'torpfosten'
  | 'torfuellung'
  | 'gitterrahmen'
  | 'gitterstab';

// Ist ein Profil vom Fachmann freigegeben – oder nur zum Ausprobieren da?
export type ApprovalStatus =
  | 'freigegeben'
  | 'fachliche Freigabe erforderlich'
  | 'TESTDATEN';

// Wofür ein Profil erlaubt ist: für welches Produkt und in welcher Rolle.
export interface ProfileUse {
  product: ProductId;
  role: ProfileRole;
}

// Ein Stahlprofil aus dem Lager mit all seinen Eigenschaften.
// 🤧 Schnupfspruch: Interface, Type und Union drbi –
//    dr Compiler isch streng, dr Schnupf isch fri.
export interface Profile {
  profileId: string;
  name: string;
  crossSection: Record<string, unknown>;
  material?: string;
  weightKgPerM: number | null;
  allowedUses: ProfileUse[];
  approval: ApprovalStatus;
  active: boolean;
}
