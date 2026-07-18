/**
 * Geländer-Modul: Eingaben und abgeleitete Werte.
 * Reine Datentypen – keine Regel-, Preis- oder 3D-Logik (Ebenentrennung).
 */

export type GelaenderVariante = 'i' | 'l-innen' | 'l-aussen';
export type Einbauort = 'innen' | 'aussen';
export type Montageart = 'boden' | 'seite';
export type Untergrund = 'beton' | 'holz' | 'stahl' | 'unbekannt';
export type MontageService = 'selbst' | 'webforge';

export interface GelaenderInputs {
  variante: GelaenderVariante | null;
  einbauort: Einbauort | null;
  montageart: Montageart | null;
  untergrund: Untergrund | null;
  /** Segmentlängen in mm. I-Form: 1 Segment, L-Form: 2 Segmente. */
  segmentLaengenMm: number[];
  hoeheMm: number | null;
  /** true = Masse sind ungefähr → Preisspanne/Prüfpflicht statt Richtpreis. */
  masseUngefaehr: boolean;
  pfostenProfilId: string | null;
  handlaufProfilId: string | null;
  fuellstabProfilId: string | null;
  finishId: string | null;
  /** RAL-Kennung oder 'individuell' (führt zu individueller Anfrage). */
  farbe: string | null;
  montageService: MontageService | null;
}

export interface GelaenderDerived {
  /** Pfosten je Segment (Eckpfosten wird bei L-Form geteilt). */
  pfostenProSegment: number[];
  pfostenTotal: number;
  fuellstaebeProSegment: number[];
  fuellstaebeTotal: number;
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
  pfostenProfilId: null,
  handlaufProfilId: null,
  fuellstabProfilId: null,
  finishId: null,
  farbe: null,
  montageService: null,
};
