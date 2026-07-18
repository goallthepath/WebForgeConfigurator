import { describe, expect, it } from 'vitest';
import {
  deriveGelaender,
  fuellstabAnzahl,
  materialAuszug,
  pfostenAnzahl,
  querstabLagen,
} from '../products/gelaender/derive';
import {
  buildRailingGeometry,
  runsFromInputs,
} from '../products/gelaender/geometry';
import {
  EMPTY_GELAENDER_INPUTS,
  SEGMENTE_PRO_VARIANTE,
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

  it('teilt Eckpfosten bei L- und U-Form', () => {
    const l = inputsWith({
      variante: 'l-innen',
      fuellungsart: 'staketen',
      segmentLaengenMm: [3000, 2000],
    });
    const dl = deriveGelaender(l, 12, PARAMS);
    expect(dl.pfostenTotal).toBe(
      dl.pfostenProSegment.reduce((a, b) => a + b, 0) - 1
    );

    const u = inputsWith({
      variante: 'u-innen',
      fuellungsart: 'staketen',
      segmentLaengenMm: [2000, 3000, 2000],
    });
    const du = deriveGelaender(u, 12, PARAMS);
    expect(du.pfostenTotal).toBe(
      du.pfostenProSegment.reduce((a, b) => a + b, 0) - 2
    );
  });

  it('verlangt bei Glas engere Pfostenabstände', () => {
    const glas = inputsWith({
      variante: 'i',
      fuellungsart: 'glas',
      glasTyp: 'klar',
      segmentLaengenMm: [3000],
      hoeheMm: 1000,
    });
    const staketen = inputsWith({
      variante: 'i',
      fuellungsart: 'staketen',
      segmentLaengenMm: [3000],
      hoeheMm: 1000,
    });
    expect(
      deriveGelaender(glas, 12, PARAMS).pfostenTotal
    ).toBeGreaterThan(deriveGelaender(staketen, 12, PARAMS).pfostenTotal);
  });
});

describe('Füllungsverteilung', () => {
  it('überschreitet den maximalen lichten Stababstand nie', () => {
    for (const feld of [600, 1000, 1450]) {
      const n = fuellstabAnzahl(feld, 12, PARAMS.maxStabAbstandMm);
      const licht = (feld - n * 12) / (n + 1);
      expect(licht).toBeLessThanOrEqual(PARAMS.maxStabAbstandMm + 0.001);
    }
  });

  it('berechnet Querstab-Lagen aus freier Höhe und lichtem Abstand', () => {
    const lagen = querstabLagen(900, 16, PARAMS.maxQuerstabAbstandMm);
    const licht = (900 - lagen * 16) / (lagen + 1);
    expect(licht).toBeLessThanOrEqual(PARAMS.maxQuerstabAbstandMm + 0.001);
    expect(lagen).toBeGreaterThan(0);
  });

  it('zählt Glasfelder = Felder zwischen den Pfosten', () => {
    const inputs = inputsWith({
      variante: 'i',
      fuellungsart: 'glas',
      glasTyp: 'satiniert',
      segmentLaengenMm: [2900],
      hoeheMm: 1000,
    });
    const d = deriveGelaender(inputs, 12, PARAMS);
    expect(d.glasfelderTotal).toBe(d.pfostenProSegment[0] - 1);
    expect(d.fuellstaebeTotal).toBe(0);
  });
});

describe('Pfad und Geometriemodell', () => {
  it('legt U-Form-Läufe rechtwinklig als U an', () => {
    const runs = runsFromInputs(
      inputsWith({
        variante: 'u-innen',
        segmentLaengenMm: [2000, 3000, 2000],
      })
    );
    expect(runs).toHaveLength(3);
    expect(runs[0].dir).toEqual([1, 0]);
    expect(runs[1].dir[0]).toBe(0); // rechtwinklig
    expect(runs[2].dir[0]).toBe(-1); // zurücklaufender Schenkel
  });

  it('U-Form: Pfosten im Geometriemodell = abgeleitete Gesamtzahl', () => {
    const inputs = inputsWith({
      variante: 'u-aussen',
      fuellungsart: 'staketen',
      segmentLaengenMm: [1500, 2500, 1500],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const geo = buildRailingGeometry(inputs, derived, {});
    expect(geo.posts.length).toBe(derived.pfostenTotal);
    // je Segment ein Handlauf + ein Untergurt (Standard bei Staketen)
    expect(geo.rails.length).toBe(6);
    expect(geo.dimensions).toHaveLength(4); // 3 Längen + Höhe
  });

  it('Querstab-Füllung erzeugt Lagen als zusätzliche Läufe', () => {
    const inputs = inputsWith({
      variante: 'i',
      fuellungsart: 'querstab',
      segmentLaengenMm: [3000],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 16, PARAMS);
    const geo = buildRailingGeometry(inputs, derived, {});
    expect(derived.querstabLagen).toBeGreaterThan(0);
    expect(geo.rails.length).toBe(1 + derived.querstabLagen);
    expect(geo.bars).toHaveLength(0);
  });

  it('Glasfüllung erzeugt Panels; «ohne Handlauf» entfernt den Handlauf', () => {
    const inputs = inputsWith({
      variante: 'i',
      fuellungsart: 'glas',
      glasTyp: 'satiniert',
      ohneHandlauf: true,
      segmentLaengenMm: [2400],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const geo = buildRailingGeometry(inputs, derived, {});
    expect(geo.panels.length).toBe(derived.glasfelderTotal);
    expect(geo.panels[0].fill).toBe('glas-satiniert');
    expect(geo.rails).toHaveLength(0); // kein Handlauf, kein Untergurt bei Glas
    expect(derived.handlaufLaengenMm).toHaveLength(0);
  });

  it('Blech- und Gitterfüllungen erzeugen Panels mit Musterkennung', () => {
    const blech = inputsWith({
      variante: 'i',
      fuellungsart: 'blech',
      blechTyp: 'loch',
      segmentLaengenMm: [2400],
      hoeheMm: 1000,
    });
    const dBlech = deriveGelaender(blech, 12, PARAMS);
    const gBlech = buildRailingGeometry(blech, dBlech, {});
    expect(dBlech.glasfelderTotal).toBeGreaterThan(0);
    expect(gBlech.panels[0].fill).toBe('blech-loch');

    const gitter = inputsWith({
      variante: 'i',
      fuellungsart: 'gitter',
      gitterTyp: 'streckmetall',
      segmentLaengenMm: [2400],
      hoeheMm: 1000,
    });
    const dGitter = deriveGelaender(gitter, 12, PARAMS);
    expect(
      buildRailingGeometry(gitter, dGitter, {}).panels[0].fill
    ).toBe('gitter-streckmetall');
  });

  it('Untergurt erzeugt einen zusätzlichen Gurt und hebt die Füllung an', () => {
    const mit = inputsWith({
      variante: 'i',
      fuellungsart: 'staketen',
      mitUntergurt: true,
      segmentLaengenMm: [2000],
      hoeheMm: 1000,
    });
    const ohne = { ...mit, mitUntergurt: false };
    const dMit = deriveGelaender(mit, 12, PARAMS);
    const dOhne = deriveGelaender(ohne, 12, PARAMS);
    expect(dMit.untergurtLaengenMm).toEqual([2000]);
    expect(dOhne.untergurtLaengenMm).toEqual([]);
    const gMit = buildRailingGeometry(mit, dMit, {});
    const gOhne = buildRailingGeometry(ohne, dOhne, {});
    expect(gMit.rails.length).toBe(gOhne.rails.length + 1);
    expect(gMit.bars[0].yM).toBeGreaterThan(gOhne.bars[0].yM);
  });

  it('stellt die Befestigungsart konstruktiv dar (Platten, Schwerter, Baukörper)', () => {
    const basis = inputsWith({
      variante: 'i',
      fuellungsart: 'staketen',
      segmentLaengenMm: [2000],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(basis, 12, PARAMS);

    const boden = buildRailingGeometry({ ...basis, montageart: 'boden' }, derived, {});
    expect(boden.plates.length).toBe(boden.posts.length); // Fussplatten
    expect(boden.slabs.length).toBe(1);
    expect(boden.posts[0].yBaseM).toBe(0);

    const seite = buildRailingGeometry({ ...basis, montageart: 'seite' }, derived, {});
    expect(seite.posts[0].yBaseM).toBeLessThan(0); // Pfosten läuft unter OK Boden
    expect(seite.plates.length).toBe(seite.posts.length); // Schwerter

    const wand = buildRailingGeometry({ ...basis, montageart: 'wand' }, derived, {});
    expect(wand.slabs.length).toBe(0);
  });

  it('setzt Endkappen nur an den freien Enden', () => {
    const inputs = inputsWith({
      variante: 'u-innen',
      fuellungsart: 'staketen',
      handlaufAbschluss: 'kugel',
      segmentLaengenMm: [1500, 2500, 1500],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const geo = buildRailingGeometry(inputs, derived, {});
    expect(geo.endCaps).toHaveLength(2);
    expect(geo.endCaps.every((c) => c.kind === 'kugel')).toBe(true);
  });

  it('trägt Pfadkoordinaten für die 2D-Abwicklung', () => {
    const inputs = inputsWith({
      variante: 'u-innen',
      fuellungsart: 'staketen',
      segmentLaengenMm: [1000, 2000, 1000],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const geo = buildRailingGeometry(inputs, derived, {});
    const ts = geo.posts.map((p) => p.tM);
    expect(Math.max(...ts)).toBeCloseTo(4.0); // 1+2+1 m abgewickelt
    // streng monoton über die Segmente hinweg (keine Überlappung)
    const sorted = [...ts].sort((a, b) => a - b);
    expect(ts).toEqual(sorted);
  });
});

describe('Segmentanzahl je Variante', () => {
  it('deckt alle Varianten ab', () => {
    expect(SEGMENTE_PRO_VARIANTE).toEqual({
      i: 1,
      'l-innen': 2,
      'l-aussen': 2,
      'u-innen': 3,
      'u-aussen': 3,
    });
  });
});

describe('Geländer-Regelprüfung', () => {
  it('bleibt GELB, solange der Regelkatalog nicht freigegeben ist', () => {
    const result = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'staketen',
        segmentLaengenMm: [3000],
        hoeheMm: 1000,
      }),
      []
    );
    expect(result.level).toBe('yellow');
  });

  it('meldet ROT bei Überlänge mit Verweis auf individuelle Anfrage', () => {
    const result = validateGelaender(
      inputsWith({ variante: 'i', segmentLaengenMm: [9000], hoeheMm: 1000 }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('individuelle Ausführung');
  });

  it('warnt bei Querstab-Füllung vor Erkletterbarkeit (verschärft bei Kindern)', () => {
    const ohneKinder = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'querstab',
        kinderschutz: 'nein',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(ohneKinder.warnings.some((w) => w.includes('erkletterbar'))).toBe(true);

    const mitKindern = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'querstab',
        kinderschutz: 'ja',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(mitKindern.warnings.some((w) => w.includes('Leiter'))).toBe(true);
  });

  it('BFU: unter 1000 mm Höhe bei über 1 m Absturzhöhe → ROT', () => {
    const result = validateGelaender(
      inputsWith({
        variante: 'i',
        absturzhoehe: 'ueber-1m',
        segmentLaengenMm: [2500],
        hoeheMm: 900,
      }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors.some((e) => e.includes('BFU'))).toBe(true);
  });

  it('BFU-Kinderschutz-Hinweise je Füllungsart (12-cm-Kugel, 5-cm-Loch, 4-cm-Masche)', () => {
    const staketen = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'staketen',
        kinderschutz: 'ja',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(staketen.warnings.some((w) => w.includes('120-mm-Kugel'))).toBe(true);

    const loch = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'blech',
        blechTyp: 'loch',
        kinderschutz: 'unbekannt',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(loch.warnings.some((w) => w.includes('50 mm'))).toBe(true);

    const gitter = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'gitter',
        gitterTyp: 'drahtgitter',
        kinderschutz: 'ja',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(gitter.warnings.some((w) => w.includes('40 mm'))).toBe(true);
  });

  it('Einsatzort-Hinweise: Attika und französischer Balkon', () => {
    const attika = validateGelaender(
      inputsWith({
        variante: 'i',
        einsatzort: 'attika',
        segmentLaengenMm: [2500],
        hoeheMm: 1100,
      }),
      []
    );
    expect(attika.warnings.some((w) => w.includes('Attika'))).toBe(true);

    const franz = validateGelaender(
      inputsWith({
        variante: 'i',
        einsatzort: 'franz-balkon',
        montageart: 'boden',
        segmentLaengenMm: [1400],
        hoeheMm: 1100,
      }),
      []
    );
    expect(franz.warnings.some((w) => w.includes('Wand-'))).toBe(true);
  });

  it('warnt bei Glas ohne Handlauf doppelt (Glasaufbau + Zulässigkeit)', () => {
    const result = validateGelaender(
      inputsWith({
        variante: 'i',
        fuellungsart: 'glas',
        glasTyp: 'klar',
        ohneHandlauf: true,
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
      }),
      []
    );
    expect(result.warnings.some((w) => w.includes('Glasaufbau'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('ohne Handlauf'))).toBe(true);
  });

  it('warnt bei ungefähren Massen und unbekanntem Untergrund', () => {
    const result = validateGelaender(
      inputsWith({
        variante: 'i',
        segmentLaengenMm: [2500],
        hoeheMm: 1000,
        masseUngefaehr: true,
        untergrund: 'unbekannt',
      }),
      []
    );
    expect(result.warnings.some((w) => w.includes('Aufmass'))).toBe(true);
    expect(
      result.warnings.some((w) => w.toLowerCase().includes('untergrund'))
    ).toBe(true);
  });
});

describe('Materialauszug (provisorisch)', () => {
  it('listet Pfosten, Handläufe und Füllung mit Stückzahlen', () => {
    const inputs = inputsWith({
      variante: 'l-innen',
      fuellungsart: 'staketen',
      segmentLaengenMm: [3000, 2000],
      hoeheMm: 1000,
    });
    const derived = deriveGelaender(inputs, 12, PARAMS);
    const material = materialAuszug(inputs, derived);
    const namen = material.map((m) => m.bezeichnung);
    expect(namen).toContain('Pfosten');
    expect(namen).toContain('Handlauf Segment 1');
    expect(namen).toContain('Füllstäbe');
    expect(material.find((m) => m.bezeichnung === 'Pfosten')?.anzahl).toBe(
      derived.pfostenTotal
    );
  });
});
