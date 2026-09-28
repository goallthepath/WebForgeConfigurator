// ============================================================================
// tests/configuration.test.ts – Prüfungen für den Bestellzettel
// ----------------------------------------------------------------------------
// Tests sind wie ein Probelauf vor dem grossen Rennen: Das Programm prüft sich
// selbst. «describe» ist ein Kapitel, «it» eine einzelne Prüfung und «expect»
// heisst «Ich erwarte, dass …». Sind alle Prüfungen grün, ist alles in Ordnung.
// ============================================================================
import { describe, expect, it } from 'vitest';
import { PRODUCT_MODULES } from '../products/catalog';
import {
  createDraftConfiguration,
  isValidConfigurationId,
} from '../products/configuration';

// Kapitel 1: Der neue Entwurf (Bestellzettel).
describe('Konfigurationsentwurf', () => {
  // Prüfung: Jeder Entwurf übernimmt die richtigen Versionsnummern vom Produkt.
  it('friert Produkt-, Regel- und Preisversion ein', () => {
    for (const module of PRODUCT_MODULES) {
      const draft = createDraftConfiguration(module.id);
      expect(draft.productVersion).toBe(module.productVersion);
      expect(draft.ruleVersion).toBe(module.ruleVersion);
      expect(draft.priceVersion).toBe(module.priceVersion);
      expect(draft.status).toBe('draft');
    }
  });
  // 🤧 Schnupfspruch: Grüen isch dr Test, grüen isch d'Wiese –
  //    jetzt dörf mer au e Prise gniesse.

  // Prüfung: Ohne Preisliste gibt es keine erfundenen Zahlen.
  it('hat ohne freigegebene Preisversion zwingend die Preisart "Individuelle Prüfung"', () => {
    const draft = createDraftConfiguration('gelaender');
    expect(draft.priceVersion).toBeNull();
    expect(draft.estimate.type).toBe('individual-review');
    expect(draft.estimate.minimum).toBeUndefined();
    expect(draft.estimate.maximum).toBeUndefined();
  });

  // Prüfung: Die Projektnummer vergibt nur der Server, nicht der Browser.
  it('vergibt die configurationId nicht lokal (Server-Autorität)', () => {
    const draft = createDraftConfiguration('fenstergitter');
    expect(draft.configurationId).toBeNull();
  });

  // Prüfung: Nur richtig geformte Projektnummern werden akzeptiert.
  it('prüft das Projektnummernformat WFC-JJJJ-NNNNNN', () => {
    expect(isValidConfigurationId('WFC-2026-000123')).toBe(true);
    expect(isValidConfigurationId('WFC-26-123')).toBe(false);
    expect(isValidConfigurationId('XYZ-2026-000123')).toBe(false);
  });
});

// Kapitel 2: Der Produktkatalog.
describe('Produktkatalog', () => {
  // Prüfung: Genau diese vier Produkte in genau dieser Reihenfolge.
  it('enthält die vier freigegebenen Module (Treppe seit 2026-07-18 beauftragt)', () => {
    expect(PRODUCT_MODULES.map((m) => m.id)).toEqual([
      'gelaender',
      'gartentor',
      'fenstergitter',
      'treppe',
    ]);
  });
});
// 🤧 Schnupfspruch: Vier Modül, alli parat –
//    e Prise Schnupf zum Apparat.
