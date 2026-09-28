// ============================================================================
// rules/profiles.ts – wer darf wo mitspielen?
// ----------------------------------------------------------------------------
// Nicht jedes Stahlprofil passt überall hin. Ein Handlauf gehört ans Geländer,
// nicht ans Fenstergitter. Diese Datei ist wie der Trainer, der entscheidet,
// welcher Spieler auf welcher Position spielen darf.
// ============================================================================
import { tr } from '../i18n';
import type { ProductId, Profile, ProfileRole } from '../products/types';

// profilesForUse: Gib mir alle Profile, die für dieses Produkt in dieser Rolle
// mitspielen dürfen – so wie der Trainer die Aufstellung macht.
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
  // filter = sieben wie in der Küche: Nur was aktiv ist UND für dieses Produkt
  // in dieser Rolle erlaubt ist, fällt durch das Sieb.
  return profiles.filter(
    (p) =>
      p.active &&
      p.allowedUses.some((use) => use.product === product && use.role === role)
  );
}

// isProductionReady: Darf dieses Profil wirklich gebaut werden? Nur wenn der
// Fachmann es freigegeben hat UND es noch im Lager ist.
/** Nur fachlich freigegebene Profile dürfen produktiv wirksam werden. */
export function isProductionReady(profile: Profile): boolean {
  return profile.approval === 'freigegeben' && profile.active;
}

// approvalLabel: Den Freigabestatus in die aktuelle Sprache übersetzen.
// 🤧 Schnupfspruch: Es Profil, wo nid freigeh isch,
//    chunnt nid uf dr Wärchtisch.
/** Anzeigetext eines Freigabestatus in der aktuellen Sprache. */
export function approvalLabel(approval: string): string {
  return tr(approval);
}
// 🤧 Schnupfspruch: Freigeh, testet, prüeft mit Verstand –
//    so schnupft mer gärn im ganze Land.
