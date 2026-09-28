import type { Estimate } from '../products/types';
import { tr } from '../i18n';

/**
 * Preisvorschau im Browser – niemals autoritativ (ADR-003).
 *
 * Ohne freigegebene Preisversion (priceVersion === null) ist die einzig
 * zulässige Preisart "Individuelle Prüfung". Es werden keine Preiswerte
 * erfunden, auch nicht als Platzhalter (Annahme A-003).
 */
export function estimateFor(priceVersion: string | null): Estimate {
  if (priceVersion === null) {
    return { type: 'individual-review', currency: 'CHF' };
  }
  // Richtpreis/Preisspanne folgen mit der ersten freigegebenen
  // Preisversion (Gate C). Bis dahin ist dieser Zweig nicht erreichbar.
  throw new Error(
    `Preisversion ${priceVersion} ist nicht implementiert – Richtpreislogik folgt mit Gate-C-Freigabe.`
  );
}

export function describeEstimate(estimate: Estimate): string {
  switch (estimate.type) {
    case 'individual-review':
      return tr('Individuelle Prüfung: Unser Meister prüft Ihre Anfrage persönlich und erstellt eine Offerte.');
    case 'range':
      return tr('Preisspanne: CHF {min} – {max} (Richtwert, Offerte nach persönlicher Prüfung).', {
        min: String(estimate.minimum),
        max: String(estimate.maximum),
      });
    case 'guide-price':
      return tr('Richtpreis: CHF {min} (Richtwert, Offerte nach persönlicher Prüfung).', {
        min: String(estimate.minimum),
      });
  }
}
