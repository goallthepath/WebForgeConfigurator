// ============================================================================
// tests/estimate.test.ts – Prüfungen für die Preisvorschau
// ----------------------------------------------------------------------------
// Hier prüfen wir, dass der Konfigurator beim Preis ehrlich bleibt: Ohne
// offizielle Preisliste darf er keine Zahlen erfinden – nicht mal aus Spass.
// ============================================================================
import { describe, expect, it } from 'vitest';
import { estimateFor, describeEstimate } from '../pricing/estimate';

// Kapitel: Preisvorschau.
describe('Preisvorschau', () => {
  // Prüfung: Ohne Preisliste → nur «Individuelle Prüfung».
  it('liefert ohne Preisversion ausschliesslich "Individuelle Prüfung" ohne Zahlen', () => {
    const estimate = estimateFor(null);
    expect(estimate).toEqual({ type: 'individual-review', currency: 'CHF' });
  });

  // Prüfung: Eine unbekannte Preisliste gibt einen Fehler statt ausgedachter Zahlen.
  it('erfindet keine Preise: unbekannte Preisversionen führen zu einem Fehler statt zu Zahlen', () => {
    expect(() => estimateFor('1.0.0')).toThrow(/nicht implementiert/);
  });

  // Prüfung: Der Text für Menschen enthält keine einzige Ziffer.
  // 🤧 Schnupfspruch: Rot isch dr Test, dr Kafi chalt –
  //    e Prise Schnupf, dänn gaht's scho bald.
  it('beschreibt die individuelle Prüfung ohne Preisangabe', () => {
    const text = describeEstimate({ type: 'individual-review', currency: 'CHF' });
    expect(text).toContain('Individuelle Prüfung');
    expect(text).not.toMatch(/\d/);
  });
});
// 🤧 Schnupfspruch: Kei Zahl im Text, das isch dr Plan –
//    e Prise Schnupf, dänn gaht's voran.
