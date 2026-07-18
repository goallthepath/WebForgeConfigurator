import { describe, expect, it } from 'vitest';
import { deriveTreppe, treppeMaterialAuszug } from '../products/treppe/derive';
import { buildTreppeGeometry } from '../products/treppe/geometry';
import {
  EMPTY_TREPPE_INPUTS,
  type TreppeInputs,
} from '../products/treppe/types';
import {
  BFU_TREPPENLAUF_MIN_MM,
  TREPPE_RULES_V0,
  validateTreppe,
} from '../rules/treppe-rules';

const P = TREPPE_RULES_V0;

function inputsWith(patch: Partial<TreppeInputs>): TreppeInputs {
  return { ...EMPTY_TREPPE_INPUTS, ...patch };
}

describe('Steigungsrechnung (Schrittmassregel)', () => {
  it('wählt die Steigungszahl nahe der Idealsteigung', () => {
    const d = deriveTreppe(
      inputsWith({ modus: 'treppe', geschosshoeheMm: 2800 }),
      12
    );
    expect(d.steigungenAnzahl).toBe(16); // 2800/175
    expect(d.stufenAnzahl).toBe(15);
    expect(d.steigungMm).toBe(175);
  });

  it('hält das Schrittmass 2s+a im Zielbereich', () => {
    for (const H of [2400, 2650, 2800, 3050]) {
      const d = deriveTreppe(inputsWith({ modus: 'treppe', geschosshoeheMm: H }), 12);
      expect(d.schrittmassMm).toBeGreaterThanOrEqual(P.minSchrittmassMm - 10);
      expect(d.schrittmassMm).toBeLessThanOrEqual(P.maxSchrittmassMm + 10);
    }
  });

  it('manuelle Steigungszahl übersteuert die Automatik', () => {
    const d = deriveTreppe(
      inputsWith({ modus: 'treppe', geschosshoeheMm: 2800, stufenAnzahlManuell: 14 }),
      12
    );
    expect(d.steigungenAnzahl).toBe(14);
    expect(d.steigungMm).toBe(200);
  });

  it('Lauflänge = (n−1)·Auftritt', () => {
    const d = deriveTreppe(inputsWith({ modus: 'treppe', geschosshoeheMm: 2800 }), 12);
    expect(d.lauflaengeMm).toBe((d.steigungenAnzahl - 1) * d.auftrittMm);
    expect(d.neigungGrad).toBeGreaterThan(25);
    expect(d.neigungGrad).toBeLessThan(45);
  });
});

describe('Treppengeländer-Ableitung', () => {
  const basis = inputsWith({
    modus: 'kombiniert',
    geschosshoeheMm: 2800,
    gelaenderSeite: 'beide',
    gelaenderHoeheMm: 1000,
    fuellung: 'staketen',
  });

  it('zählt Seiten und Pfosten entlang der Schrägen', () => {
    const d = deriveTreppe(basis, 12);
    expect(d.gelaenderSeiten).toBe(2);
    const schraegAbstand = d.schraegeLaengeMm / (d.pfostenProSeite - 1);
    expect(schraegAbstand).toBeLessThanOrEqual(P.maxPfostenabstandSchraegMm);
  });

  it('Modus «treppe» hat kein Geländer, «gelaender» keine Treppenlieferung', () => {
    const nurTreppe = deriveTreppe(
      { ...basis, modus: 'treppe' },
      12
    );
    expect(nurTreppe.gelaenderSeiten).toBe(0);

    const nurGelaender = inputsWith({
      modus: 'gelaender',
      geschosshoeheMm: 2800,
      gelaenderSeite: 'links',
      gelaenderHoeheMm: 1000,
      fuellung: 'staketen',
    });
    const geo = buildTreppeGeometry(
      nurGelaender,
      deriveTreppe(nurGelaender, 12),
      {}
    );
    expect(geo.treppeBestand).toBe(true);
    expect(geo.pfosten.length).toBeGreaterThan(0);
    const namen = treppeMaterialAuszug(nurGelaender, deriveTreppe(nurGelaender, 12)).map(
      (m) => m.bezeichnung
    );
    expect(namen.some((n) => n.includes('Wangen'))).toBe(false);
    expect(namen.some((n) => n.includes('Handlauf'))).toBe(true);
  });
});

describe('Treppen-Geometrie', () => {
  it('baut Stufen, Wangen und beidseitiges Geländer', () => {
    const inputs = inputsWith({
      modus: 'kombiniert',
      geschosshoeheMm: 2800,
      laufbreiteMm: 1000,
      gelaenderSeite: 'beide',
      gelaenderHoeheMm: 1000,
      fuellung: 'staketen',
    });
    const d = deriveTreppe(inputs, 12);
    const geo = buildTreppeGeometry(inputs, d, {});
    expect(geo.stufen.length).toBe(d.stufenAnzahl);
    expect(geo.wangen).toHaveLength(2);
    expect(geo.pfosten.length).toBe(d.pfostenProSeite * 2);
    // Handlauf + Untergurt je Seite
    expect(geo.rails.length).toBe(4);
    // Oberste Stufe liegt eine Steigung unter der Geschosshöhe.
    const top = Math.max(...geo.stufen.map((s) => s.center[1]));
    expect(top).toBeLessThan(geo.hoeheM);
    expect(geo.dimensions).toHaveLength(2);
  });

  it('Handlauf verläuft parallel zur Schrägen', () => {
    const inputs = inputsWith({
      modus: 'kombiniert',
      geschosshoeheMm: 2600,
      gelaenderSeite: 'links',
      gelaenderHoeheMm: 1000,
      fuellung: 'staketen',
    });
    const d = deriveTreppe(inputs, 12);
    const geo = buildTreppeGeometry(inputs, d, {});
    const handlauf = geo.rails[0];
    const dy = handlauf.end[1] - handlauf.start[1];
    expect(dy).toBeCloseTo(geo.hoeheM, 3);
  });
});

describe('Treppen-Regeln', () => {
  it('Geschosshöhe über Maximum ⇒ ROT mit Podest-Hinweis', () => {
    const inputs = inputsWith({ modus: 'treppe', geschosshoeheMm: 4200 });
    const result = validateTreppe(inputs, deriveTreppe(inputs, 12), []);
    expect(result.level).toBe('red');
    expect(result.errors.some((e) => /podest/i.test(e))).toBe(true);
  });

  it('Geländer unter BFU-Treppenlauf-Richtwert ⇒ ROT', () => {
    const inputs = inputsWith({
      modus: 'kombiniert',
      geschosshoeheMm: 2800,
      gelaenderSeite: 'links',
      gelaenderHoeheMm: BFU_TREPPENLAUF_MIN_MM - 50,
      fuellung: 'staketen',
    });
    const result = validateTreppe(inputs, deriveTreppe(inputs, 12), []);
    expect(result.level).toBe('red');
    expect(result.errors.some((e) => e.includes('900'))).toBe(true);
  });

  it('extreme manuelle Stufenzahl ⇒ Steigung ausserhalb ⇒ ROT', () => {
    const inputs = inputsWith({
      modus: 'treppe',
      geschosshoeheMm: 2800,
      stufenAnzahlManuell: 24, // Steigung ≈ 117 mm → unter Minimum
    });
    const result = validateTreppe(inputs, deriveTreppe(inputs, 12), []);
    expect(result.level).toBe('red');
    expect(result.errors.some((e) => e.includes('Steigung'))).toBe(true);
  });

  it('Querstab bei Kindern erzeugt Leiter-Warnung', () => {
    const inputs = inputsWith({
      modus: 'gelaender',
      kinderschutz: 'ja',
      geschosshoeheMm: 2800,
      gelaenderSeite: 'links',
      gelaenderHoeheMm: 1000,
      fuellung: 'querstab',
    });
    const result = validateTreppe(inputs, deriveTreppe(inputs, 16), []);
    expect(result.warnings.some((w) => w.includes('Leiter'))).toBe(true);
  });
});
