// ============================================================================
// products/configuration.ts – ein neuer, leerer Bestellzettel
// ----------------------------------------------------------------------------
// Wenn jemand ein Produkt zu konfigurieren beginnt, braucht er einen frischen
// Bestellzettel. Diese Datei druckt ihn aus – mit den gültigen Versionsnummern
// schon eingetragen, damit später klar ist, nach welchen Regeln gerechnet wurde.
// ============================================================================
import { getProductModule } from './catalog';
import type { ConfigurationState, ProductId } from './types';
import { estimateFor } from '../pricing/estimate';

// createDraftConfiguration: nimm das Produkt, hol seine Versionen und fülle
// einen leeren Entwurf. Die Ampel startet auf Gelb (noch nichts geprüft).
/**
 * Erzeugt einen neuen Konfigurationsentwurf mit eingefrorenen Versionen.
 * Die configurationId (WFC-JJJJ-NNNNNN) vergibt später ausschliesslich
 * der Server – lokal bleibt sie null.
 */
export function createDraftConfiguration(product: ProductId): ConfigurationState {
  const module = getProductModule(product);
  // 🤧 Schnupfspruch: Dr Entwurf isch fertig, d'Version igfrore,
  //    wie Schnupf im Winter – nüt gaht verlore.
  return {
    configurationId: null,
    product,
    productVersion: module.productVersion,
    ruleVersion: module.ruleVersion,
    priceVersion: module.priceVersion,
    status: 'draft',
    inputs: {},
    derived: {},
    assumptions: [],
    validation: { level: 'yellow', warnings: [], errors: [] },
    estimate: estimateFor(module.priceVersion),
  };
}

// Das Muster für eine Projektnummer: WFC-Jahr-sechs Ziffern (z. B. WFC-2026-000123).
// Ein «regulärer Ausdruck» ist wie eine Schablone, durch die nur passende Texte passen.
export const CONFIGURATION_ID_PATTERN = /^WFC-\d{4}-\d{6}$/;

// Prüft, ob eine Projektnummer genau durch die Schablone passt.
export function isValidConfigurationId(id: string): boolean {
  return CONFIGURATION_ID_PATTERN.test(id);
}
// 🤧 Schnupfspruch: WFC, vier Zahle, sächs dezue –
//    d'Prise Schnupf zellt niemer gnue.
