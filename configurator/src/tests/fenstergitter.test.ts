// Die Tests fürs Fenstergitter – kleine Prüfungsfragen, die der Computer
// selber beantwortet. So merken wir sofort, wenn beim Umbauen etwas kaputtgeht,
// wie ein Rauchmelder, der piepst, bevor es brennt.
import { describe, expect, it } from 'vitest';
import {
  deriveFenstergitter,
  gitterMaterialAuszug,
} from '../products/fenstergitter/derive';
import { buildGitterGeometry } from '../products/fenstergitter/geometry';
import {
  DEFAULT_FENSTERGITTER_INPUTS,
  EMPTY_FENSTERGITTER_INPUTS,
  type FenstergitterInputs,
} from '../products/fenstergitter/types';
import {
  FINISHES,
  getProfile,
  MATERIALS,
  profilBreiteMm,
} from '../products/profile-catalog';
import { FARBEN, MONTAGE_SERVICES } from '../products/gelaender/options';
import type { Profile } from '../products/types';
import {
  FENSTERGITTER_RULES_V0,
  validateFenstergitter,
} from '../rules/fenstergitter-rules';

// P = die Regeln in Kurzform.
const P = FENSTERGITTER_RULES_V0;

// inputsWith: leeres Formular, nur die nötigen Felder ausgefüllt.
function inputsWith(patch: Partial<FenstergitterInputs>): FenstergitterInputs {
  return { ...EMPTY_FENSTERGITTER_INPUTS, ...patch };
}

// Erste Gruppe: Stimmen die ausgerechneten Grössen?
describe('Fenstergitter-Ableitung', () => {
  // In der Nische: Gitter etwas kleiner als das Loch.
  it('Leibung + Lichtmass: Rahmen = Licht − 2×Spiel', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', masstyp: 'lichtmass', breiteMm: 1000, hoeheMm: 800 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(1000 - 2 * P.leibungSpielMm);
    expect(d.rahmenHoeheMm).toBe(800 - 2 * P.leibungSpielMm);
  });

  // Vor der Wand: Gitter etwas grösser als das Loch.
  it('Vorwand + Lichtmass: Rahmen = Licht + 2×Überstand', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'vorwand', masstyp: 'lichtmass', breiteMm: 1000, hoeheMm: 800 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(1000 + 2 * P.vorwandUeberstandMm);
  });

  // Hat man das Gitter selbst gemessen, bleibt die Zahl genau so.
  it('Aussenmass wird direkt übernommen', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', masstyp: 'aussenmass', breiteMm: 900, hoeheMm: 700 }),
      12
    );
    expect(d.rahmenBreiteMm).toBe(900);
  });

  // Die Lücken zwischen den Stäben dürfen nicht zu gross sein.
  it('Stabteilung hält den lichten Maximalabstand ein', () => {
    const d = deriveFenstergitter(
      inputsWith({ montage: 'leibung', breiteMm: 1200, hoeheMm: 900 }),
      12
    );
    // Lücke = (Breite − alle Stäbe) ÷ (Stäbe + 1).
    const licht = (d.rahmenBreiteMm - d.stabAnzahl * 12) / (d.stabAnzahl + 1);
    expect(licht).toBeLessThanOrEqual(P.maxStabLichtMm + 0.001);
  });

  // Kleines Gitter: 2 Laschen pro Seite. Hohes Gitter: 3 pro Seite, also 6 total.
  // 🤧 Schnupfspruch: Zwöi Ohre für s Chliine, drü Ohre für s Grosse –
  //    so hebt jedes Gitter, au wänn d Stürm tüend tose.
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

// Zweite Gruppe: der Prüfer.
describe('Fenstergitter-Regeln', () => {
  // Fluchtweg-Fenster: rot! Hier darf kein festes Gitter hin.
  it('Fluchtweg ⇒ ROT mit Verweis auf individuelle Lösung', () => {
    const result = validateFenstergitter(
      inputsWith({ fluchtweg: 'ja', breiteMm: 800, hoeheMm: 800 }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('Fluchtweg');
  });

  // Alles andere: höchstens gelb, weil die Regeln noch Testwerte sind.
  // 🤧 Schnupfspruch: Gäl isch nöd schlimm, gäl isch nume lueg –
  //    de Meister prüeft s no, und dänn isch es gnueg.
  it('bleibt sonst maximal GELB (TESTDATEN-Regelkatalog)', () => {
    const result = validateFenstergitter(
      inputsWith({ fluchtweg: 'nein', montage: 'leibung', breiteMm: 800, hoeheMm: 800 }),
      []
    );
    expect(result.level).toBe('yellow');
  });
});

// Dritte Gruppe: der 3D-Bauplan. Ein Beispiel-Gitter mit zwei Quergurten und Ringen.
describe('Fenstergitter-Geometrie', () => {
  const inputs = inputsWith({
    montage: 'leibung',
    breiteMm: 1000,
    hoeheMm: 900,
    stabanordnung: 'vertikal-quergurt',
    quergurtAnzahl: 2,
    ornamentTyp: 'ringe',
  });
  // Einmal ausrechnen und bauen – die Tests unten schauen sich das Ergebnis an.
  const derived = deriveFenstergitter(inputs, 12);
  const geo = buildGitterGeometry(inputs, derived, {});

  // Sind alle Teile da?
  it('erzeugt Stäbe, Quergurte, Laschen und Masslinien', () => {
    expect(geo.stäbe.length).toBe(derived.stabAnzahl);
    expect(geo.gurte.length).toBe(2);
    expect(geo.laschen.length).toBe(derived.laschenTotal);
    expect(geo.dimensions).toHaveLength(2);
    expect(geo.ornaments.length).toBeGreaterThan(0);
  });

  // In der Nische liegt das Gitter hinter der Wandkante (z < 0), vor der Wand davor (z > 0).
  // 🤧 Schnupfspruch: Isch s Gitter dinne oder dusse vor de Muur?
  //    De Test weiss es gnau – uf de Millimeter, das isch sicher und stuur.
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

  // Steht alles Wichtige auf dem Einkaufszettel?
  it('Materialauszug enthält Rahmen, Stäbe und Laschen', () => {
    const namen = gitterMaterialAuszug(inputs, derived).map((m) => m.bezeichnung);
    expect(namen).toContain('Rahmen horizontal');
    expect(namen).toContain('Gitterstäbe');
    expect(namen.some((n) => n.includes('Befestigungslaschen'))).toBe(true);
  });
});
// Vierte Gruppe: das Beispiel-Gitter, das man als Erstes sieht.

describe('Fenstergitter-Standardkonfiguration', () => {
  const d = DEFAULT_FENSTERGITTER_INPUTS;
  const rahmen = getProfile(d.rahmenProfilId!);
  const stab = getProfile(d.stabProfilId!);

  // Gibt es alle Beispiel-Teile wirklich im Katalog?
  it('verwendet existierende Katalog- und Options-Ids', () => {
    expect(MATERIALS.some((m) => m.materialId === d.materialId && m.active)).toBe(true);
    expect(rahmen?.active).toBe(true);
    expect(stab?.active).toBe(true);
    expect(rahmen?.material).toBe(d.materialId);
    expect(stab?.material).toBe(d.materialId);
    expect(
      rahmen?.allowedUses.some((u) => u.product === 'fenstergitter' && u.role === 'gitterrahmen')
    ).toBe(true);
    expect(
      stab?.allowedUses.some((u) => u.product === 'fenstergitter' && u.role === 'gitterstab')
    ).toBe(true);
    const finish = FINISHES.find((f) => f.finishId === d.finishId);
    expect(finish?.allowedMaterials).toContain(d.materialId);
    expect(FARBEN.some((f) => f.id === d.farbe && f.hex)).toBe(true);
    expect(MONTAGE_SERVICES.some((m) => m.id === d.montageService)).toBe(true);
  });

  // Das Beispiel muss sich ausrechnen, bauen und prüfen lassen – ohne Rot.
  // 🤧 Schnupfspruch: S Bischpil-Gitter hebt, de Test isch bestande –
  //    jetzt gaht s zum Schmied i d Werkstatt, mit Funke und Flamme.
  it('ergibt gültige Ableitung, nicht-leere Geometrie und keine ROT-Ampel', () => {
    const derived = deriveFenstergitter(d, profilBreiteMm(stab!));
    expect(derived.rahmenBreiteMm).toBeGreaterThan(0);
    expect(derived.rahmenHoeheMm).toBeGreaterThan(0);
    expect(derived.stabAnzahl).toBeGreaterThan(0);
    const geo = buildGitterGeometry(d, derived, { rahmen, stab });
    expect(geo.frameW).toBeGreaterThan(0);
    expect(geo.frameH).toBeGreaterThan(0);
    expect(geo.stäbe.length).toBe(derived.stabAnzahl);
    expect(geo.laschen.length).toBe(derived.laschenTotal);
    expect(gitterMaterialAuszug(d, derived).length).toBeGreaterThan(0);
    const result = validateFenstergitter(d, [rahmen, stab] as Profile[]);
    expect(result.level).not.toBe('red');
    expect(result.errors).toHaveLength(0);
  });
});
