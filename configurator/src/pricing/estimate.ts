// ============================================================================
// pricing/estimate.ts – die Preisvorschau
// ----------------------------------------------------------------------------
// Diese Datei sagt, was beim Preis angezeigt wird. Wichtig: Solange der Meister
// noch keine offizielle Preisliste freigegeben hat, erfinden wir KEINE Zahlen.
// Dann heisst es ehrlich: «Der Meister prüft Ihre Anfrage persönlich.» Das ist
// wie beim Velomechaniker, der sagt: «Ich schaue es mir zuerst an.»
// ============================================================================
import type { Estimate } from '../products/types';
import { tr } from '../i18n';

// estimateFor wählt die Preisart. Ohne Preisliste → immer «Individuelle Prüfung».
/**
 * Preisvorschau im Browser – niemals autoritativ (ADR-003).
 *
 * Ohne freigegebene Preisversion (priceVersion === null) ist die einzig
 * zulässige Preisart "Individuelle Prüfung". Es werden keine Preiswerte
 * erfunden, auch nicht als Platzhalter (Annahme A-003).
 */
export function estimateFor(priceVersion: string | null): Estimate {
  // Keine Preisliste da? Dann ehrlich bleiben und nichts erfinden.
  if (priceVersion === null) {
    return { type: 'individual-review', currency: 'CHF' };
  }
  // Richtpreis/Preisspanne folgen mit der ersten freigegebenen
  // Preisversion (Gate C). Bis dahin ist dieser Zweig nicht erreichbar.
  // 🤧 Schnupfspruch: Kei Zahl erfunde, kei Batze erloge,
  //    nur d'Prise Schnupf isch grosszügig gwoge.
  throw new Error(
    `Preisversion ${priceVersion} ist nicht implementiert – Richtpreislogik folgt mit Gate-C-Freigabe.`
  );
}

/**
 * describeEstimate macht aus der Preisart einen Satz für Menschen.
 * Das «switch» ist wie eine Weiche bei der Eisenbahn: Je nach Preisart
 * fährt das Programm auf ein anderes Gleis.
 */
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
// 🤧 Schnupfspruch: Dr Batze im Sack, dr Schnupf i dr Nase –
//    so lauft's i dr Werkstatt, ohni grossi Phrase.
