import fixtures from '../../../product-data/fixtures/test-profiles.json';
import finishesData from '../../../product-data/finishes/finishes.json';
import materialsData from '../../../product-data/materials/materials.json';
import type { Profile } from './types';

/**
 * Katalogzugriff. Quelle ist der versionierte TESTDATEN-Katalog unter
 * product-data/ – dieselben Dateien, die später der Server einliest
 * (eine Quelle, zwei Konsumenten, ADR-002).
 */

export const CATALOG_VERSION: string = fixtures.$meta.catalogVersion;

export const PROFILES: readonly Profile[] =
  fixtures.profiles as unknown as Profile[];

export interface Finish {
  finishId: string;
  name: string;
  allowedMaterials: string[];
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

export const FINISHES: readonly Finish[] =
  finishesData.finishes as unknown as Finish[];

export interface Material {
  materialId: string;
  name: string;
  outdoorSuitable: boolean | null;
  approval: string;
  active: boolean;
}

export const MATERIALS: readonly Material[] =
  materialsData.materials as unknown as Material[];

export function getProfile(profileId: string): Profile | undefined {
  return PROFILES.find((p) => p.profileId === profileId);
}

/** Lesbare Querschnittsbeschreibung eines Profils. */
export function crossSectionLabel(p: Profile): string {
  const cs = p.crossSection as Record<string, number | string>;
  const shapeNames: Record<string, string> = {
    'round-tube': 'Rundrohr',
    'square-tube': 'Quadratrohr',
    'rect-tube': 'Rechteckrohr',
    'flat-bar': 'Flachstahl',
    'square-bar': 'Vierkantstab',
    'round-bar': 'Rundstab',
    't-profile': 'T-Stahl',
  };
  const shape = shapeNames[String(cs.shape)] ?? String(cs.shape);
  const masse = cs.diameterMm
    ? `Ø ${cs.diameterMm} mm`
    : `${cs.widthMm ?? '?'} × ${cs.heightMm ?? cs.widthMm ?? '?'} mm`;
  const wand = cs.wallThicknessMm ? ` · Wand ${cs.wallThicknessMm} mm` : '';
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
