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

export const CATALOG_VERSION: string = fixtures.$meta.catalogVersion;

/**
 * Übersetzt einen Katalognamen aus product-data/ (JSON bleibt deutsch).
 * Die TESTDATEN-Markierung bleibt in den Formen «TESTDATEN …» und
 * «… (TESTDATEN)» unverändert erhalten, damit die Module sie wie bisher
 * abschneiden können; nur der eigentliche Name wird übersetzt.
 */
export function translateCatalogName(raw: string): string {
  const prefix = /^TESTDATEN\s+(.*)$/.exec(raw);
  if (prefix) return `TESTDATEN ${tr(prefix[1])}`;
  const suffix = /^(.*?)\s*\(TESTDATEN\)$/.exec(raw);
  if (suffix) return `${tr(suffix[1])} (TESTDATEN)`;
  const inner = /^(.*?)\s*\((.*?),\s*TESTDATEN\)$/.exec(raw);
  if (inner) return `${tr(inner[1])} (${tr(inner[2])}, ${tr('TESTDATEN')})`;
  return tr(raw);
}

/**
 * Anzeigename ohne TESTDATEN-Markierung, in der aktuellen Sprache.
 * Empfohlen für neue UI-Stellen statt name.replace(…).
 */
export function catalogDisplayName(raw: string): string {
  const base = raw
    .replace(/^TESTDATEN\s+/, '')
    .replace(/\s*\(TESTDATEN\)$/, '')
    .replace(/,\s*TESTDATEN\)$/, ')');
  const whole = tr(base);
  if (whole !== base) return whole;
  // Kein Eintrag für den ganzen Ausdruck: «Name (Zusatz)» teilweise übersetzen
  const paren = /^(.*?)\s*\((.*)\)$/.exec(base);
  return paren ? `${tr(paren[1])} (${tr(paren[2])})` : whole;
}

/**
 * Macht das Feld «name» zu einem Getter, der bei jedem Zugriff in der
 * aktuellen Sprache liefert (Sprachwechsel zur Laufzeit). Der deutsche
 * Rohname bleibt unter rawName erreichbar.
 */
function withTranslatedName<T extends { name: string }>(items: readonly T[]): T[] {
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

export const PROFILES: readonly Profile[] = withTranslatedName(
  fixtures.profiles as unknown as Profile[]
);

export interface Finish {
  finishId: string;
  name: string;
  allowedMaterials: string[];
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

export const FINISHES: readonly Finish[] = withTranslatedName(
  finishesData.finishes as unknown as Finish[]
);

export interface Material {
  materialId: string;
  name: string;
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

export const MATERIALS: readonly Material[] = withTranslatedName(
  materialsData.materials as unknown as Material[]
);

export function getProfile(profileId: string): Profile | undefined {
  return PROFILES.find((p) => p.profileId === profileId);
}

/** Lesbare Querschnittsbeschreibung eines Profils. */
export function crossSectionLabel(p: Profile): string {
  const cs = p.crossSection as Record<string, number | string>;
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
  const masse = cs.diameterMm
    ? `Ø ${cs.diameterMm} mm`
    : `${cs.widthMm ?? '?'} × ${cs.heightMm ?? cs.widthMm ?? '?'} mm`;
  const wand = cs.wallThicknessMm
    ? ` · ${tr('Wand {t} mm', { t: cs.wallThicknessMm })}`
    : '';
  return `${shape} ${masse}${wand}`;
}

/** Breite eines Profils quer zur Laufrichtung in mm (für Stabteilung/3D). */
export function profilBreiteMm(profile: Profile): number {
  const cs = profile.crossSection as {
    diameterMm?: number;
    widthMm?: number;
  };
  return cs.diameterMm ?? cs.widthMm ?? 0;
}
