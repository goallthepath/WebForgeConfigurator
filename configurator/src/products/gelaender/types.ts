/**
 * Zentrale Typen des Geländer-Moduls.
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
  | 'glas'
  | 'geschmiedet';
export type BlechTyp = 'voll' | 'loch' | 'laser';
/** Vordefinierte Laserschnitt-Motive (Grundauswahl). */
export type LaserMotiv = 'schlitze' | 'kreise' | 'quadrate' | 'floral';
export type GitterTyp = 'streckmetall' | 'drahtgitter';
/**
 * Ornament-Grundauswahl der Charakter-Familie (geschmiedet).
 * Die definitive handwerkliche Ausarbeitung bleibt individuelle Planung.
 */
export type OrnamentTyp = 'ringe' | 'voluten' | 'koerbe';
export type HandlaufAbschluss = 'gerade' | 'kugel' | 'endbogen';
/** Handlauf aufgesetzt auf die Pfosten oder zwischen den Pfosten bündig. */
export type HandlaufPosition = 'aufgesetzt' | 'zwischen';
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
  /**
   * Fussplatten-Wunschmasse in mm (Vorschau/Anfrage; die definitive
   * Platte und Verankerung werden statisch bemessen).
   */
  fussplatteLaengeMm: number;
  fussplatteBreiteMm: number;
  fussplatteDickeMm: number;
  /** Segmentlängen in mm gemäss SEGMENTE_PRO_VARIANTE. */
  segmentLaengenMm: number[];
  hoeheMm: number | null;
  /** true = Masse sind ungefähr → Preisspanne/Prüfpflicht statt Richtpreis. */
  masseUngefaehr: boolean;
  fuellungsart: Fuellungsart | null;
  /** Nur bei Füllungsart 'blech'. */
  blechTyp: BlechTyp | null;
  /** Nur bei Blechtyp 'laser'. */
  laserMotiv: LaserMotiv | null;
  /** Nur bei Füllungsart 'gitter'. */
  gitterTyp: GitterTyp | null;
  /** Nur bei Füllungsart 'geschmiedet' (Charakter-Familie). */
  ornamentTyp: OrnamentTyp | null;
  /** Unterer Rahmengurt (konstruktiv üblich bei Stab-/Flächenfüllungen). */
  mitUntergurt: boolean;
  /** Höhe der Untergurt-Achse über Boden in mm. */
  untergurtHoeheMm: number;
  /** Separater Obergurt unterhalb des Handlaufs (Rahmenbauweise). */
  mitObergurt: boolean;
  /** Höhe der Obergurt-Achse über Boden in mm (nur mit Obergurt). */
  obergurtHoeheMm: number | null;
  /** Knieleiste (mittlerer Gurt). */
  mitKnieleiste: boolean;
  knieleisteHoeheMm: number | null;
  /** Werkstoff (Katalogverweis materials/*.json). */
  materialId: string | null;
  pfostenProfilId: string | null;
  handlaufProfilId: string | null;
  /**
   * Sonderwunsch Handlauf: Runddurchmesser in mm statt Katalogprofil.
   * Immer «fachliche Freigabe erforderlich» (Bauplan: keine freien
   * Querschnitte produktiv) – dient Vorschau und Anfrage.
   */
  handlaufWunschDm: number | null;
  /** Nur bei Füllungsart 'staketen'/'geschmiedet'. */
  fuellstabProfilId: string | null;
  /** Sonderwunsch Stakete: Runddurchmesser in mm (prüfpflichtig). */
  fuellstabWunschDm: number | null;
  /** Nur bei Füllungsart 'querstab' (Reling). */
  querstabProfilId: string | null;
  /** Nur bei Füllungsart 'glas'. */
  glasTyp: GlasTyp | null;
  /** Nur bei Glas wählbar: puristisch ohne Handlauf. */
  ohneHandlauf: boolean;
  handlaufAbschluss: HandlaufAbschluss | null;
  handlaufPosition: HandlaufPosition;
  finishId: string | null;
  /** RAL-Kennung, 'verzinkt-natur' oder 'individuell'. */
  farbe: string | null;
  montageService: MontageService | null;
}

export interface GelaenderDerived {
  /** Pfosten je Segment (Eckpfosten werden zwischen Segmenten geteilt). */
  pfostenProSegment: number[];
  pfostenTotal: number;
  /** Vertikale Füllstäbe (Staketen/geschmiedet). */
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
  /** Zuschnittlängen Obergurt je Segment (mm), leer ohne Obergurt. */
  obergurtLaengenMm: number[];
  /** Zuschnittlängen Knieleiste je Segment (mm), leer ohne Knieleiste. */
  knieleisteLaengenMm: number[];
}

export const EMPTY_GELAENDER_INPUTS: GelaenderInputs = {
  einsatzort: null,
  kinderschutz: null,
  absturzhoehe: null,
  variante: null,
  einbauort: null,
  montageart: null,
  untergrund: null,
  fussplatteLaengeMm: 120,
  fussplatteBreiteMm: 120,
  fussplatteDickeMm: 10,
  segmentLaengenMm: [],
  hoeheMm: null,
  masseUngefaehr: false,
  fuellungsart: null,
  blechTyp: null,
  laserMotiv: null,
  gitterTyp: null,
  ornamentTyp: null,
  mitUntergurt: true,
  untergurtHoeheMm: 80,
  mitObergurt: false,
  obergurtHoeheMm: null,
  mitKnieleiste: false,
  knieleisteHoeheMm: null,
  materialId: null,
  pfostenProfilId: null,
  handlaufProfilId: null,
  handlaufWunschDm: null,
  fuellstabProfilId: null,
  fuellstabWunschDm: null,
  querstabProfilId: null,
  glasTyp: null,
  ohneHandlauf: false,
  handlaufAbschluss: null,
  handlaufPosition: 'aufgesetzt',
  finishId: null,
  farbe: null,
  montageService: null,
};
