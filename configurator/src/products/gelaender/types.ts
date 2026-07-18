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

export type Fuellungsart = 'staketen' | 'querstab' | 'glas';
export type HandlaufAbschluss = 'gerade' | 'kugel' | 'endbogen';
export type GlasTyp = 'klar' | 'satiniert';
export type Einbauort = 'innen' | 'aussen';
export type Montageart = 'boden' | 'seite';
export type Untergrund = 'beton' | 'holz' | 'stahl' | 'unbekannt';
export type MontageService = 'selbst' | 'webforge';

export interface GelaenderInputs {
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
  /** Glasfelder gesamt (nur Glas). */
  glasfelderTotal: number;
  gesamtlaengeMm: number;
  /** Zuschnittlängen Handlauf je Segment (mm). */
  handlaufLaengenMm: number[];
}

export const EMPTY_GELAENDER_INPUTS: GelaenderInputs = {
  variante: null,
  einbauort: null,
  montageart: null,
  untergrund: null,
  segmentLaengenMm: [],
  hoeheMm: null,
  masseUngefaehr: false,
  fuellungsart: null,
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
