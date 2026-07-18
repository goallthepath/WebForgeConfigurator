/**
 * Gartentor-Modul: Eingaben und abgeleitete Werte (GATE-001…004).
 * Ein-/zweiflügelige Drehtore, manuell bedient. Schiebetore, Antriebe
 * als Komplettlösung und Toranlagen führen zur individuellen Anfrage.
 */

import type { BlechTyp, LaserMotiv, OrnamentTyp } from '../gelaender/types';

export type Fluegelart = 'ein' | 'zwei';
export type Seitenbau = 'mauer' | 'pfosten';
export type Oeffnungsrichtung = 'innen' | 'aussen';
export type Anschlagseite = 'links' | 'rechts';
export type TorFuellung = 'staketen' | 'blech' | 'geschmiedet';
export type TorSchloss = 'schloss-druecker' | 'riegel' | 'ohne';
export type TorUntergrund = 'beton' | 'mergel' | 'pflaster' | 'unbekannt';

export interface GartentorInputs {
  fluegelart: Fluegelart | null;
  /** Zwischen bestehenden Mauern/Pfosten oder freistehend mit neuen Torpfosten. */
  seitenbau: Seitenbau | null;
  oeffnungsrichtung: Oeffnungsrichtung | null;
  /** Bandseite in Blickrichtung von aussen (nur einflügelig relevant). */
  anschlag: Anschlagseite | null;
  /** Lichte Durchgangsbreite in mm. */
  oeffnungBreiteMm: number | null;
  hoeheMm: number | null;
  bodenfreiheitMm: number;
  masseUngefaehr: boolean;
  untergrund: TorUntergrund | null;
  fuellung: TorFuellung | null;
  blechTyp: BlechTyp | null;
  laserMotiv: LaserMotiv | null;
  ornamentTyp: OrnamentTyp | null;
  schloss: TorSchloss | null;
  /** Vorbereitung für späteren Antrieb (Leerrohr) – als Anfrageoption. */
  antriebVorbereitung: boolean;
  materialId: string | null;
  rahmenProfilId: string | null;
  fuellstabProfilId: string | null;
  pfostenProfilId: string | null;
  finishId: string | null;
  farbe: string | null;
  montageService: 'selbst' | 'webforge' | null;
}

export interface GartentorDerived {
  /** Flügelbreiten in mm (1 oder 2 Einträge). */
  fluegelBreitenMm: number[];
  /** Füllstäbe je Flügel. */
  staebeProFluegel: number;
  /** Bänder je Flügel. */
  baenderProFluegel: number;
  /** Neue Torpfosten (0 bei bestehender Mauer). */
  pfostenAnzahl: number;
}

export const EMPTY_GARTENTOR_INPUTS: GartentorInputs = {
  fluegelart: null,
  seitenbau: null,
  oeffnungsrichtung: null,
  anschlag: null,
  oeffnungBreiteMm: null,
  hoeheMm: null,
  bodenfreiheitMm: 30,
  masseUngefaehr: false,
  untergrund: null,
  fuellung: null,
  blechTyp: null,
  laserMotiv: null,
  ornamentTyp: null,
  schloss: null,
  antriebVorbereitung: false,
  materialId: null,
  rahmenProfilId: null,
  fuellstabProfilId: null,
  pfostenProfilId: null,
  finishId: null,
  farbe: null,
  montageService: null,
};
