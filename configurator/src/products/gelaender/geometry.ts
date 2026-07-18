import type { GelaenderDerived, GelaenderInputs } from './types';
import type { Profile } from '../types';
import { GELAENDER_RULES_V0 } from '../../rules/gelaender-rules';
import { obergurtHoeheEff } from './types';

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
  /** Fusspunkt (0 = Bodenniveau; negativ bei seitlicher/eingelassener Montage). */
  yBaseM: number;
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

/** Darstellungsart einer Flächenfüllung. */
export type PanelFill =
  | 'glas-klar'
  | 'glas-satiniert'
  | 'blech-voll'
  | 'blech-loch'
  | 'blech-laser'
  | 'gitter-streckmetall'
  | 'gitter-drahtgitter';

/** Flächenfüllung (Feld zwischen zwei Pfosten): Glas, Blech oder Gitter. */
export interface GeoPanel {
  center: [number, number, number];
  tM: number;
  /** Breite entlang des Laufs in m. */
  widthM: number;
  heightM: number;
  /** Rotation um Y (Laufrichtung). */
  rotY: number;
  fill: PanelFill;
  /** Laserschnitt-Motiv (nur bei fill 'blech-laser'). */
  motiv?: 'schlitze' | 'kreise' | 'quadrate' | 'floral';
}

/** Fussplatte, seitliches Schwert oder Kragarm am Pfosten. */
export interface GeoPlate {
  center: [number, number, number];
  /** [entlang Lauf, Höhe, quer zum Lauf] in m. */
  sizeM: [number, number, number];
  rotY: number;
  /** Steuert die Anker-Darstellung in der Szene. */
  kind: 'fussplatte' | 'schwert' | 'kragarm' | 'wandlasche';
}

/** Schmiedeornament (Grundauswahl der Charakter-Familie). */
export interface GeoOrnament {
  kind: 'ringe' | 'voluten' | 'koerbe';
  center: [number, number, number];
  tM: number;
  rotY: number;
  /** Verfügbare Breite/Höhe für das Element in m. */
  sizeM: number;
}

/** Baukörper-Andeutung je Lauf – Darstellung folgt dem Untergrund. */
export interface GeoSlab {
  center: [number, number, number];
  sizeM: [number, number, number];
  rotY: number;
  kind: 'beton' | 'holz' | 'stahl' | 'unbekannt';
}

export type EndCap = 'gerade' | 'kugel-drittel' | 'kugel' | 'endbogen';

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
  plates: GeoPlate[];
  slabs: GeoSlab[];
  ornaments: GeoOrnament[];
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
    untergurt?: Profile;
  }
): RailingGeometry {
  const heightM = (inputs.hoeheMm ?? 1000) / 1000;
  const postShape = shapeFromProfile(profiles.pfosten);
  // Wunschmasse (Sonderprofile, prüfpflichtig) überschreiben die Vorschau.
  const railShape: ProfileShape = inputs.handlaufWunschDm
    ? { kind: 'round', dM: inputs.handlaufWunschDm / 1000 }
    : shapeFromProfile(profiles.handlauf);
  const barShape: ProfileShape = inputs.fuellstabWunschDm
    ? { kind: 'round', dM: inputs.fuellstabWunschDm / 1000 }
    : shapeFromProfile(profiles.fuellstab);
  const crossShape = shapeFromProfile(profiles.querstab ?? profiles.fuellstab);
  const gurtShape: ProfileShape = profiles.untergurt
    ? shapeFromProfile(profiles.untergurt)
    : { kind: 'box', wM: 0.03, hM: 0.008 };
  const railThickness = railShape.dM ?? railShape.hM ?? 0.04;
  const mitHandlauf = !inputs.ohneHandlauf;
  const mitUntergurt = derived.untergurtLaengenMm.length > 0;
  const gurtDicke = gurtShape.dM ?? gurtShape.hM ?? 0.02;
  /** Achshöhe des Untergurts bzw. Bodenfreiheit der Füllung. */
  const bottomM =
    (mitUntergurt
      ? inputs.untergurtHoeheMm
      : GELAENDER_RULES_V0.bodenfreiheitMm) / 1000;
  /** Unterkante der Füllung (über Untergurt, falls vorhanden). */
  const fillBottomM = mitUntergurt ? bottomM + gurtDicke / 2 : bottomM;
  /**
   * Handlauf-Achse: aufgesetzt = oberhalb der Pfostenoberkante,
   * zwischen = bündig unterhalb der Oberkante.
   */
  const railAxisM =
    inputs.handlaufPosition === 'zwischen'
      ? heightM - railThickness / 2
      : heightM + railThickness / 2;
  /** Oberkante der Füllzone. */
  const obergurtEffMm = obergurtHoeheEff(inputs);
  const obergurtM =
    derived.obergurtLaengenMm.length && obergurtEffMm !== null
      ? obergurtEffMm / 1000
      : null;
  const fillTopM =
    obergurtM !== null
      ? obergurtM - gurtDicke / 2
      : mitHandlauf
        ? railAxisM - railThickness / 2
        : heightM;

  // Pfostenverlängerung/Sockel je Befestigungsart (rein darstellend).
  const postBaseM =
    inputs.montageart === 'seite'
      ? -(inputs.schwertHoeheMm / 1000) * 0.85
      : inputs.montageart === 'unten'
        ? -0.22 - inputs.kragarmStaerkeMm / 1000
        : inputs.montageart === 'eingelassen'
          ? -(inputs.einlassTiefeMm / 1000)
          : 0;

  const posts: GeoPost[] = [];
  const rails: GeoRail[] = [];
  const bars: GeoBar[] = [];
  const panels: GeoPanel[] = [];
  const endCaps: GeoEndCap[] = [];
  const plates: GeoPlate[] = [];
  const slabs: GeoSlab[] = [];
  const ornaments: GeoOrnament[] = [];
  const dimensions: GeoDimension[] = [];

  const panelFill: PanelFill | null =
    inputs.fuellungsart === 'glas'
      ? inputs.glasTyp === 'satiniert'
        ? 'glas-satiniert'
        : 'glas-klar'
      : inputs.fuellungsart === 'blech'
        ? (`blech-${inputs.blechTyp ?? 'voll'}` as PanelFill)
        : inputs.fuellungsart === 'gitter'
          ? (`gitter-${inputs.gitterTyp ?? 'streckmetall'}` as PanelFill)
          : null;

  const runDefs = runsFromInputs(inputs);

  let baseT = 0;
  runDefs.forEach((run, runIndex) => {
    const nPosts = derived.pfostenProSegment[runIndex] ?? 2;
    const spacing = nPosts > 1 ? run.lengthM / (nPosts - 1) : run.lengthM;
    const at = (t: number): [number, number] => [
      run.origin[0] + run.dir[0] * t,
      run.origin[1] + run.dir[1] * t,
    ];

    // Normale in der Bodenebene: -n = Masslinien-/Aussenseite, +n = innen.
    const n: [number, number] = [run.dir[1], -run.dir[0]];
    const rotY = Math.atan2(run.dir[0], run.dir[1]) - Math.PI / 2;
    const postW = postShape.dM ?? postShape.wM ?? 0.04;

    for (let p = 0; p < nPosts; p++) {
      // Eckpfosten nicht doppelt setzen (stellt der vorherige Lauf).
      if (runIndex > 0 && p === 0) continue;
      const [x, z] = at(spacing * p);
      posts.push({
        x,
        z,
        tM: baseT + spacing * p,
        yBaseM: postBaseM,
        heightM: heightM - postBaseM,
        shape: postShape,
      });

      // Befestigungsdetails am Pfostenfuss (Wunschmasse, prüfpflichtig).
      if (inputs.montageart === 'boden') {
        const fpL = inputs.fussplatteLaengeMm / 1000;
        const fpB = inputs.fussplatteBreiteMm / 1000;
        const fpD = inputs.fussplatteDickeMm / 1000;
        plates.push({
          center: [x, fpD / 2, z],
          sizeM: [fpL, fpD, fpB],
          rotY,
          kind: 'fussplatte',
        });
      } else if (inputs.montageart === 'seite') {
        const swH = inputs.schwertHoeheMm / 1000;
        const swB = inputs.schwertBreiteMm / 1000;
        const swD = inputs.schwertDickeMm / 1000;
        plates.push({
          center: [
            x - n[0] * (postW / 2 + swD / 2 + 0.001),
            -swH / 2,
            z - n[1] * (postW / 2 + swD / 2 + 0.001),
          ],
          sizeM: [swB, swH, swD],
          rotY,
          kind: 'schwert',
        });
      } else if (inputs.montageart === 'unten') {
        // Kragarm: horizontaler Arm unter der Platte nach innen.
        const kaL = inputs.kragarmLaengeMm / 1000;
        const kaS = inputs.kragarmStaerkeMm / 1000;
        plates.push({
          center: [x + n[0] * (kaL / 2), -0.22 - kaS / 2, z + n[1] * (kaL / 2)],
          sizeM: [kaS, kaS, kaL],
          rotY,
          kind: 'kragarm',
        });
      }
    }

    // Wandmontage: Laschen an beiden freien Enden (Handlauf/Untergurt).
    if (inputs.montageart === 'wand') {
      const wlH = inputs.wandlascheHoeheMm / 1000;
      const wlB = inputs.wandlascheBreiteMm / 1000;
      const wlD = inputs.wandlascheDickeMm / 1000;
      const hoehen = [mitHandlauf ? railAxisM : heightM - 0.02];
      if (mitUntergurt) hoehen.push(bottomM);
      const lascheAn = (px: number, pz: number) => {
        for (const py of hoehen) {
          plates.push({
            center: [px, py, pz],
            sizeM: [wlD, wlH, wlB],
            rotY,
            kind: 'wandlasche',
          });
        }
      };
      if (runIndex === 0) {
        const [px, pz] = at(-0.001);
        lascheAn(px, pz);
      }
      if (runIndex === runDefs.length - 1) {
        const [px, pz] = at(run.lengthM + 0.001);
        lascheAn(px, pz);
      }
    }

    // Baukörper-Andeutung (nicht bei Wandmontage), Art folgt Untergrund.
    if (inputs.montageart && inputs.montageart !== 'wand') {
      const kind = inputs.untergrund ?? 'beton';
      const dicke = kind === 'stahl' ? 0.12 : kind === 'holz' ? 0.16 : 0.22;
      const breite = kind === 'stahl' ? 0.18 : 0.8;
      const [mx, mz] = at(run.lengthM / 2);
      const innenOffset =
        inputs.montageart === 'seite' || inputs.montageart === 'unten'
          ? breite / 2 + postW / 2
          : kind === 'stahl'
            ? 0
            : 0.32;
      slabs.push({
        center: [mx + n[0] * innenOffset, -dicke / 2, mz + n[1] * innenOffset],
        sizeM: [run.lengthM + 0.4, dicke, breite],
        rotY,
        kind,
      });
    }

    const [sx0, sz0] = at(0);
    const [ex0, ez0] = at(run.lengthM);
    const gurt = (yM: number, shape: ProfileShape) =>
      rails.push({
        start: [sx0, yM, sz0],
        end: [ex0, yM, ez0],
        tRangeM: [baseT, baseT + run.lengthM],
        shape,
      });

    if (mitHandlauf) gurt(railAxisM, railShape);
    if (mitUntergurt) gurt(bottomM, gurtShape);
    if (obergurtM !== null) gurt(obergurtM, gurtShape);
    if (derived.knieleisteLaengenMm.length && inputs.knieleisteHoeheMm) {
      gurt(inputs.knieleisteHoeheMm / 1000, gurtShape);
    }

    const felder = Math.max(1, nPosts - 1);

    const mitStaeben =
      inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet';

    if (mitStaeben) {
      const staebeProFeld =
        felder > 0
          ? Math.round((derived.fuellstaebeProSegment[runIndex] ?? 0) / felder)
          : 0;
      for (let f = 0; f < felder; f++) {
        for (let s = 1; s <= staebeProFeld; s++) {
          const t = (f + s / (staebeProFeld + 1)) * spacing;
          const [x, z] = at(t);
          bars.push({
            x,
            z,
            tM: baseT + t,
            yM: fillBottomM,
            heightM: fillTopM - fillBottomM,
            shape: barShape,
          });
        }

        // Charakter-Familie: Ornamente gemäss Grundeinstellungen.
        if (
          inputs.fuellungsart === 'geschmiedet' &&
          inputs.ornamentTyp &&
          (inputs.ornamentDichte === 'alle' || f % 2 === 0)
        ) {
          const tMid = (f + 0.5) * spacing;
          const [ox, oz] = at(tMid);
          const gapM = spacing / (staebeProFeld + 1);
          const zone = fillTopM - fillBottomM;
          const groesseFaktor =
            inputs.ornamentGroesse === 'klein'
              ? 0.32
              : inputs.ornamentGroesse === 'gross'
                ? 0.72
                : 0.5;
          const sizeM = Math.min(gapM * 2.2, zone * groesseFaktor);
          const lageY =
            inputs.ornamentLage === 'oben'
              ? fillTopM - sizeM / 2 - 0.02
              : inputs.ornamentLage === 'unten'
                ? fillBottomM + sizeM / 2 + 0.02
                : fillBottomM + zone / 2;
          const yOffsets = inputs.ornamentDoppelt
            ? [lageY - sizeM * 0.55, lageY + sizeM * 0.55]
            : [lageY];
          for (const y of yOffsets) {
            ornaments.push({
              kind: inputs.ornamentTyp,
              center: [ox, y, oz],
              tM: baseT + tMid,
              rotY,
              sizeM,
            });
          }
        }
      }
    }

    if (inputs.fuellungsart === 'querstab' && derived.querstabLagen > 0) {
      const oben = mitHandlauf ? railAxisM - railThickness / 2 : heightM;
      const frei = oben - bottomM;
      for (let lage = 1; lage <= derived.querstabLagen; lage++) {
        gurt(bottomM + (frei * lage) / (derived.querstabLagen + 1), crossShape);
      }
    }

    if (panelFill) {
      const panelH = fillTopM - fillBottomM;
      for (let f = 0; f < felder; f++) {
        const tPanel = (f + 0.5) * spacing;
        const [cx, cz] = at(tPanel);
        panels.push({
          center: [cx, fillBottomM + panelH / 2, cz],
          tM: baseT + tPanel,
          widthM: Math.max(0.1, spacing - postW - 0.04),
          heightM: panelH,
          rotY,
          fill: panelFill,
          motiv:
            panelFill === 'blech-laser'
              ? (inputs.laserMotiv ?? 'schlitze')
              : undefined,
        });
      }
    }

    // Handlauf-Abschlüsse nur an den freien Enden des Polygonzugs.
    if (mitHandlauf && inputs.handlaufAbschluss) {
      const kind = inputs.handlaufAbschluss;
      if (runIndex === 0) {
        const [x, z] = at(0);
        endCaps.push({
          position: [x, railAxisM, z],
          dir: [-run.dir[0], -run.dir[1]],
          kind,
          shape: railShape,
        });
      }
      if (runIndex === runDefs.length - 1) {
        const [x, z] = at(run.lengthM);
        endCaps.push({
          position: [x, railAxisM, z],
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
    plates,
    slabs,
    ornaments,
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
