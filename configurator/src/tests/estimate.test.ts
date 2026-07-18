import { describe, expect, it } from 'vitest';
import { estimateFor, describeEstimate } from '../pricing/estimate';

describe('Preisvorschau', () => {
  it('liefert ohne Preisversion ausschliesslich "Individuelle Prüfung" ohne Zahlen', () => {
    const estimate = estimateFor(null);
    expect(estimate).toEqual({ type: 'individual-review', currency: 'CHF' });
  });

  it('erfindet keine Preise: unbekannte Preisversionen führen zu einem Fehler statt zu Zahlen', () => {
    expect(() => estimateFor('1.0.0')).toThrow(/nicht implementiert/);
  });

  it('beschreibt die individuelle Prüfung ohne Preisangabe', () => {
    const text = describeEstimate({ type: 'individual-review', currency: 'CHF' });
    expect(text).toContain('Individuelle Prüfung');
    expect(text).not.toMatch(/\d/);
  });
});
