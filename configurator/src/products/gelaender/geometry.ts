import type { GelaenderDerived, GelaenderInputs } from './types';
import type { Profile } from '../types';

/**
 * Geometriemodell des Geländers.
 *
 * Reine Ableitung aus Eingaben + abgeleiteten Werten + Profilquerschnitten.
 * Die 3D-Szene (und der 2D-Fallback) rendern ausschliesslich dieses Modell
 * und verwalten keine Geschäftsdaten (verbindliche Ebenentrennung).
 * Alle Koordinaten in Metern; X = Segment 1, Z = Segment 2 (L-Form).
 */

export interface ProfileShape {
  kind: 'round' | 'box';
  /** Durchmesser (round) in m. */
  dM?: number;
  /** Breite/Tiefe (box) in m. */
  wM?: number;
  hM?: number;
}

export interface GeoPost {
  x: number;
  z: number;
  heightM: number;
  shape: ProfileShape;
}

export interface GeoRail {
  start: [number, number, number];
  end: [number, number, number];
  shape: ProfileShape;
}

export interface GeoBar {
  x: number;
  z: number;
  yM: number;
  heightM: number;
  shape: ProfileShape;
}

export interface GeoDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

export interface RailingGeometry {
  posts: GeoPost[];
  rails: GeoRail[];
  bars: GeoBar[];
  dimensions: GeoDimension[];
  /** Für Kamera-Framing. */
  bounds: { maxX: number; minZ: number; maxZ: number; heightM: number };
}

export function shapeFromProfile(profile: Profile | undefined): ProfileShape {
  if (!profile) return { kind: 'round', dM: 0.04 };
  const cs = profile.crossSection as {
    shape?: string;
    diameterMm?: number;
    widthMm?: number;
    heightMm?: number;
  };
  if (cs.diameterMm) {
    return { kind: 'round', dM: cs.diameterMm / 1000 };
  }
  return {
    kind: 'box',
    wM: (cs.widthMm ?? 40) / 1000,
    hM: (cs.heightMm ?? cs.widthMm ?? 40) / 1000,
  };
}

interface RunDef {
  origin: [number, number];
  dir: [number, number];
  lengthM: number;
}

/** Läufe (Segmente) in der Bodenebene. */
function runs(inputs: GelaenderInputs): RunDef[] {
  const seg = inputs.segmentLaengenMm.map((l) => l / 1000);
  if (seg.length === 0) return [];
  const result: RunDef[] = [
    { origin: [0, 0], dir: [1, 0], lengthM: seg[0] },
  ];
  if (seg.length > 1 && inputs.variante && inputs.variante !== 'i') {
    // L-Form: zweiter Lauf ab dem Ende von Segment 1, rechtwinklig.
    const zDir = inputs.variante === 'l-innen' ? 1 : -1;
    result.push({ origin: [seg[0], 0], dir: [0, zDir], lengthM: seg[1] });
  }
  return result;
}

export function buildRailingGeometry(
  inputs: GelaenderInputs,
  derived: GelaenderDerived,
  profiles: {
    pfosten?: Profile;
    handlauf?: Profile;
    fuellstab?: Profile;
  }
): RailingGeometry {
  const heightM = (inputs.hoeheMm ?? 1000) / 1000;
  const postShape = shapeFromProfile(profiles.pfosten);
  const railShape = shapeFromProfile(profiles.handlauf);
  const barShape = shapeFromProfile(profiles.fuellstab);

  const posts: GeoPost[] = [];
  const rails: GeoRail[] = [];
  const bars: GeoBar[] = [];
  const dimensions: GeoDimension[] = [];

  const runDefs = runs(inputs);

  runDefs.forEach((run, runIndex) => {
    const nPosts = derived.pfostenProSegment[runIndex] ?? 2;
    const spacing = nPosts > 1 ? run.lengthM / (nPosts - 1) : run.lengthM;

    for (let p = 0; p < nPosts; p++) {
      // Eckpfosten nicht doppelt setzen (wird vom ersten Lauf gestellt).
      if (runIndex > 0 && p === 0) continue;
      posts.push({
        x: run.origin[0] + run.dir[0] * spacing * p,
        z: run.origin[1] + run.dir[1] * spacing * p,
        heightM,
        shape: postShape,
      });
    }

    // Handlauf über die volle Lauflänge.
    rails.push({
      start: [run.origin[0], heightM, run.origin[1]],
      end: [
        run.origin[0] + run.dir[0] * run.lengthM,
        heightM,
        run.origin[1] + run.dir[1] * run.lengthM,
      ],
      shape: railShape,
    });

    // Füllstäbe: symmetrisch je Feld zwischen den Pfosten.
    const felder = Math.max(1, nPosts - 1);
    const staebeProFeld =
      felder > 0
        ? Math.round((derived.fuellstaebeProSegment[runIndex] ?? 0) / felder)
        : 0;
    const barBottomM = 0.05; // Bodenabstand nur visuell (TESTDATEN)
    for (let f = 0; f < felder; f++) {
      for (let s = 1; s <= staebeProFeld; s++) {
        const t = (f + s / (staebeProFeld + 1)) * spacing;
        bars.push({
          x: run.origin[0] + run.dir[0] * t,
          z: run.origin[1] + run.dir[1] * t,
          yM: barBottomM,
          heightM: heightM - barBottomM - (railShape.dM ?? railShape.hM ?? 0.04),
          shape: barShape,
        });
      }
    }

    // Masslinie parallel zum Lauf, nach aussen versetzt.
    const offset = 0.35;
    const ox = run.dir[1] * offset; // Normale in der Bodenebene
    const oz = -run.dir[0] * offset;
    dimensions.push({
      start: [run.origin[0] - ox, 0.02, run.origin[1] - oz],
      end: [
        run.origin[0] + run.dir[0] * run.lengthM - ox,
        0.02,
        run.origin[1] + run.dir[1] * run.lengthM - oz,
      ],
      label: `${Math.round(run.lengthM * 1000)} mm`,
    });
  });

  // Höhen-Masslinie am ersten Pfosten.
  if (runDefs.length > 0 && inputs.hoeheMm) {
    dimensions.push({
      start: [-0.25, 0, 0],
      end: [-0.25, heightM, 0],
      label: `${inputs.hoeheMm} mm`,
    });
  }

  const xs = posts.map((p) => p.x);
  const zs = posts.map((p) => p.z);
  return {
    posts,
    rails,
    bars,
    dimensions,
    bounds: {
      maxX: xs.length ? Math.max(...xs) : 1,
      minZ: zs.length ? Math.min(...zs) : 0,
      maxZ: zs.length ? Math.max(...zs) : 0,
      heightM,
    },
  };
}
