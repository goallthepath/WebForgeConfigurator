// Das sind die Tests fürs Gartentor. Ein Test ist wie eine kleine Prüfungsfrage:
// «Wenn ich ein 1000 mm breites Tor bestelle, kommt dann das Richtige heraus?»
// Der Computer beantwortet alle Fragen automatisch. Sind alle grün, ist alles gut.
import { describe, expect, it } from 'vitest';
import {
  deriveGartentor,
  torMaterialAuszug,
} from '../products/gartentor/derive';
import { buildTorGeometry } from '../products/gartentor/geometry';
import {
  DEFAULT_GARTENTOR_INPUTS,
  EMPTY_GARTENTOR_INPUTS,
  type GartentorInputs,
} from '../products/gartentor/types';
import {
  FINISHES,
  getProfile,
  MATERIALS,
  PROFILES,
  profilBreiteMm,
} from '../products/profile-catalog';
import { profilesForUse } from '../rules/profiles';
import { FARBEN, MONTAGE_SERVICES } from '../products/gelaender/options';
import {
  GARTENTOR_RULES_V0,
  validateGartentor,
} from '../rules/gartentor-rules';

// P = die Regeln (Grenzwerte), kurz geschrieben, damit die Tests schön kurz bleiben.
const P = GARTENTOR_RULES_V0;

// inputsWith: Nimmt ein leeres Formular und füllt nur die Felder aus,
// die ein Test gerade braucht – wie ein Ausmalbild, bei dem man nur ein paar Felder anmalt.
function inputsWith(patch: Partial<GartentorInputs>): GartentorInputs {
  return { ...EMPTY_GARTENTOR_INPUTS, ...patch };
}

// Erste Gruppe: Stimmen die ausgerechneten Werte?
describe('Gartentor-Ableitung', () => {
  // Ein Flügel: Öffnung minus zwei Spalten (links und rechts).
  it('einflügelig: Flügel = Öffnung − 2×Spalt', () => {
    const d = deriveGartentor(
      inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1000, hoeheMm: 1200 }),
      12
    );
    expect(d.fluegelBreitenMm).toEqual([1000 - 2 * P.spaltMm]);
  });

  // Zwei Flügel: beide gleich breit, und es gibt drei Spalten (links, Mitte, rechts).
  it('zweiflügelig: symmetrische Teilung mit drei Spalten', () => {
    const d = deriveGartentor(
      inputsWith({ fluegelart: 'zwei', oeffnungBreiteMm: 2400, hoeheMm: 1200 }),
      12
    );
    expect(d.fluegelBreitenMm).toHaveLength(2);
    expect(d.fluegelBreitenMm[0]).toBe(d.fluegelBreitenMm[1]);
    expect(d.fluegelBreitenMm[0]).toBe(Math.round((2400 - 3 * P.spaltMm) / 2));
  });

  // Ein 1000 mm hohes Tor hat 2 Scharniere, ein 1500 mm hohes Tor hat 3.
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

  // Die Lücken zwischen den Stäben dürfen nicht zu gross sein.
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
    // Lücke = (Flügelbreite − alle Stäbe zusammen) ÷ (Anzahl Lücken).
    // Bei 8 Stäben gibt es 9 Lücken – eine mehr als Stäbe, wie bei Zaunlatten.
    // 🤧 Schnupfspruch: Zell d Stäb und zell d Lugge,
    //    und wänn s stimmt, dörf s Tor sich stolz bugge.
    const licht = (b - d.staebeProFluegel * 12) / (d.staebeProFluegel + 1);
    expect(licht).toBeLessThanOrEqual(P.maxStabLichtMm + 0.001);
  });

  // Neue Pfosten gibt es nur ohne Mauer.
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

// Zweite Gruppe: Sagt der Prüfer das Richtige?
// 🤧 Schnupfspruch: De Test isch grüen, s Tor isch zue –
//    jetzt gönnt sich de Programmierer e churzi Rueh.
describe('Gartentor-Regeln', () => {
  // Zu breit für einen Flügel? Dann rot, mit dem Tipp «nimm zwei Flügel».
  it('einflügelig über Maximalbreite ⇒ ROT mit Hinweis auf zweiflügelig', () => {
    const result = validateGartentor(
      inputsWith({ fluegelart: 'ein', oeffnungBreiteMm: 1600, hoeheMm: 1200 }),
      []
    );
    expect(result.level).toBe('red');
    expect(result.errors[0]).toContain('zweiflügelig');
  });

  // Motor-Vorbereitung: nur ein gelber Hinweis, kein Fehler.
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

// Dritte Gruppe: Steht im 3D-Bauplan alles am richtigen Ort?
describe('Gartentor-Geometrie', () => {
  // Zwei Flügel: Sie gehen in entgegengesetzte Richtungen, und nur einer hat das Schloss.
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

  // Ein Flügel: Scharnier links heisst x kleiner als 0, rechts heisst grösser als 0.
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

  // Steht auf dem Einkaufszettel alles Wichtige drauf?
  // 🤧 Schnupfspruch: Rahme, Bänder, Pfoste und Schloss –
  //    de Zettel isch voll, jetzt gaht s los!
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

// Vierte Gruppe: Funktioniert das fertige Beispiel-Tor, das man zuerst sieht?
describe('Gartentor-Startkonfiguration', () => {
  const d = DEFAULT_GARTENTOR_INPUTS;
  // Die Profile des Beispiel-Tors aus dem Katalog holen.
  const profile = {
    rahmen: getProfile(d.rahmenProfilId!),
    stab: getProfile(d.fuellstabProfilId!),
    pfosten: getProfile(d.pfostenProfilId!),
  };

  // Gibt es alle Dinge, die im Beispiel stehen, auch wirklich im Katalog?
  it('verwendet nur existierende Katalog- und Options-IDs', () => {
    expect(MATERIALS.some((m) => m.materialId === d.materialId && m.active)).toBe(true);
    expect(profilesForUse(PROFILES, 'gartentor', 'torrahmen').map((p) => p.profileId)).toContain(d.rahmenProfilId);
    expect(profilesForUse(PROFILES, 'gartentor', 'torfuellung').map((p) => p.profileId)).toContain(d.fuellstabProfilId);
    expect(profilesForUse(PROFILES, 'gartentor', 'torpfosten').map((p) => p.profileId)).toContain(d.pfostenProfilId);
    for (const p of [profile.rahmen, profile.stab, profile.pfosten]) {
      expect(p?.material).toBe(d.materialId);
    }
    const finish = FINISHES.find((f) => f.finishId === d.finishId);
    expect(finish?.allowedMaterials).toContain(d.materialId);
    expect(FARBEN.some((f) => f.id === d.farbe && f.hex)).toBe(true);
    expect(MONTAGE_SERVICES.some((m) => m.id === d.montageService)).toBe(true);
  });

  // Das Beispiel-Tor muss sich ausrechnen, bauen und prüfen lassen – ohne rote Ampel.
  it('liefert gültige Ableitung, vollständige Geometrie und keine rote Ampel', () => {
    const derived = deriveGartentor(d, profilBreiteMm(profile.stab!));
    expect(derived.fluegelBreitenMm).toEqual([1000 - 2 * P.spaltMm]);
    expect(derived.staebeProFluegel).toBeGreaterThan(0);
    expect(derived.pfostenAnzahl).toBe(2);

    const geo = buildTorGeometry(d, derived, profile);
    expect(geo.oeffnungM).toBeGreaterThan(0);
    expect(geo.hoeheM).toBeGreaterThan(0);
    expect(geo.fluegel).toHaveLength(1);
    expect(geo.fluegel[0].stabOffsetsM.length).toBe(derived.staebeProFluegel);
    expect(geo.fluegel[0].mitSchloss).toBe(true);
    expect(geo.seiten).toHaveLength(2);
    expect(torMaterialAuszug(d, derived).length).toBeGreaterThan(0);

    // Und der Prüfer darf nicht rot zeigen.
    const result = validateGartentor(
      d,
      [profile.rahmen!, profile.stab!, profile.pfosten!]
    );
    expect(result.level).not.toBe('red');
    expect(result.errors).toHaveLength(0);
  });

});
