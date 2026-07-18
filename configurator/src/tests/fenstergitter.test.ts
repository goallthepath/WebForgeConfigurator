import { describe, expect, it } from 'vitest';
import {
  deriveFenstergitter,
  gitterMaterialAuszug,
} from '../products/fenstergitter/derive';
import { buildGitterGeometry } from '../products/fenstergitter/geometry';
import {
  EMPTY_FENSTERGITTER_INPUTS,
  type FenstergitterInputs,
} from '../products/fenstergitter/types';
import {
  FENSTERGITTER_RULES_V0,
  validateFenstergitter,
} from '../rules/fenstergitter-rules';

const P = FENSTERGITTER_RULES_V0;

function inputsWith(patch: Partial<FenstergitterInputs>): FenstergitterInputs {
  return { ...EMPTY_FENSTERGITTER_INPUTS, ...patch };
}

describe('Fenstergitter-Ableitung', () => {
  it('Leibung + Lichtmass: Rahmen = Licht − 2×Spiel', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', masstyp: 'lichtmass', breiteMm: 1000, hoeheMm: 800 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(1000 - 2 * P.leibungSpielMm);
    expect(d.rahmenHoeheMm).toBe(800 - 2 * P.leibungSpielMm);
  });

  it('Vorwand + Lichtmass: Rahmen = Licht + 2×Überstand', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'vorwand', masstyp: 'lichtmass', breiteMm: 1000, hoeheMm: 800 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(1000 + 2 * P.vorwandUeberstandMm);
  });

  it('Aussenmass wird direkt übernommen', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', masstyp: 'aussenmass', breiteMm: 900, hoeheMm: 700 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(900);
  });

  it('Stabteilung hält den lichten Maximalabstand ein', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', breiteMm: 1200, hoeheMm: 900 }),
      12
    );
    const licht = (d.rahmenBreiteMm - d.stabAnzahl * 12) / (d.stabAnzahl + 1);
    expect(licht).toBeLessThanOrEqual(P.maxStabLichtMm + 0.001);
  });

  it('Hohe Gitter erhalten drei Laschen je Seite', () => {
    const klein = deriveFenstergitter(
      inputsWith({ montage: 'leibung', breiteMm: 800, hoeheMm: 900 }),
      12
    );
    const gross = deriveFenstergitter(
      inputsWith({ montage: 'leibung', breiteMm: 800, hoeheMm: 1600 }),
      12
    );
    expect(klein.laschenProSeite).toBe(2);
    expect(gross.laschenProSeite).toBe(3);
    expect(gross.laschenTotal).toBe(6);
  });
});

describe('Fenstergitter-Regeln', () => {
  it('Fluchtweg ⇒ ROT mit Verweis auf individuelle Lösung', () => {
    const result = validateFenstergitter(
      inputsWith({ fluchtweg: 'ja', breiteMm: 800, hoeheMm: 800 }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('Fluchtweg');
  });

  it('bleibt sonst maximal GELB (TESTDATEN-Regelkatalog)', () => {
    const result = validateFenstergitter(
      inputsWith({ fluchtweg: 'nein', montage: 'leibung', breiteMm: 800, hoeheMm: 800 }),
      []
    );
    expect(result.level).toBe('yellow');
  });
});

describe('Fenstergitter-Geometrie', () => {
  const inputs = inputsWith({
    montage: 'leibung',
    breiteMm: 1000,
    hoeheMm: 900,
    stabanordnung: 'vertikal-quergurt',
    quergurtAnzahl: 2,
    ornamentTyp: 'ringe',
  });
  const derived = deriveFenstergitter(inputs, 12);
  const geo = buildGitterGeometry(inputs, derived, {});

  it('erzeugt Stäbe, Quergurte, Laschen und Masslinien', () => {
    expect(geo.stäbe.length).toBe(derived.stabAnzahl);
    expect(geo.gurte.length).toBe(2);
    expect(geo.laschen.length).toBe(derived.laschenTotal);
    expect(geo.dimensions).toHaveLength(2);
    expect(geo.ornaments.length).toBeGreaterThan(0);
  });

  it('Leibung liegt in der Öffnung, Vorwand vor der Wand', () => {
    expect(geo.gitterZ).toBeLessThan(0);
    const vorwand = buildGitterGeometry(
      { ...inputs, montage: 'vorwand' },
      deriveFenstergitter({ ...inputs, montage: 'vorwand' }, 12),
      {}
    );
    expect(vorwand.gitterZ).toBeGreaterThan(0);
    expect(vorwand.frameW).toBeGreaterThan(geo.frameW);
  });

  it('Materialauszug enthält Rahmen, Stäbe und Laschen', () => {
    const namen = gitterMaterialAuszug(inputs, derived).map((m) => m.bezeichnung);
    expect(namen).toContain('Rahmen horizontal');
    expect(namen).toContain('Gitterstäbe');
    expect(namen.some((n) => n.includes('Befestigungslaschen'))).toBe(true);
  });
});
