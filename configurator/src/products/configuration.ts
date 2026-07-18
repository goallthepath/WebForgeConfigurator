import { getProductModule } from './catalog';
import type { ConfigurationState, ProductId } from './types';
import { estimateFor } from '../pricing/estimate';

/**
 * Erzeugt einen neuen Konfigurationsentwurf mit eingefrorenen Versionen.
 * Die configurationId (WFC-JJJJ-NNNNNN) vergibt später ausschliesslich
 * der Server – lokal bleibt sie null.
 */
export function createDraftConfiguration(product: ProductId): ConfigurationState {
  const module = getProductModule(product);
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

export const CONFIGURATION_ID_PATTERN = /^WFC-\d{4}-\d{6}$/;

export function isValidConfigurationId(id: string): boolean {
  return CONFIGURATION_ID_PATTERN.test(id);
}
