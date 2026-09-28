/**
 * Treppen-Modul: gerade, einläufige Stahltreppe und/oder Treppengeländer.
 * Gewendelte, mehrläufige oder Podest-Treppen bleiben individuelle
 * Planung (komplexe Geometrien plant der Meister persönlich).
 */

import type {
  HandlaufAbschluss,
  Kinderschutz,
  OrnamentTyp,
} from '../gelaender/types';

/** Was wird konfiguriert? */
export type TreppenModus = 'treppe' | 'gelaender' | 'kombiniert';
export type TreppenEinbauort = 'innen' | 'aussen';
export type Stufentyp = 'gitterrost' | 'traenenblech' | 'blech-glatt';
export type TreppenKonstruktion = 'wangen' | 'mittelholm';
export type Setzstufen = 'offen' | 'geschlossen';
export type GelaenderSeite = 'links' | 'rechts' | 'beide';
export type TreppenFuellung = 'staketen' | 'querstab' | 'geschmiedet';

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

/**
 * Startwerte des Konfigurators: eine vollständige, stimmige Treppe, damit
 * die 3D-Vorschau sofort erscheint. Gerade Wangentreppe aussen, 2700 mm
 * Geschosshöhe (15 Steigungen à 180 mm, Auftritt 270 mm → Schrittmass
 * 630 mm), Gitterroststufen, Geländer rechts mit Staketen, anthrazit
 * pulverbeschichtet. Alle IDs stammen aus dem Katalog / den Optionen.
 */
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
