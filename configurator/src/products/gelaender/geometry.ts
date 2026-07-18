import type { GelaenderDerived, GelaenderInputs } from './types';
import type { Profile } from '../types';
import { GELAENDER_RULES_V0 } from '../../rules/gelaender-rules';

/**
 * Geometriemodell des Geländers.
 *
 * Reine Ableitung aus Eingaben + abgeleiteten Werten + Profilquerschnitten.
 * Die 3D-Szene (und der 2D-Fallback) rendern ausschliesslich dieses Modell
 * und verwalten keine Geschäftsdaten (verbindliche Ebenentrennung).
 * Alle Koordinaten in Metern.
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
  /** Abgewickelte Position entlang des Geländerpfads in m (für 2D). */
  tM: number;
  heightM: number;
  shape: ProfileShape;
}

export interface GeoRail {
  start: [number, number, number];
  end: [number, number, number];
  /** Abgewickelter Bereich entlang des Pfads in m (für 2D). */
  tRangeM: [number, number];
  shape: ProfileShape;
}

export interface GeoBar {
  x: number;
  z: number;
  tM: number;
  yM: number;
  heightM: number;
  shape: ProfileShape;
}

/** Glasscheibe (Feld zwischen zwei Pfosten). */
export interface GeoPanel {
  center: [number, number, number];
  tM: number;
  /** Breite entlang des Laufs in m. */
  widthM: number;
  heightM: number;
  /** Rotation um Y (Laufrichtung). */
  rotY: number;
  frosted: boolean;
}

export type EndCap = 'gerade' | 'kugel' | 'endbogen';

export interface GeoEndCap {
  position: [number, number, number];
  /** Laufrichtung am Ende (für Endbogen). */
  dir: [number, number];
  kind: EndCap;
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
  panels: GeoPanel[];
  endCaps: GeoEndCap[];
  dimensions: GeoDimension[];
  /** Für Kamera-Framing. */
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    heightM: number;
  };
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

/** 90°-Drehungen je Grundform (+1 = links, -1 = rechts), Start entlang +X. */
const TURNS: Record<string, number[]> = {
  i: [],
  'l-innen': [1],
  'l-aussen': [-1],
  'u-innen': [1, 1],
  'u-aussen': [-1, -1],
};

/** Läufe (Segmente) als Polygonzug in der Bodenebene. */
export function runsFromInputs(inputs: GelaenderInputs): RunDef[] {
  const seg = inputs.segmentLaengenMm.map((l) => l / 1000).filter((l) => l > 0);
  if (seg.length === 0) return [];
  const turns = TURNS[inputs.variante ?? 'i'] ?? [];
  const result: RunDef[] = [];
  let pos: [number, number] = [0, 0];
  let dir: [number, number] = [1, 0];
  seg.forEach((lengthM, i) => {
    if (i > 0) {
      const turn = turns[i - 1] ?? 0;
      // Drehung um ±90° in der Bodenebene (x,z).
      dir = turn >= 0 ? [dir[1], -dir[0]] : [-dir[1], dir[0]];
    }
    result.push({ origin: [...pos], dir: [...dir], lengthM });
    pos = [pos[0] + dir[0] * lengthM, pos[1] + dir[1] * lengthM];
  });
  return result;
}

export function buildRailingGeometry(
  inputs: GelaenderInputs,
  derived: GelaenderDerived,
  profiles: {
    pfosten?: Profile;
    handlauf?: Profile;
    fuellstab?: Profile;
    querstab?: Profile;
  }
): RailingGeometry {
  const heightM = (inputs.hoeheMm ?? 1000) / 1000;
  const postShape = shapeFromProfile(profiles.pfosten);
  const railShape = shapeFromProfile(profiles.handlauf);
  const barShape = shapeFromProfile(profiles.fuellstab);
  const crossShape = shapeFromProfile(profiles.querstab ?? profiles.fuellstab);
  const railThickness = railShape.dM ?? railShape.hM ?? 0.04;
  const bottomM = GELAENDER_RULES_V0.bodenfreiheitMm / 1000;
  const mitHandlauf = !inputs.ohneHandlauf;

  const posts: GeoPost[] = [];
  const rails: GeoRail[] = [];
  const bars: GeoBar[] = [];
  const panels: GeoPanel[] = [];
  const endCaps: GeoEndCap[] = [];
  const dimensions: GeoDimension[] = [];

  const runDefs = runsFromInputs(inputs);

  let baseT = 0;
  runDefs.forEach((run, runIndex) => {
    const nPosts = derived.pfostenProSegment[runIndex] ?? 2;
    const spacing = nPosts > 1 ? run.lengthM / (nPosts - 1) : run.lengthM;
    const at = (t: number): [number, number] => [
      run.origin[0] + run.dir[0] * t,
      run.origin[1] + run.dir[1] * t,
    ];

    for (let p = 0; p < nPosts; p++) {
      // Eckpfosten nicht doppelt setzen (stellt der vorherige Lauf).
      if (runIndex > 0 && p === 0) continue;
      const [x, z] = at(spacing * p);
      posts.push({ x, z, tM: baseT + spacing * p, heightM, shape: postShape });
    }

    if (mitHandlauf) {
      const [sx, sz] = at(0);
      const [ex, ez] = at(run.lengthM);
      rails.push({
        start: [sx, heightM, sz],
        end: [ex, heightM, ez],
        tRangeM: [baseT, baseT + run.lengthM],
        shape: railShape,
      });
    }

    const felder = Math.max(1, nPosts - 1);

    if (inputs.fuellungsart === 'staketen') {
      const staebeProFeld =
        felder > 0
          ? Math.round((derived.fuellstaebeProSegment[runIndex] ?? 0) / felder)
          : 0;
      const barTop = mitHandlauf ? heightM - railThickness : heightM;
      for (let f = 0; f < felder; f++) {
        for (let s = 1; s <= staebeProFeld; s++) {
          const t = (f + s / (staebeProFeld + 1)) * spacing;
          const [x, z] = at(t);
          bars.push({
            x,
            z,
            tM: baseT + t,
            yM: bottomM,
            heightM: barTop - bottomM,
            shape: barShape,
          });
        }
      }
    }

    if (inputs.fuellungsart === 'querstab' && derived.querstabLagen > 0) {
      const oben = mitHandlauf ? heightM - railThickness : heightM;
      const frei = oben - bottomM;
      for (let lage = 1; lage <= derived.querstabLagen; lage++) {
        const y = bottomM + (frei * lage) / (derived.querstabLagen + 1);
        const [sx, sz] = at(0);
        const [ex, ez] = at(run.lengthM);
        rails.push({
          start: [sx, y, sz],
          end: [ex, y, ez],
          tRangeM: [baseT, baseT + run.lengthM],
          shape: crossShape,
        });
      }
    }

    if (inputs.fuellungsart === 'glas') {
      const postW = postShape.dM ?? postShape.wM ?? 0.04;
      const oben = mitHandlauf ? heightM - railThickness : heightM;
      const panelH = oben - bottomM;
      const rotY = Math.atan2(run.dir[0], run.dir[1]) - Math.PI / 2;
      for (let f = 0; f < felder; f++) {
        const tPanel = (f + 0.5) * spacing;
        const [cx, cz] = at(tPanel);
        panels.push({
          center: [cx, bottomM + panelH / 2, cz],
          tM: baseT + tPanel,
          widthM: Math.max(0.1, spacing - postW - 0.04),
          heightM: panelH,
          rotY,
          frosted: inputs.glasTyp === 'satiniert',
        });
      }
    }

    // Handlauf-Abschlüsse nur an den freien Enden des Polygonzugs.
    if (mitHandlauf && inputs.handlaufAbschluss) {
      const kind = inputs.handlaufAbschluss;
      if (runIndex === 0) {
        const [x, z] = at(0);
        endCaps.push({
          position: [x, heightM, z],
          dir: [-run.dir[0], -run.dir[1]],
          kind,
          shape: railShape,
        });
      }
      if (runIndex === runDefs.length - 1) {
        const [x, z] = at(run.lengthM);
        endCaps.push({
          position: [x, heightM, z],
          dir: [run.dir[0], run.dir[1]],
          kind,
          shape: railShape,
        });
      }
    }

    // Masslinie parallel zum Lauf, nach aussen versetzt.
    const offset = 0.35;
    const ox = run.dir[1] * offset;
    const oz = -run.dir[0] * offset;
    const [sx, sz] = at(0);
    const [ex, ez] = at(run.lengthM);
    dimensions.push({
      start: [sx - ox, 0.02, sz - oz],
      end: [ex - ox, 0.02, ez - oz],
      label: `${Math.round(run.lengthM * 1000)} mm`,
    });

    baseT += run.lengthM;
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
    panels,
    endCaps,
    dimensions,
    bounds: {
      minX: xs.length ? Math.min(...xs) : 0,
      maxX: xs.length ? Math.max(...xs) : 1,
      minZ: zs.length ? Math.min(...zs) : 0,
      maxZ: zs.length ? Math.max(...zs) : 0,
      heightM,
    },
  };
}
