// Hallo! Diese Datei ist der Bestellzettel für ein Fenstergitter.
// Ein Fenstergitter ist wie ein Zaun vor dem Fenster – zum Beispiel am
// Kellerfenster, damit niemand hineinklettern kann, aber trotzdem Licht hineinkommt.
// Hier steht nur, welche Fragen es gibt und welche Antworten erlaubt sind.
/**
 * Fenstergitter-Modul: Eingaben und abgeleitete Werte.
 * Rechteckige, fest montierte Gitter (GRID-001/002) – Rundbogen,
 * öffenbare Gitter und Fluchtweg-Lösungen führen zur individuellen Anfrage.
 */

import type { OrnamentLage, OrnamentTyp } from '../gelaender/types';

// Auswahlkästchen: Kommt das Gitter innen oder aussen ans Fenster?
export type GitterEinbauort = 'innen' | 'aussen';
/** Ist das Fenster ein Fluchtweg? Feste Gitter sind dann nicht zulässig. */
export type Fluchtweg = 'ja' | 'nein' | 'unbekannt';
// Weitere Auswahlkästchen: Wird das Gitter IN die Fensternische gesetzt
// (Leibung) oder VOR die Wand geschraubt (Vorwand)? Hat man das Loch in der Wand
// gemessen (Lichtmass) oder das fertige Gitter (Aussenmass)? Nur senkrechte
// Stäbe oder zusätzlich waagrechte «Gurte»? Und woraus ist die Wand?
export type GitterMontage = 'leibung' | 'vorwand';
export type GitterMasstyp = 'lichtmass' | 'aussenmass';
export type Stabanordnung = 'vertikal' | 'vertikal-quergurt';
export type GitterUntergrund = 'beton' | 'backstein' | 'holz' | 'unbekannt';

// FenstergitterInputs = alle Antworten der Kundin. «null» heisst: noch offen.
// 🤧 Schnupfspruch: Es Gitter vor em Chällerfäischter, starch und fin –
//    da chunnt nume d Sunne und de Mond no ine.
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

// FenstergitterDerived = was wir aus den Antworten ausrechnen:
// Wie gross wird das Gitter wirklich, wie viele Stäbe, wie viele Befestigungen?
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

// Ein ganz leeres Formular – alle Fragen noch offen.
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

// Ein fertig ausgefülltes Beispiel-Gitter, damit man sofort etwas sieht.
// 🤧 Schnupfspruch: Tuusig breit und zwölfhundert hoch –
//    de Einbrächer lueget und findet kei Loch.
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
