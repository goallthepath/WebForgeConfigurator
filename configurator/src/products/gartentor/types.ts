// Hallo! Diese Datei ist wie ein Bestellzettel für ein Gartentor.
// Hier steht, welche Fragen wir der Kundin stellen (wie breit? wie hoch?
// welche Farbe?) und welche Antworten überhaupt erlaubt sind.
// Rechnen tut hier noch niemand – das kommt in derive.ts und geometry.ts.
/**
 * Gartentor-Modul: Eingaben und abgeleitete Werte (GATE-001…004).
 * Ein-/zweiflügelige Drehtore, manuell bedient. Schiebetore, Antriebe
 * als Komplettlösung und Toranlagen führen zur individuellen Anfrage.
 */

import type { BlechTyp, LaserMotiv, OrnamentTyp } from '../gelaender/types';

// Diese kleinen Typen sind wie Auswahlkästchen auf einem Formular:
// Man darf nur eines der vorgegebenen Wörter ankreuzen, sonst nichts.
// Zum Beispiel: ein Flügel ('ein') wie beim Hühnerstall-Tor,
// oder zwei Flügel ('zwei') wie bei einem grossen Hoftor.
export type Fluegelart = 'ein' | 'zwei';
export type Seitenbau = 'mauer' | 'pfosten';
export type Oeffnungsrichtung = 'innen' | 'aussen';
export type Anschlagseite = 'links' | 'rechts';
export type TorFuellung = 'staketen' | 'blech' | 'geschmiedet';
export type TorSchloss = 'schloss-druecker' | 'riegel' | 'ohne';
export type TorUntergrund = 'beton' | 'mergel' | 'pflaster' | 'unbekannt';

// GartentorInputs = alle Antworten, die jemand im Konfigurator gibt.
// «null» heisst: «Diese Frage ist noch nicht beantwortet» – wie ein leeres Kästchen.
// 🤧 Schnupfspruch: Es Tor ohni Riegel isch wie-n-es Huus ohni Ziegel –
//    es gaht uf und zue, und d Hüehner händ kei Rueh!
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

// GartentorDerived = Dinge, die wir aus den Antworten AUSRECHNEN,
// zum Beispiel wie breit jeder Flügel wird oder wie viele Stäbe hineinpassen.
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

// Ein ganz leeres Formular: Alle Fragen sind noch offen.
// So sieht es aus, wenn man mit einem weissen Blatt Papier anfängt.
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

// Das Gegenteil vom leeren Formular: ein schon fertig ausgefülltes Beispiel,
// damit man sofort ein hübsches Tor in 3D sieht und nur noch ändern muss.
// 🤧 Schnupfspruch: Tausig Millimeter breit, zwölfhundert hoch,
//    anthrazitgrau – und d Chatz chunnt glich no dur s Loch.
/**
 * Startkonfiguration: ein ansprechendes, vollständiges Standard-Gartentor,
 * damit die 3D-Vorschau sofort erscheint und alle Schritte freigeschaltet
 * sind. Einflügelig 1000 × 1200 mm, Stahl, Staketen, zwei neue Torpfosten,
 * Schloss mit Drücker, pulverbeschichtet in RAL 7016 Anthrazitgrau.
 */
export const DEFAULT_GARTENTOR_INPUTS: GartentorInputs = {
  fluegelart: 'ein',
  seitenbau: 'pfosten',
  oeffnungsrichtung: 'innen',
  anschlag: 'links',
  oeffnungBreiteMm: 1000,
  hoeheMm: 1200,
  bodenfreiheitMm: 50,
  masseUngefaehr: false,
  untergrund: 'beton',
  fuellung: 'staketen',
  blechTyp: null,
  laserMotiv: null,
  ornamentTyp: null,
  schloss: 'schloss-druecker',
  antriebVorbereitung: false,
  materialId: 'test-stahl',
  rahmenProfilId: 'test-rahmen-rechteckrohr',
  fuellstabProfilId: 'test-fuellstab-vierkant-12',
  pfostenProfilId: 'test-pfosten-quadratrohr-40',
  finishId: 'test-pulverbeschichtet',
  farbe: 'ral-7016',
  montageService: 'webforge',
};
