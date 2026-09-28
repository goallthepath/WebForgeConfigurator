// ============================================================================
// products/catalog.ts – das Verzeichnis aller Produkte
// ----------------------------------------------------------------------------
// Wie das Inhaltsverzeichnis eines Bastelbuchs: Hier steht, welche Produkte es
// gibt, unter welcher Adresse man sie findet, wie sie heissen und in welcher
// Version die Regeln und Preise gelten.
// ============================================================================
import type { ProductId } from './types';

/**
 * Die freigegebenen Produktmodule. Ursprünglich drei; das Treppen-Modul
 * wurde vom Auftraggeber am 2026-07-18 zusätzlich beauftragt
 * (Treppe, Treppengeländer oder kombiniert).
 */
export interface ProductModule {
  id: ProductId;
  route: string;
  title: string;
  description: string;
  productVersion: string;
  ruleVersion: string;
  /** null bis zur Gate-C-Freigabe einer Preisversion (A-003). */
  priceVersion: string | null;
}

// Die Liste der vier Produkte. «readonly» und «as const» bedeuten: Diese Liste
// ist in Stein gemeisselt – niemand darf sie aus Versehen verändern.
// 🤧 Schnupfspruch: Gländer, Tor, Gitter und Treppe,
//    e Prise Schnupf, und scho gaht's d'Stäge ue – ohni z'schleppe.
export const PRODUCT_MODULES: readonly ProductModule[] = [
  {
    id: 'gelaender',
    route: '/gelaender/',
    title: 'Geländer konfigurieren',
    description:
      'Gerades oder L-förmiges Geländer mit definierten Pfosten, Füllungen, Handläufen und Befestigungsarten.',
    productVersion: '0.0.1',
    ruleVersion: '0.0.1',
    priceVersion: null,
  },
  {
    id: 'gartentor',
    route: '/gartentor/',
    title: 'Gartentor konfigurieren',
    description:
      'Ein- oder zweiflügeliges Metalltor mit Standardrahmen, Füllung, Pfosten und Beschlägen.',
    productVersion: '0.0.1',
    ruleVersion: '0.0.1',
    priceVersion: null,
  },
  {
    id: 'fenstergitter',
    route: '/fenstergitter/',
    title: 'Fenstergitter konfigurieren',
    description:
      'Fest montiertes Fenstergitter mit definiertem Rahmen, Stabanordnung, Oberfläche und Befestigung.',
    productVersion: '0.0.1',
    ruleVersion: '0.0.1',
    priceVersion: null,
  },
  {
    id: 'treppe',
    route: '/treppe/',
    title: 'Treppe & Treppengeländer',
    description:
      'Gerade Stahltreppe, Treppengeländer für bestehende Läufe – oder beides kombiniert.',
    productVersion: '0.0.1',
    ruleVersion: '0.0.1',
    priceVersion: null,
  },
] as const;

// getProductModule sucht ein Produkt anhand seiner ID heraus –
// wie wenn man im Inhaltsverzeichnis mit dem Finger die richtige Zeile sucht.
export function getProductModule(id: ProductId): ProductModule {
  const module = PRODUCT_MODULES.find((m) => m.id === id);
  // Nicht gefunden? Dann sofort laut Bescheid geben, statt still weiterzumachen.
  if (!module) {
    throw new Error(`Unbekanntes Produktmodul: ${id}`);
  }
  return module;
}
// 🤧 Schnupfspruch: Es Error-Fänschterli poppt uf –
//    nimm e Prise und schnuuf tüüf druf.
