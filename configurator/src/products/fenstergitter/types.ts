/**
 * Fenstergitter-Modul: Eingaben und abgeleitete Werte.
 * Rechteckige, fest montierte Gitter (GRID-001/002) – Rundbogen,
 * öffenbare Gitter und Fluchtweg-Lösungen führen zur individuellen Anfrage.
 */

import type { OrnamentLage, OrnamentTyp } from '../gelaender/types';

export type GitterEinbauort = 'innen' | 'aussen';
/** Ist das Fenster ein Fluchtweg? Feste Gitter sind dann nicht zulässig. */
export type Fluchtweg = 'ja' | 'nein' | 'unbekannt';
export type GitterMontage = 'leibung' | 'vorwand';
export type GitterMasstyp = 'lichtmass' | 'aussenmass';
export type Stabanordnung = 'vertikal' | 'vertikal-quergurt';
export type GitterUntergrund = 'beton' | 'backstein' | 'holz' | 'unbekannt';

export interface FenstergitterInputs {
  einbauort: GitterEinbauort | null;
  fluchtweg: Fluchtweg | null;
  montage: GitterMontage | null;
  untergrund: GitterUntergrund | null;
  /** Gemessen als Leibungs-Lichtmass oder gewünschtes Gitter-Aussenmass. */
  masstyp: GitterMasstyp;
  breiteMm: number | null;
  hoeheMm: number | null;
  masseUngefaehr: boolean;
  stabanordnung: Stabanordnung | null;
  /** Anzahl Quergurte (1–2) bei Anordnung 'vertikal-quergurt'. */
  quergurtAnzahl: number;
  /** Zierelemente (Charakter) – null = ohne. */
  ornamentTyp: OrnamentTyp | null;
  ornamentLage: OrnamentLage;
  materialId: string | null;
  rahmenProfilId: string | null;
  stabProfilId: string | null;
  /** Sonderwunsch Stab-Ø in mm (prüfpflichtig, keine freien Querschnitte produktiv). */
  stabWunschDm: number | null;
  finishId: string | null;
  farbe: string | null;
  montageService: 'selbst' | 'webforge' | null;
}

export interface FenstergitterDerived {
  /** Gitter-Aussenmasse in mm (aus Masstyp und Montageart abgeleitet). */
  rahmenBreiteMm: number;
  rahmenHoeheMm: number;
  stabAnzahl: number;
  quergurtAnzahl: number;
  /** Befestigungslaschen je Seite und total. */
  laschenProSeite: number;
  laschenTotal: number;
}

export const EMPTY_FENSTERGITTER_INPUTS: FenstergitterInputs = {
  einbauort: null,
  fluchtweg: null,
  montage: null,
  untergrund: null,
  masstyp: 'lichtmass',
  breiteMm: null,
  hoeheMm: null,
  masseUngefaehr: false,
  stabanordnung: null,
  quergurtAnzahl: 1,
  ornamentTyp: null,
  ornamentLage: 'mitte',
  materialId: null,
  rahmenProfilId: null,
  stabProfilId: null,
  stabWunschDm: null,
  finishId: null,
  farbe: null,
  montageService: null,
};

/**
 * Startkonfiguration: ein realistisches, vollständiges Fenstergitter
 * (Kellerfenster ca. 1000 × 1200 mm, Leibungsmontage, Vierkantstäbe mit
 * einem Quergurt, pulverbeschichtet in Anthrazitgrau), damit die
 * 3D-Vorschau sofort erscheint. Alle Ids stammen aus dem Katalog bzw.
 * den Optionslisten; die Validierung bleibt GELB (nie ROT).
 */
export const DEFAULT_FENSTERGITTER_INPUTS: FenstergitterInputs = {
  einbauort: 'aussen',
  fluchtweg: 'nein',
  montage: 'leibung',
  untergrund: 'beton',
  masstyp: 'lichtmass',
  breiteMm: 1000,
  hoeheMm: 1200,
  masseUngefaehr: false,
  stabanordnung: 'vertikal-quergurt',
  quergurtAnzahl: 1,
  ornamentTyp: null,
  ornamentLage: 'mitte',
  materialId: 'test-stahl',
  rahmenProfilId: 'test-rahmen-rechteckrohr',
  stabProfilId: 'test-fuellstab-vierkant-12',
  stabWunschDm: null,
  finishId: 'test-pulverbeschichtet',
  farbe: 'ral-7016',
  montageService: 'webforge',
};
