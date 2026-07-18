import type { FenstergitterDerived, FenstergitterInputs } from './types';
import type { Profile } from '../types';
import { shapeFromProfile, type ProfileShape } from '../gelaender/geometry';
import { FENSTERGITTER_RULES_V0 } from '../../rules/fenstergitter-rules';

/**
 * Geometriemodell Fenstergitter – inkl. Wandkontext mit Fensteröffnung,
 * damit Leibungs- und Vorwandmontage sichtbar unterscheidbar sind.
 * Reine Ableitung; die Szene rendert nur dieses Modell. Masse in Metern.
 * Fensterbankhöhe ist rein visueller Kontext.
 */

export const SILL_HEIGHT_M = 0.9;

export interface GitterStab {
  x: number;
  yM: number;
  heightM: number;
  shape: ProfileShape;
}

export interface GitterGurt {
  y: number;
  x1: number;
  x2: number;
  shape: ProfileShape;
}

export interface GitterLasche {
  center: [number, number, number];
  sizeM: [number, number, number];
}

export interface GitterOrnament {
  kind: 'ringe' | 'voluten' | 'koerbe';
  center: [number, number, number];
  sizeM: number;
}

export interface GitterDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

export interface FenstergitterGeometry {
  /** Fensteröffnung (Lichtmass) in m. */
  openingW: number;
  openingH: number;
  /** Gitter-Aussenmass in m. */
  frameW: number;
  frameH: number;
  /** Z-Ebene der Gittermitte (Wandaussenkante = 0, +z = vor der Wand). */
  gitterZ: number;
  wall: { width: number; height: number; thickness: number };
  frameShape: ProfileShape;
  stäbe: GitterStab[];
  gurte: GitterGurt[];
  laschen: GitterLasche[];
  ornaments: GitterOrnament[];
  dimensions: GitterDimension[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; heightM: number };
}

export function buildGitterGeometry(
  inputs: FenstergitterInputs,
  derived: FenstergitterDerived,
  profiles: { rahmen?: Profile; stab?: Profile }
): FenstergitterGeometry {
  const params = FENSTERGITTER_RULES_V0;
  const frameW = derived.rahmenBreiteMm / 1000;
  const frameH = derived.rahmenHoeheMm / 1000;

  // Fensteröffnung (Lichtmass) für den Wandkontext.
  let openingW: number;
  let openingH: number;
  if (inputs.masstyp === 'lichtmass') {
    openingW = (inputs.breiteMm ?? 0) / 1000;
    openingH = (inputs.hoeheMm ?? 0) / 1000;
  } else if (inputs.montage === 'vorwand') {
    openingW = frameW - (2 * params.vorwandUeberstandMm) / 1000;
    openingH = frameH - (2 * params.vorwandUeberstandMm) / 1000;
  } else {
    openingW = frameW + (2 * params.leibungSpielMm) / 1000;
    openingH = frameH + (2 * params.leibungSpielMm) / 1000;
  }
  openingW = Math.max(openingW, 0.2);
  openingH = Math.max(openingH, 0.2);

  const frameShape = shapeFromProfile(profiles.rahmen);
  const stabShape: ProfileShape = inputs.stabWunschDm
    ? { kind: 'round', dM: inputs.stabWunschDm / 1000 }
    : shapeFromProfile(profiles.stab);
  const frameT = frameShape.hM ?? frameShape.dM ?? 0.03;

  const wall = {
    width: openingW + 1.6,
    height: SILL_HEIGHT_M + openingH + 0.55,
    thickness: 0.15,
  };

  // Gitterebene: in der Leibung versenkt oder vor der Wand.
  const gitterZ = inputs.montage === 'vorwand' ? 0.03 + frameT / 2 : -0.07;

  const yBot = inputs.montage === 'vorwand'
    ? SILL_HEIGHT_M - (params.vorwandUeberstandMm / 1000)
    : SILL_HEIGHT_M + (params.leibungSpielMm / 1000);
  const yTop = yBot + frameH;
  const innenW = frameW - 2 * (frameShape.wM ?? frameShape.dM ?? 0.03);
  const innenH = frameH - 2 * frameT;

  // Stäbe symmetrisch im Innenlicht.
  const stäbe: GitterStab[] = [];
  for (let s = 1; s <= derived.stabAnzahl; s++) {
    stäbe.push({
      x: -innenW / 2 + (innenW * s) / (derived.stabAnzahl + 1),
      yM: yBot + frameT,
      heightM: innenH,
      shape: stabShape,
    });
  }

  const gurte: GitterGurt[] = [];
  for (let q = 1; q <= derived.quergurtAnzahl; q++) {
    gurte.push({
      y: yBot + frameT + (innenH * q) / (derived.quergurtAnzahl + 1),
      x1: -innenW / 2,
      x2: innenW / 2,
      shape: frameShape,
    });
  }

  // Zierelemente mittig zwischen den Stäben (je zweites Feld).
  const ornaments: GitterOrnament[] = [];
  if (inputs.ornamentTyp && derived.stabAnzahl >= 1) {
    const gap = innenW / (derived.stabAnzahl + 1);
    const sizeM = Math.min(gap * 1.7, innenH * 0.35);
    const lageY =
      inputs.ornamentLage === 'oben'
        ? yTop - frameT - sizeM / 2 - 0.02
        : inputs.ornamentLage === 'unten'
          ? yBot + frameT + sizeM / 2 + 0.02
          : yBot + frameH / 2;
    for (let f = 0; f <= derived.stabAnzahl; f += 2) {
      ornaments.push({
        kind: inputs.ornamentTyp,
        center: [-innenW / 2 + gap * (f + 0.5), lageY, gitterZ],
        sizeM,
      });
    }
  }

  // Befestigungslaschen links/rechts.
  const laschen: GitterLasche[] = [];
  const lascheH = 0.06;
  for (let seite = -1; seite <= 1; seite += 2) {
    for (let k = 1; k <= derived.laschenProSeite; k++) {
      const y = yBot + (frameH * k) / (derived.laschenProSeite + 1);
      if (inputs.montage === 'vorwand') {
        // Lasche liegt auf der Wand, ragt seitlich über den Rahmen hinaus.
        laschen.push({
          center: [seite * (frameW / 2 + 0.035), y, 0.012],
          sizeM: [0.07, lascheH, 0.024],
        });
      } else {
        // Lasche in der Leibung (quer zur Wand).
        laschen.push({
          center: [seite * (openingW / 2 - 0.012), y, -0.07],
          sizeM: [0.024, lascheH, 0.08],
        });
      }
    }
  }

  const dimensions: GitterDimension[] = [
    {
      start: [-frameW / 2, yBot - 0.15, gitterZ + 0.05],
      end: [frameW / 2, yBot - 0.15, gitterZ + 0.05],
      label: `${derived.rahmenBreiteMm} mm`,
    },
    {
      start: [frameW / 2 + 0.18, yBot, gitterZ + 0.05],
      end: [frameW / 2 + 0.18, yTop, gitterZ + 0.05],
      label: `${derived.rahmenHoeheMm} mm`,
    },
  ];

  return {
    openingW,
    openingH,
    frameW,
    frameH,
    gitterZ,
    wall,
    frameShape,
    stäbe,
    gurte,
    laschen,
    ornaments,
    dimensions,
    bounds: {
      minX: -wall.width / 2,
      maxX: wall.width / 2,
      minZ: -0.2,
      maxZ: 0.4,
      heightM: wall.height,
    },
  };
}
