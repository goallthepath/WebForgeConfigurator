import { describe, expect, it } from 'vitest';
import {
  deriveGelaender,
  fuellstabAnzahl,
  pfostenAnzahl,
} from '../products/gelaender/derive';
import { buildRailingGeometry } from '../products/gelaender/geometry';
import {
  EMPTY_GELAENDER_INPUTS,
  type GelaenderInputs,
} from '../products/gelaender/types';
import {
  GELAENDER_RULES_V0,
  validateGelaender,
} from '../rules/gelaender-rules';

const PARAMS = { ...GELAENDER_RULES_V0 };

function inputsWith(patch: Partial<GelaenderInputs>): GelaenderInputs {
  return { ...EMPTY_GELAENDER_INPUTS, ...patch };
}

describe('Pfostenverteilung (TESTDATEN-Regelparameter)', () => {
  it('setzt mindestens zwei Pfosten', () => {
    expect(pfostenAnzahl(400, PARAMS.maxPfostenabstandMm)).toBe(2);
  });

  it('hält den maximalen Achsabstand ein', () => {
    const laenge = 3200;
    const n = pfostenAnzahl(laenge, PARAMS.maxPfostenabstandMm);
    expect(laenge / (n - 1)).toBeLessThanOrEqual(PARAMS.maxPfostenabstandMm);
  });

  it('teilt den Eckpfosten bei der L-Form', () => {
    const inputs = inputsWith({
      variante: 'l-innen',
      segmentLaengenMm: [3000, 2000],
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const summe = derived.pfostenProSegment.reduce((a, b) => a + b, 0);
    expect(derived.pfostenTotal).toBe(summe - 1);
  });
});

describe('Füllstabverteilung', () => {
  it('überschreitet den maximalen lichten Abstand nie', () => {
    for (const feld of [600, 1000, 1450]) {
      const n = fuellstabAnzahl(feld, 12, PARAMS.maxStabAbstandMm);
      const licht = (feld - n * 12) / (n + 1);
      expect(licht).toBeLessThanOrEqual(PARAMS.maxStabAbstandMm + 0.001);
    }
  });

  it('liefert 0 Stäbe für Felder unter dem Grenzabstand', () => {
    expect(fuellstabAnzahl(100, 12, 110)).toBe(0);
  });
});

describe('Geometriemodell', () => {
  const inputs = inputsWith({
    variante: 'l-innen',
    segmentLaengenMm: [3000, 2000],
    hoeheMm: 1000,
  });
  const derived = deriveGelaender(inputs, 12, PARAMS);
  const geo = buildRailingGeometry(inputs, derived, {});

  it('enthält Pfosten gemäss Ableitung (Eckpfosten nur einmal)', () => {
    expect(geo.posts.length).toBe(derived.pfostenTotal);
  });

  it('erzeugt je Segment einen Handlauf und eine Masslinie plus Höhenmass', () => {
    expect(geo.rails.length).toBe(2);
    expect(geo.dimensions.length).toBe(3); // 2 Längen + 1 Höhe
    expect(geo.dimensions[0].label).toBe('3000 mm');
    expect(geo.dimensions[2].label).toBe('1000 mm');
  });

  it('setzt die Höhe aus den Eingaben um', () => {
    expect(geo.bounds.heightM).toBeCloseTo(1.0);
    expect(geo.rails[0].start[1]).toBeCloseTo(1.0);
  });

  it('legt den zweiten Lauf rechtwinklig an (L-Form innen: +Z)', () => {
    const zWerte = geo.posts.map((p) => p.z);
    expect(Math.max(...zWerte)).toBeCloseTo(2.0);
  });
});

describe('Geländer-Regelprüfung', () => {
  it('bleibt GELB, solange der Regelkatalog nicht freigegeben ist', () => {
    const inputs = inputsWith({
      variante: 'i',
      segmentLaengenMm: [3000],
      hoeheMm: 1000,
    });
    const result = validateGelaender(inputs, []);
    expect(result.level).toBe('yellow');
    expect(result.warnings.some((w) => w.includes('nicht fachlich freigegeben'))).toBe(true);
  });

  it('meldet ROT bei Überlänge und verweist auf die individuelle Anfrage', () => {
    const inputs = inputsWith({
      variante: 'i',
      segmentLaengenMm: [9000],
      hoeheMm: 1000,
    });
    const result = validateGelaender(inputs, []);
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('individuelle Ausführung');
  });

  it('warnt bei ungefähren Massen (Aufmasspflicht)', () => {
    const inputs = inputsWith({
      variante: 'i',
      segmentLaengenMm: [2500],
      hoeheMm: 1000,
      masseUngefaehr: true,
    });
    const result = validateGelaender(inputs, []);
    expect(result.warnings.some((w) => w.includes('Aufmass'))).toBe(true);
  });

  it('warnt bei unbekanntem Untergrund', () => {
    const inputs = inputsWith({
      variante: 'i',
      segmentLaengenMm: [2500],
      hoeheMm: 1000,
      untergrund: 'unbekannt',
    });
    const result = validateGelaender(inputs, []);
    expect(result.warnings.some((w) => w.toLowerCase().includes('untergrund'))).toBe(true);
  });
});
