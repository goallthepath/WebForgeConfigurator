import { describe, expect, it } from 'vitest';
import {
  deriveGartentor,
  torMaterialAuszug,
} from '../products/gartentor/derive';
import { buildTorGeometry } from '../products/gartentor/geometry';
import {
  EMPTY_GARTENTOR_INPUTS,
  type GartentorInputs,
} from '../products/gartentor/types';
import {
  GARTENTOR_RULES_V0,
  validateGartentor,
} from '../rules/gartentor-rules';

const P = GARTENTOR_RULES_V0;

function inputsWith(patch: Partial<GartentorInputs>): GartentorInputs {
  return { ...EMPTY_GARTENTOR_INPUTS, ...patch };
}

describe('Gartentor-Ableitung', () => {
  it('einflügelig: Flügel = Öffnung − 2×Spalt', () => {
    const d = deriveGartentor(
      inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1000, hoeheMm: 1200 }),
      12
    );
    expect(d.fluegelBreitenMm).toEqual([1000 - 2 * P.spaltMm]);
  });

  it('zweiflügelig: symmetrische Teilung mit drei Spalten', () => {
    const d = deriveGartentor(
      inputsWith({ fluegelart: 'zwei', oeffnungBreiteMm: 2400, hoeheMm: 1200 }),
      12
    );
    expect(d.fluegelBreitenMm).toHaveLength(2);
    expect(d.fluegelBreitenMm[0]).toBe(d.fluegelBreitenMm[1]);
    expect(d.fluegelBreitenMm[0]).toBe(Math.round((2400 - 3 * P.spaltMm) / 2));
  });

  it('hohe Tore erhalten drei Bänder je Flügel', () => {
    expect(
      deriveGartentor(
        inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1000, hoeheMm: 1000 }),
        12
      ).baenderProFluegel
    ).toBe(2);
    expect(
      deriveGartentor(
        inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1000, hoeheMm: 1500 }),
        12
      ).baenderProFluegel
    ).toBe(3);
  });

  it('Staketen-Füllung: Teilung hält den lichten Maximalabstand ein', () => {
    const d = deriveGartentor(
      inputsWith({
        fluegelart: 'ein',
        fuellung: 'staketen',
        oeffnungBreiteMm: 1200,
        hoeheMm: 1200,
      }),
      12
    );
    const b = d.fluegelBreitenMm[0];
    const licht = (b - d.staebeProFluegel * 12) / (d.staebeProFluegel + 1);
    expect(licht).toBeLessThanOrEqual(P.maxStabLichtMm + 0.001);
  });

  it('neue Torpfosten nur bei freistehender Ausführung', () => {
    expect(
      deriveGartentor(
        inputsWith({ fluegelart: 'ein', seitenbau: 'pfosten', oeffnungBreiteMm: 1000, hoeheMm: 1200 }),
        12
      ).pfostenAnzahl
    ).toBe(2);
    expect(
      deriveGartentor(
        inputsWith({ fluegelart: 'ein', seitenbau: 'mauer', oeffnungBreiteMm: 1000, hoeheMm: 1200 }),
        12
      ).pfostenAnzahl
    ).toBe(0);
  });
});

describe('Gartentor-Regeln', () => {
  it('einflügelig über Maximalbreite ⇒ ROT mit Hinweis auf zweiflügelig', () => {
    const result = validateGartentor(
      inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1600, hoeheMm: 1200 }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('zweiflügelig');
  });

  it('Antriebs-Vorbereitung erzeugt Prüf-Hinweis', () => {
    const result = validateGartentor(
      inputsWith({
        fluegelart: 'zwei',
        oeffnungBreiteMm: 2400,
        hoeheMm: 1200,
        antriebVorbereitung: true,
      }),
      []
    );
    expect(result.level).toBe('yellow');
    expect(result.warnings.some((w) => w.includes('Motorisierung'))).toBe(true);
  });
});

describe('Gartentor-Geometrie', () => {
  it('zweiflügelig: zwei Flügel mit gegenläufigen Bandseiten, Schloss am Gehflügel', () => {
    const inputs = inputsWith({
      fluegelart: 'zwei',
      seitenbau: 'pfosten',
      fuellung: 'staketen',
      oeffnungBreiteMm: 2400,
      hoeheMm: 1200,
    });
    const derived = deriveGartentor(inputs, 12);
    const geo = buildTorGeometry(inputs, derived, {});
    expect(geo.fluegel).toHaveLength(2);
    expect(geo.fluegel[0].richtung).toBe(1);
    expect(geo.fluegel[1].richtung).toBe(-1);
    expect(geo.fluegel.filter((f) => f.mitSchloss)).toHaveLength(1);
    expect(geo.seiten.every((s) => s.kind === 'pfosten')).toBe(true);
    expect(geo.fluegel[0].bandYs).toHaveLength(derived.baenderProFluegel);
  });

  it('einflügelig: Anschlagseite steuert die Bandachse', () => {
    const basis = inputsWith({
      fluegelart: 'ein',
      seitenbau: 'mauer',
      fuellung: 'staketen',
      oeffnungBreiteMm: 1000,
      hoeheMm: 1200,
    });
    const derived = deriveGartentor(basis, 12);
    const links = buildTorGeometry({ ...basis, anschlag: 'links' }, derived, {});
    const rechts = buildTorGeometry({ ...basis, anschlag: 'rechts' }, derived, {});
    expect(links.fluegel[0].hingeX).toBeLessThan(0);
    expect(rechts.fluegel[0].hingeX).toBeGreaterThan(0);
    expect(links.seiten.every((s) => s.kind === 'mauer')).toBe(true);
  });

  it('Materialauszug enthält Rahmen, Bänder und Pfosten', () => {
    const inputs = inputsWith({
      fluegelart: 'zwei',
      seitenbau: 'pfosten',
      fuellung: 'staketen',
      schloss: 'schloss-druecker',
      oeffnungBreiteMm: 2400,
      hoeheMm: 1200,
    });
    const derived = deriveGartentor(inputs, 12);
    const namen = torMaterialAuszug(inputs, derived).map((m) => m.bezeichnung);
    expect(namen).toContain('Flügel 1 Rahmen horizontal');
    expect(namen).toContain('Bänder');
    expect(namen.some((n) => n.includes('Torpfosten'))).toBe(true);
    expect(namen.some((n) => n.includes('Einsteckschloss'))).toBe(true);
  });
});
