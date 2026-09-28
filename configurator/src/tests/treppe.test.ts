// ─────────────────────────────────────────────────────────────────────────
// Das sind die Prüfungen für das Treppen-Modul. Jeder Test ist wie eine
// kleine Rechenaufgabe mit Lösungsblatt: Wir geben eine Treppe hinein und
// schauen, ob genau das herauskommt, was herauskommen MUSS. Wenn jemand
// später aus Versehen etwas kaputt macht, schlagen diese Tests Alarm.
// ─────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { deriveTreppe, treppeMaterialAuszug } from '../products/treppe/derive';
import { buildTreppeGeometry } from '../products/treppe/geometry';
import {
  DEFAULT_TREPPE_INPUTS,
  EMPTY_TREPPE_INPUTS,
  type TreppeInputs,
} from '../products/treppe/types';
import { getProfile, profilBreiteMm } from '../products/profile-catalog';
import {
  BFU_TREPPENLAUF_MIN_MM,
  TREPPE_RULES_V0,
  validateTreppe,
} from '../rules/treppe-rules';

// «P» ist die kurze Abkürzung für alle Grenzwerte der Treppen-Regeln.
const P = TREPPE_RULES_V0;

// Hilfsfunktion: Nimm das leere Formular und fülle nur ein paar Felder aus.
// So müssen wir in jedem Test nicht alles von Hand hinschreiben.
function inputsWith(patch: Partial<TreppeInputs>): TreppeInputs {
  return { ...EMPTY_TREPPE_INPUTS, ...patch };
}

// 🤧 Schnupfspruch: Rote Test? Dänn schnupf und flick!
//    Grüene Test – es Stüefeli meh a Glück.

// Gruppe 1: Stimmt die Rechnung mit den Stufen? (Schrittmassregel:
// 2 × Stufenhöhe + Stufentiefe ≈ 63 cm, eine bequeme Schrittlänge.)
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

  // Wir probieren vier verschiedene Stockwerkshöhen aus – jedes Mal muss
  // der Schritt bequem bleiben (mit 1 cm Spielraum).
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

  // Die Länge am Boden ist Stufentiefe mal (Anzahl Steigungen minus 1),
  // und die Treppe darf weder flach wie eine Rampe noch steil wie eine
  // Leiter sein (zwischen 25° und 45°).
  it('Lauflänge = (n−1)·Auftritt', () => {
    const d = deriveTreppe(inputsWith({ modus: 'treppe', geschosshoeheMm: 2800 }), 12);
    expect(d.lauflaengeMm).toBe((d.steigungenAnzahl - 1) * d.auftrittMm);
    expect(d.neigungGrad).toBeGreaterThan(25);
    expect(d.neigungGrad).toBeLessThan(45);
  });
});

// 🤧 Schnupfspruch: Eini Stufe weniger als Steigige, gäll –
//    de letscht Tritt isch de Bode, so schnäll!

// Gruppe 2: Das Geländer – wie viele Seiten, wie viele Pfosten?
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

  // Nur Treppe = kein Geländer. Nur Geländer = die Treppe gibt es schon
  // (sie wird nicht mitgeliefert, also stehen keine Wangen auf der Liste).
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

// Gruppe 3: Steht im 3D-Bauplan alles am richtigen Ort?
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
    expect(geo.traeger).toHaveLength(2); // Wangen
    expect(geo.pfosten.length).toBe(d.pfostenProSeite * 2);
    // Handlauf + Auslauf oben + Untergurt je Seite
    expect(geo.rails.length).toBe(6);
    // Oberste Stufe liegt eine Steigung unter der Geschosshöhe.
    const top = Math.max(...geo.stufen.map((s) => s.center[1]));
    expect(top).toBeLessThan(geo.hoeheM);
    expect(geo.dimensions).toHaveLength(2);
  });

  // Die Pfosten müssen auf den Stufenkanten stehen – wie Kerzen auf dem
  // Rand einer Geburtstagstorte, nicht irgendwo in der Luft.
  it('Geländer steht auf der Nasenlinie (nicht auf der Rohlinie)', () => {
    const inputs = inputsWith({
      modus: 'kombiniert',
      geschosshoeheMm: 2800,
      gelaenderSeite: 'links',
      gelaenderHoeheMm: 1000,
      fuellung: 'staketen',
    });
    const d = deriveTreppe(inputs, 12);
    const geo = buildTreppeGeometry(inputs, d, {});
    const s = d.steigungMm / 1000;
    // Erster Pfosten am Antritt: Fusspunkt auf der ersten Stufennase (~1 Steigung).
    expect(geo.pfosten[0].base[1]).toBeCloseTo(s, 2);
    // Letzter Pfosten oben auf Geschosshöhe.
    const letzter = geo.pfosten[d.pfostenProSeite - 1];
    expect(letzter.base[1]).toBeCloseTo(geo.hoeheM, 2);
    // Handlauf-Auslauf oben ist horizontal.
    const auslauf = geo.rails[1];
    expect(auslauf.start[1]).toBeCloseTo(auslauf.end[1], 5);
    expect(auslauf.end[0]).toBeGreaterThan(geo.lauflaengeM);
    // Abschlusskappen an beiden freien Enden.
    expect(geo.endCaps.length).toBe(0); // ohne gewählten Abschluss
    const mitCap = buildTreppeGeometry(
      { ...inputs, handlaufAbschluss: 'kugel-drittel' },
      d,
      {}
    );
    expect(mitCap.endCaps).toHaveLength(2);
  });

  // 🤧 Schnupfspruch: En Bug im Code, en Stei im Schueh –
  //    beides git de Stäge kei Rueh.
  it('Mittelholm ersetzt die Wangen; geschlossene Setzstufen füllen die Steigungen', () => {
    const inputs = inputsWith({
      modus: 'treppe',
      konstruktion: 'mittelholm',
      setzstufen: 'geschlossen',
      geschosshoeheMm: 2800,
      laufbreiteMm: 1000,
    });
    const d = deriveTreppe(inputs, 12);
    const geo = buildTreppeGeometry(inputs, d, {});
    expect(geo.traeger).toHaveLength(1);
    expect(geo.traeger[0].center[2]).toBe(0); // zentral
    expect(geo.setzstufen.length).toBe(d.stufenAnzahl);
    const namen = treppeMaterialAuszug(inputs, d).map((m) => m.bezeichnung);
    expect(namen).toContain('Mittelholm');
    expect(namen.some((n) => n.includes('Setzstufen'))).toBe(true);
  });

  // Der Handlauf muss genau gleich schräg sein wie die Stufenkanten –
  // sonst müsste man sich beim Hinaufgehen bücken oder strecken.
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
    // Nasenlinie: von (0, s) nach (L, H) → Δy = H − s.
    expect(dy).toBeCloseTo(geo.hoeheM - geo.steigungM, 3);
  });
});

// Gruppe 4: Pfeift der Schiedsrichter an den richtigen Stellen?
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

  // Viel zu viele Stufen = jede Stufe nur ein Mäuse-Schrittchen hoch → rot.
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

  // Liegende Stäbe sind wie Leitersprossen – Kinder würden hochklettern.
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
// 🤧 Schnupfspruch: Null Stufe ohni Höchi, das isch klar –
//    und ohni Schnupf kei Stammtisch, das isch wahr.

// Gruppe 5: Die Beispiel-Treppe beim Start muss sofort funktionieren –
// alle Teile im Katalog vorhanden, 3D-Bild da, keine rote Ampel.
describe('Startwerte (DEFAULT_TREPPE_INPUTS)', () => {
  const inputs = DEFAULT_TREPPE_INPUTS;
  const ids = [
    inputs.wangenProfilId,
    inputs.pfostenProfilId,
    inputs.handlaufProfilId,
    inputs.fuellstabProfilId,
    inputs.querstabProfilId,
  ];

  it('verweist nur auf vorhandene Katalogprofile', () => {
    for (const id of ids) {
      expect(id && getProfile(id)).toBeTruthy();
    }
  });

  it('ergibt gültige Ableitung, nicht-leere Geometrie und keine rote Ampel', () => {
    const stab = profilBreiteMm(getProfile(inputs.fuellstabProfilId!)!);
    const d = deriveTreppe(inputs, stab);
    expect(d.steigungenAnzahl).toBeGreaterThan(0);
    expect(d.steigungMm).toBeGreaterThanOrEqual(P.minSteigungMm);
    expect(d.steigungMm).toBeLessThanOrEqual(P.maxSteigungMm);
    expect(d.schrittmassMm).toBeGreaterThanOrEqual(P.minSchrittmassMm);
    expect(d.schrittmassMm).toBeLessThanOrEqual(P.maxSchrittmassMm);
    expect(d.gelaenderSeiten).toBe(1);

    const geo = buildTreppeGeometry(inputs, d, {
      wange: getProfile(inputs.wangenProfilId!),
      pfosten: getProfile(inputs.pfostenProfilId!),
      handlauf: getProfile(inputs.handlaufProfilId!),
      fuellstab: getProfile(inputs.fuellstabProfilId!),
    });
    expect(geo.hoeheM).toBeGreaterThan(0);
    expect(geo.stufen.length).toBe(d.stufenAnzahl);
    expect(geo.traeger).toHaveLength(2);
    expect(geo.pfosten.length).toBeGreaterThan(0);
    expect(geo.staebe.length).toBeGreaterThan(0);
    expect(geo.endCaps).toHaveLength(2);

    const profiles = ids
      .slice(0, 4)
      .map((id) => getProfile(id!)!);
    const result = validateTreppe(inputs, d, profiles);
    expect(result.errors).toEqual([]);
    expect(result.level).not.toBe('red');
  });
});
