import { describe, expect, it } from 'vitest';
import { PRODUCT_MODULES } from '../products/catalog';
import {
  createDraftConfiguration,
  isValidConfigurationId,
} from '../products/configuration';

describe('Konfigurationsentwurf', () => {
  it('friert Produkt-, Regel- und Preisversion ein', () => {
    for (const module of PRODUCT_MODULES) {
      const draft = createDraftConfiguration(module.id);
      expect(draft.productVersion).toBe(module.productVersion);
      expect(draft.ruleVersion).toBe(module.ruleVersion);
      expect(draft.priceVersion).toBe(module.priceVersion);
      expect(draft.status).toBe('draft');
    }
  });

  it('hat ohne freigegebene Preisversion zwingend die Preisart "Individuelle Prüfung"', () => {
    const draft = createDraftConfiguration('gelaender');
    expect(draft.priceVersion).toBeNull();
    expect(draft.estimate.type).toBe('individual-review');
    expect(draft.estimate.minimum).toBeUndefined();
    expect(draft.estimate.maximum).toBeUndefined();
  });

  it('vergibt die configurationId nicht lokal (Server-Autorität)', () => {
    const draft = createDraftConfiguration('fenstergitter');
    expect(draft.configurationId).toBeNull();
  });

  it('prüft das Projektnummernformat WFC-JJJJ-NNNNNN', () => {
    expect(isValidConfigurationId('WFC-2026-000123')).toBe(true);
    expect(isValidConfigurationId('WFC-26-123')).toBe(false);
    expect(isValidConfigurationId('XYZ-2026-000123')).toBe(false);
  });
});

describe('Produktkatalog', () => {
  it('enthält die vier freigegebenen Module (Treppe seit 2026-07-18 beauftragt)', () => {
    expect(PRODUCT_MODULES.map((m) => m.id)).toEqual([
      'gelaender',
      'gartentor',
      'fenstergitter',
      'treppe',
    ]);
  });
});
