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

export function getProductModule(id: ProductId): ProductModule {
  const module = PRODUCT_MODULES.find((m) => m.id === id);
  if (!module) {
    throw new Error(`Unbekanntes Produktmodul: ${id}`);
  }
  return module;
}
