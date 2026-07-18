import { describe, expect, it } from 'vitest';
import fixtures from '../../../product-data/fixtures/test-profiles.json';
import { profilesForUse, isProductionReady } from '../rules/profiles';
import { validateConfiguration } from '../rules/validation';
import { createDraftConfiguration } from '../products/configuration';
import type { Profile } from '../products/types';

const profiles = fixtures.profiles as unknown as Profile[];

describe('Standardprofil-Freigaben (TESTDATEN-Katalog)', () => {
  it('bietet Profile nur in ausdrücklich freigegebenen Produkt/Rolle-Kombinationen an', () => {
    const handlaeufe = profilesForUse(profiles, 'gelaender', 'handlauf');
    expect(handlaeufe.length).toBeGreaterThanOrEqual(4);
    expect(
      handlaeufe.every((p) =>
        p.allowedUses.some((u) => u.product === 'gelaender' && u.role === 'handlauf')
      )
    ).toBe(true);

    // Handläufe sind NICHT für Fenstergitter freigegeben.
    const gitterstaebe = profilesForUse(profiles, 'fenstergitter', 'gitterstab');
    expect(
      gitterstaebe.some((p) => p.profileId.startsWith('test-handlauf'))
    ).toBe(false);

    // Querstäbe existieren nur für das Geländer (Reling).
    const querstaebe = profilesForUse(profiles, 'gelaender', 'querstab');
    expect(querstaebe.length).toBeGreaterThanOrEqual(3);
  });

  it('blendet inaktive Profile aus', () => {
    const fuellstaebe = profilesForUse(profiles, 'gelaender', 'fuellstab');
    expect(fuellstaebe.some((p) => p.profileId === 'test-inaktives-profil')).toBe(false);
  });

  it('stuft TESTDATEN-Profile nie als produktionsbereit ein', () => {
    for (const profile of profiles) {
      expect(isProductionReady(profile)).toBe(false);
    }
  });
});

describe('Regelprüfung (Vorschau, Server bleibt Autorität)', () => {
  it('meldet Rot, wenn ein gewähltes Profil inaktiv ist', () => {
    const draft = createDraftConfiguration('gelaender');
    const inactive = profiles.find((p) => !p.active)!;
    const result = validateConfiguration(draft, [inactive]);
    expect(result.level).toBe('red');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('meldet ohne freigegebenen Regelkatalog höchstens Gelb', () => {
    const draft = createDraftConfiguration('fenstergitter');
    const result = validateConfiguration(draft, []);
    expect(result.level).toBe('yellow');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
