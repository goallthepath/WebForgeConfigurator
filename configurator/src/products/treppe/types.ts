// ─────────────────────────────────────────────────────────────────────────
// Hallo! Diese Datei ist wie ein Bestellzettel für eine Treppe.
// Hier steht nur, WELCHE Angaben es gibt (Höhe, Breite, Farbe, Stufenart …)
// und welche Antworten erlaubt sind – gerechnet wird hier noch nichts.
// Stell dir vor, du willst eine Treppe zu deinem Baumhaus bestellen: Zuerst
// brauchst du ein Formular mit Feldern. Genau dieses Formular ist diese Datei.
// ─────────────────────────────────────────────────────────────────────────
/**
 * Treppen-Modul: gerade, einläufige Stahltreppe und/oder Treppengeländer.
 * Gewendelte, mehrläufige oder Podest-Treppen bleiben individuelle
 * Planung (komplexe Geometrien plant der Meister persönlich).
 */

// Wir leihen uns ein paar Wörter vom Geländer-Modul aus, damit wir sie nicht
// doppelt erfinden müssen (so wie man beim Nachbarn Zucker ausleiht).
import type {
  HandlaufAbschluss,
  Kinderschutz,
  OrnamentTyp,
} from '../gelaender/types';

/** Was wird konfiguriert? */
export type TreppenModus = 'treppe' | 'gelaender' | 'kombiniert';
// Wo steht die Treppe: drinnen im Haus oder draussen im Garten?
export type TreppenEinbauort = 'innen' | 'aussen';
// Woraus sind die Stufen gemacht? Gitterrost (wie ein Gitter, Regen fällt
// durch), Tränenblech (Blech mit kleinen Buckeln, damit man nicht rutscht)
// oder ganz glattes Blech.
export type Stufentyp = 'gitterrost' | 'traenenblech' | 'blech-glatt';
// Wer trägt die Stufen? Zwei «Wangen» links und rechts (wie zwei Leitern-
// Holme) oder ein einziger dicker Balken in der Mitte («Mittelholm»).
export type TreppenKonstruktion = 'wangen' | 'mittelholm';
// Ist zwischen den Stufen Luft (offen) oder ein Blech (geschlossen)?
export type Setzstufen = 'offen' | 'geschlossen';
// Auf welcher Seite ist das Geländer zum Festhalten?
export type GelaenderSeite = 'links' | 'rechts' | 'beide';
// Womit wird das Geländer gefüllt, damit niemand durchfällt?
// Senkrechte Stäbe, schräge Querstäbe oder schöne geschmiedete Schnörkel.
export type TreppenFuellung = 'staketen' | 'querstab' | 'geschmiedet';
// 🤧 Schnupfspruch: Ufe gaht's mit Schwung und Schnuuf,
//    abe chunnt mer immer druf.

/**
 * Alles, was die Kundin oder der Kunde auswählt oder eintippt.
 * Stell dir das wie die Zutatenliste eines Rezepts vor: jede Zeile ist eine
 * Zutat. «null» heisst: «Das hat noch niemand ausgesucht.»
 */
export interface TreppeInputs {
  modus: TreppenModus | null;
  einbauort: TreppenEinbauort | null;
  kinderschutz: Kinderschutz | null;
  /** Geschosshöhe OK Fertigboden unten → oben in mm. */
  geschosshoeheMm: number | null;
  laufbreiteMm: number | null;
  masseUngefaehr: boolean;
  /** Manuelle Stufenzahl-Übersteuerung (null = automatisch nach Schrittmass). */
  stufenAnzahlManuell: number | null;
  /** Nur Modus 'treppe'/'kombiniert'. */
  konstruktion: TreppenKonstruktion;
  stufentyp: Stufentyp | null;
  setzstufen: Setzstufen;
  wangenProfilId: string | null;
  /** Nur Modus 'gelaender'/'kombiniert'. */
  gelaenderSeite: GelaenderSeite | null;
  /** Geländerhöhe senkrecht über Stufenvorderkante in mm. */
  gelaenderHoeheMm: number | null;
  fuellung: TreppenFuellung | null;
  ornamentTyp: OrnamentTyp | null;
  pfostenProfilId: string | null;
  handlaufProfilId: string | null;
  fuellstabProfilId: string | null;
  querstabProfilId: string | null;
  handlaufAbschluss: HandlaufAbschluss | null;
  materialId: string | null;
  finishId: string | null;
  farbe: string | null;
  montageService: 'selbst' | 'webforge' | null;
}

/**
 * Alles, was der Computer AUS den Eingaben ausrechnet: wie viele Stufen,
 * wie hoch jede Stufe ist, wie lang die Treppe wird, wie schräg sie ist …
 * Das ist wie das fertige Kuchenrezept, nachdem man die Zutaten abgewogen hat.
 */
export interface TreppeDerived {
  /** Anzahl Steigungen. */
  steigungenAnzahl: number;
  /** Anzahl Trittstufen (= Steigungen − 1, Austritt auf Fertigboden). */
  stufenAnzahl: number;
  steigungMm: number;
  auftrittMm: number;
  /** Schrittmass 2s+a in mm. */
  schrittmassMm: number;
  /** Horizontale Lauflänge in mm. */
  lauflaengeMm: number;
  /** Schräge Wangen-/Handlauflänge in mm. */
  schraegeLaengeMm: number;
  neigungGrad: number;
  /** Geländer (0 wenn Modus 'treppe'). */
  gelaenderSeiten: number;
  pfostenProSeite: number;
  staebeProSeite: number;
  querstabLagen: number;
}

/**
 * Ein ganz leeres Formular: Fast alles ist «noch nicht ausgesucht» (null).
 * Nur die Laufbreite ist schon 1 Meter, weil das fast immer passt.
 */
export const EMPTY_TREPPE_INPUTS: TreppeInputs = {
  modus: null,
  einbauort: null,
  kinderschutz: null,
  geschosshoeheMm: null,
  laufbreiteMm: 1000,
  masseUngefaehr: false,
  stufenAnzahlManuell: null,
  konstruktion: 'wangen',
  stufentyp: null,
  setzstufen: 'offen',
  wangenProfilId: null,
  gelaenderSeite: null,
  gelaenderHoeheMm: null,
  fuellung: null,
  ornamentTyp: null,
  pfostenProfilId: null,
  handlaufProfilId: null,
  fuellstabProfilId: null,
  querstabProfilId: null,
  handlaufAbschluss: null,
  materialId: null,
  finishId: null,
  farbe: null,
  montageService: null,
};
// 🤧 Schnupfspruch: D Stufe hät e Nase, ich ha au eini –
//    nur miini schnupft, und d Stufe keini.

/**
 * Startwerte des Konfigurators: eine vollständige, stimmige Treppe, damit
 * die 3D-Vorschau sofort erscheint. Gerade Wangentreppe aussen, 2700 mm
 * Geschosshöhe (15 Steigungen à 180 mm, Auftritt 270 mm → Schrittmass
 * 630 mm), Gitterroststufen, Geländer rechts mit Staketen, anthrazit
 * pulverbeschichtet. Alle IDs stammen aus dem Katalog / den Optionen.
 */
// Kinder-Erklärung: Das ist die «Beispiel-Treppe», die man sofort sieht.
// 2700 mm hoch, aufgeteilt in 15 gleiche Treppenstufen-Höhen von je 180 mm
// (15 × 180 = 2700). Jede Stufe ist 270 mm tief. Und 2 × 180 + 270 = 630 –
// genau eine bequeme Schrittlänge!
export const DEFAULT_TREPPE_INPUTS: TreppeInputs = {
  modus: 'kombiniert',
  einbauort: 'aussen',
  kinderschutz: 'ja',
  geschosshoeheMm: 2700,
  laufbreiteMm: 1000,
  masseUngefaehr: false,
  stufenAnzahlManuell: null,
  konstruktion: 'wangen',
  stufentyp: 'gitterrost',
  setzstufen: 'offen',
  wangenProfilId: 'test-wange-flachstahl-200',
  gelaenderSeite: 'rechts',
  gelaenderHoeheMm: 1000,
  fuellung: 'staketen',
  ornamentTyp: null,
  pfostenProfilId: 'test-pfosten-quadratrohr-40',
  handlaufProfilId: 'test-handlauf-rundrohr-42',
  fuellstabProfilId: 'test-fuellstab-rundstab-12',
  querstabProfilId: 'test-querstab-rundrohr-16',
  handlaufAbschluss: 'endbogen',
  materialId: 'test-stahl',
  finishId: 'test-pulverbeschichtet',
  farbe: 'ral-7016',
  montageService: 'webforge',
};
