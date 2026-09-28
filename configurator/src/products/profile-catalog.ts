// ============================================================================
// products/profile-catalog.ts – die Kiste mit den Bauteilen
// ----------------------------------------------------------------------------
// Ein Schlosser hat im Lager viele Stahlprofile: Rundrohre, Flachstahl,
// Vierkantstäbe … Diese Datei öffnet die Lagerliste (JSON-Dateien), übersetzt
// die Namen in die gewählte Sprache und hilft beim Beschreiben der Masse.
// Die gleiche Liste liest später auch der Server – eine Quelle für alle.
// ============================================================================
import fixtures from '../../../product-data/fixtures/test-profiles.json';
import finishesData from '../../../product-data/finishes/finishes.json';
import materialsData from '../../../product-data/materials/materials.json';
import { tr } from '../i18n';
import type { Profile } from './types';

/**
 * Katalogzugriff. Quelle ist der versionierte TESTDATEN-Katalog unter
 * product-data/ – dieselben Dateien, die später der Server einliest
 * (eine Quelle, zwei Konsumenten, ADR-002).
 */

// Die Versionsnummer der Lagerliste – wie das Datum auf einem Katalog.
export const CATALOG_VERSION: string = fixtures.$meta.catalogVersion;

// translateCatalogName: Die Namen im Lager sind deutsch. Diese Funktion
// übersetzt sie, lässt aber das «TESTDATEN»-Etikett in Ruhe – wie wenn man
// ein Buch übersetzt, aber den Bibliotheksstempel darauf nicht anrührt.
/**
 * Übersetzt einen Katalognamen aus product-data/ (JSON bleibt deutsch).
 * Die TESTDATEN-Markierung bleibt in den Formen «TESTDATEN …» und
 * «… (TESTDATEN)» unverändert erhalten, damit die Module sie wie bisher
 * abschneiden können; nur der eigentliche Name wird übersetzt.
 */
export function translateCatalogName(raw: string): string {
  // Fall 1: «TESTDATEN Name» → nur den Namen übersetzen, Etikett vorne behalten.
  const prefix = /^TESTDATEN\s+(.*)$/.exec(raw);
  if (prefix) return `TESTDATEN ${tr(prefix[1])}`;
  // Fall 2: «Name (TESTDATEN)» → Etikett hinten behalten.
  const suffix = /^(.*?)\s*\(TESTDATEN\)$/.exec(raw);
  if (suffix) return `${tr(suffix[1])} (TESTDATEN)`;
  // Fall 3: «Name (Zusatz, TESTDATEN)» → beide Teile einzeln übersetzen.
  const inner = /^(.*?)\s*\((.*?),\s*TESTDATEN\)$/.exec(raw);
  if (inner) return `${tr(inner[1])} (${tr(inner[2])}, ${tr('TESTDATEN')})`;
  // Sonst: einfach den ganzen Namen übersetzen.
  return tr(raw);
}

// catalogDisplayName: der hübsche Name für die Anzeige – ganz ohne Etikett.
/**
 * Anzeigename ohne TESTDATEN-Markierung, in der aktuellen Sprache.
 * Empfohlen für neue UI-Stellen statt name.replace(…).
 */
export function catalogDisplayName(raw: string): string {
  // Zuerst alle TESTDATEN-Etiketten abreissen …
  const base = raw
    .replace(/^TESTDATEN\s+/, '')
    .replace(/\s*\(TESTDATEN\)$/, '')
    .replace(/,\s*TESTDATEN\)$/, ')');
  // … dann den ganzen Namen im Wörterbuch suchen.
  const whole = tr(base);
  if (whole !== base) return whole;
  // Kein Eintrag für den ganzen Ausdruck: «Name (Zusatz)» teilweise übersetzen
  const paren = /^(.*?)\s*\((.*)\)$/.exec(base);
  return paren ? `${tr(paren[1])} (${tr(paren[2])})` : whole;
}

// withTranslatedName: Jedes Bauteil bekommt ein Namensschild, das sich selber
// umschreibt, sobald jemand die Sprache wechselt – wie ein Zauber-Schild.
// (Ein «Getter» ist ein Feld, das jedes Mal frisch nachrechnet, wenn man es liest.)
/**
 * Macht das Feld «name» zu einem Getter, der bei jedem Zugriff in der
 * aktuellen Sprache liefert (Sprachwechsel zur Laufzeit). Der deutsche
 * Rohname bleibt unter rawName erreichbar.
 */
function withTranslatedName<T extends { name: string }>(items: readonly T[]): T[] {
  // 🤧 Schnupfspruch: Es Getter-Tüürli, wo sich dreiht,
  //    und scho redt s'Profil, was d'Sprach grad seit.
  return items.map((item) => {
    const rawName = item.name;
    const copy = { ...item } as T & { rawName: string };
    Object.defineProperty(copy, 'rawName', { value: rawName, enumerable: false });
    Object.defineProperty(copy, 'name', {
      get: () => translateCatalogName(rawName),
      enumerable: true,
      configurable: true,
    });
    return copy;
  });
}

// Alle Stahlprofile aus der Lagerliste, mit Namen, die sich selber übersetzen.
export const PROFILES: readonly Profile[] = withTranslatedName(
  fixtures.profiles as unknown as Profile[]
);

// Eine Oberfläche (z. B. pulverbeschichtet) – wie der Anstrich eines Velos.
export interface Finish {
  finishId: string;
  name: string;
  allowedMaterials: string[];
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

// Die Liste aller Oberflächen.
export const FINISHES: readonly Finish[] = withTranslatedName(
  finishesData.finishes as unknown as Finish[]
);

// Ein Werkstoff (Stahl, Edelstahl, Aluminium) – woraus das Teil gemacht ist.
export interface Material {
  materialId: string;
  name: string;
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

// Die Liste aller Werkstoffe.
// 🤧 Schnupfspruch: Stahl, Edelstahl, Aluminium –
//    e Prise Schnupf, und alles isch rund um.
export const MATERIALS: readonly Material[] = withTranslatedName(
  materialsData.materials as unknown as Material[]
);

// getProfile sucht ein einzelnes Profil anhand seiner ID in der Kiste.
export function getProfile(profileId: string): Profile | undefined {
  return PROFILES.find((p) => p.profileId === profileId);
}

// crossSectionLabel beschreibt, wie ein Profil im Querschnitt aussieht –
// als ob man das Rohr durchsägt und auf die Schnittfläche schaut.
/** Lesbare Querschnittsbeschreibung eines Profils. */
export function crossSectionLabel(p: Profile): string {
  const cs = p.crossSection as Record<string, number | string>;
  // Ein kleines Wörterbuch: technischer Formname → schöner Name.
  const shapeNames: Record<string, string> = {
    'round-tube': tr('Rundrohr'),
    'square-tube': tr('Quadratrohr'),
    'rect-tube': tr('Rechteckrohr'),
    'flat-bar': tr('Flachstahl'),
    'square-bar': tr('Vierkantstab'),
    'round-bar': tr('Rundstab'),
    't-profile': tr('T-Stahl'),
  };
  const shape = shapeNames[String(cs.shape)] ?? String(cs.shape);
  // Rund? Dann Durchmesser (Ø). Eckig? Dann Breite × Höhe.
  const masse = cs.diameterMm
    ? `Ø ${cs.diameterMm} mm`
    : `${cs.widthMm ?? '?'} × ${cs.heightMm ?? cs.widthMm ?? '?'} mm`;
  // Bei Rohren sagen wir noch, wie dick die Wand ist.
  const wand = cs.wallThicknessMm
    ? ` · ${tr('Wand {t} mm', { t: cs.wallThicknessMm })}`
    : '';
  return `${shape} ${masse}${wand}`;
}

// profilBreiteMm sagt, wie breit ein Profil ist (Durchmesser oder Breite).
// Das braucht man, um auszurechnen, wie viele Stäbe nebeneinander Platz haben.
/** Breite eines Profils quer zur Laufrichtung in mm (für Stabteilung/3D). */
export function profilBreiteMm(profile: Profile): number {
  const cs = profile.crossSection as {
    diameterMm?: number;
    widthMm?: number;
  };
  return cs.diameterMm ?? cs.widthMm ?? 0;
}
// 🤧 Schnupfspruch: Rundrohr, Flachstahl, Vierkantstab –
//    dr Schnupf isch s'einzig, wo ich nid im Lager hab.
