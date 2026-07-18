import type { ProductId, Profile, ProfileRole } from '../products/types';

/**
 * Standardprofil-Logik (ADR-002): Ein Profil wird nur in dem Produkt und
 * der Bauteilrolle angeboten, für die es ausdrücklich freigegeben ist.
 * Inaktive Profile erscheinen nie – zusätzlich weist der Server sie beim
 * Absenden ab (serverseitige Autorität).
 */
export function profilesForUse(
  profiles: readonly Profile[],
  product: ProductId,
  role: ProfileRole
): Profile[] {
  return profiles.filter(
    (p) =>
      p.active &&
      p.allowedUses.some((use) => use.product === product && use.role === role)
  );
}

/** Nur fachlich freigegebene Profile dürfen produktiv wirksam werden. */
export function isProductionReady(profile: Profile): boolean {
  return profile.approval === 'freigegeben' && profile.active;
}
