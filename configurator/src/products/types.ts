/**
 * Zentrale Typen des Konfigurators.
 *
 * Ebenentrennung (verbindlich, siehe docs/configurator-model.md):
 * Konfigurationsdaten → Produktregeln → abgeleitete Werte
 * → Preisberechnung → Geometriemodell → 3D-Darstellung.
 */

export type ProductId = 'gelaender' | 'gartentor' | 'fenstergitter';

export type ValidationLevel = 'green' | 'yellow' | 'red';

export interface ValidationResult {
  level: ValidationLevel;
  warnings: string[];
  errors: string[];
}

export type EstimateType = 'guide-price' | 'range' | 'individual-review';

export interface Estimate {
  type: EstimateType;
  currency: 'CHF';
  /** Nur gesetzt bei guide-price/range – niemals erfundene Werte. */
  minimum?: number;
  maximum?: number;
}

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

export type ProfileRole =
  | 'pfosten'
  | 'handlauf'
  | 'fuellstab'
  | 'rahmen'
  | 'torrahmen'
  | 'torpfosten'
  | 'torfuellung'
  | 'gitterrahmen'
  | 'gitterstab';

export type ApprovalStatus =
  | 'freigegeben'
  | 'fachliche Freigabe erforderlich'
  | 'TESTDATEN';

export interface ProfileUse {
  product: ProductId;
  role: ProfileRole;
}

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
