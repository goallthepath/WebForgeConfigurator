/**
 * Geländer-Modul: Eingaben und abgeleitete Werte.
 * Reine Datentypen – keine Regel-, Preis- oder 3D-Logik (Ebenentrennung).
 */

export type GelaenderVariante =
  | 'i'
  | 'l-innen'
  | 'l-aussen'
  | 'u-innen'
  | 'u-aussen';

/** Anzahl gerader Segmente je Grundform. */
export const SEGMENTE_PRO_VARIANTE: Record<GelaenderVariante, number> = {
  i: 1,
  'l-innen': 2,
  'l-aussen': 2,
  'u-innen': 3,
  'u-aussen': 3,
};

/**
 * Einsatzorte gemäss Fachgrundlage (docs/gelaender-fachgrundlagen.md).
 * Treppen, Industrie und Bestandssanierung sind bewusst KEINE Optionen –
 * sie führen über Escape-Hatches (Treppengeländer wird ein eigener
 * Konfigurator, Industrie folgt Suva-Regelwerk, Bestand braucht Aufmass).
 */
export type Einsatzort =
  | 'balkon'
  | 'terrasse'
  | 'attika'
  | 'franz-balkon'
  | 'garten'
  | 'podest';

export type Kinderschutz = 'ja' | 'nein' | 'unbekannt';
export type Absturzhoehe = 'unter-1m' | 'ueber-1m' | 'unbekannt';

export type Fuellungsart =
  | 'staketen'
  | 'querstab'
  | 'blech'
  | 'gitter'
  | 'glas';
export type BlechTyp = 'voll' | 'loch' | 'laser';
export type GitterTyp = 'streckmetall' | 'drahtgitter';
export type HandlaufAbschluss = 'gerade' | 'kugel' | 'endbogen';
export type GlasTyp = 'klar' | 'satiniert';
export type Einbauort = 'innen' | 'aussen';
export type Montageart = 'boden' | 'seite' | 'unten' | 'eingelassen' | 'wand';
export type Untergrund = 'beton' | 'holz' | 'stahl' | 'unbekannt';
export type MontageService = 'selbst' | 'webforge';

export interface GelaenderInputs {
  einsatzort: Einsatzort | null;
  /** Sind Kinder zu erwarten? Steuert BFU-Kinderschutz-Hinweise. */
  kinderschutz: Kinderschutz | null;
  /** Absturzhöhe hinter dem Geländer (BFU: ab 1 m Schutzelement nötig). */
  absturzhoehe: Absturzhoehe | null;
  variante: GelaenderVariante | null;
  einbauort: Einbauort | null;
  montageart: Montageart | null;
  untergrund: Untergrund | null;
  /** Segmentlängen in mm gemäss SEGMENTE_PRO_VARIANTE. */
  segmentLaengenMm: number[];
  hoeheMm: number | null;
  /** true = Masse sind ungefähr → Preisspanne/Prüfpflicht statt Richtpreis. */
  masseUngefaehr: boolean;
  fuellungsart: Fuellungsart | null;
  /** Nur bei Füllungsart 'blech'. */
  blechTyp: BlechTyp | null;
  /** Nur bei Füllungsart 'gitter'. */
  gitterTyp: GitterTyp | null;
  /** Unterer Rahmengurt (konstruktiv üblich bei Stab-/Flächenfüllungen). */
  mitUntergurt: boolean;
  pfostenProfilId: string | null;
  handlaufProfilId: string | null;
  /** Nur bei Füllungsart 'staketen'. */
  fuellstabProfilId: string | null;
  /** Nur bei Füllungsart 'querstab' (Reling). */
  querstabProfilId: string | null;
  /** Nur bei Füllungsart 'glas'. */
  glasTyp: GlasTyp | null;
  /** Nur bei Glas wählbar: puristisch ohne Handlauf. */
  ohneHandlauf: boolean;
  handlaufAbschluss: HandlaufAbschluss | null;
  finishId: string | null;
  /** RAL-Kennung oder 'individuell' (führt zu individueller Anfrage). */
  farbe: string | null;
  montageService: MontageService | null;
}

export interface GelaenderDerived {
  /** Pfosten je Segment (Eckpfosten werden zwischen Segmenten geteilt). */
  pfostenProSegment: number[];
  pfostenTotal: number;
  /** Vertikale Füllstäbe (nur Staketen). */
  fuellstaebeProSegment: number[];
  fuellstaebeTotal: number;
  /** Anzahl horizontaler Querstäbe übereinander (nur Reling). */
  querstabLagen: number;
  /** Füllungsfelder gesamt (Glas-, Blech- oder Gitterfelder). */
  glasfelderTotal: number;
  gesamtlaengeMm: number;
  /** Zuschnittlängen Handlauf je Segment (mm). */
  handlaufLaengenMm: number[];
  /** Zuschnittlängen Untergurt je Segment (mm), leer ohne Untergurt. */
  untergurtLaengenMm: number[];
}

export const EMPTY_GELAENDER_INPUTS: GelaenderInputs = {
  einsatzort: null,
  kinderschutz: null,
  absturzhoehe: null,
  variante: null,
  einbauort: null,
  montageart: null,
  untergrund: null,
  segmentLaengenMm: [],
  hoeheMm: null,
  masseUngefaehr: false,
  fuellungsart: null,
  blechTyp: null,
  gitterTyp: null,
  mitUntergurt: true,
  pfostenProfilId: null,
  handlaufProfilId: null,
  fuellstabProfilId: null,
  querstabProfilId: null,
  glasTyp: null,
  ohneHandlauf: false,
  handlaufAbschluss: null,
  finishId: null,
  farbe: null,
  montageService: null,
};
