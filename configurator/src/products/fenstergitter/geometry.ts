// Der 3D-Bauplan fürs Fenstergitter. Hier wird ausgerechnet, wo im Raum
// die Wand, das Fensterloch, der Rahmen, die Stäbe und die Laschen sind.
// Gezeichnet wird hier nichts – wir legen nur alle Bauklötze bereit.
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

// Das Fenster sitzt 90 cm über dem Boden – ungefähr so hoch wie ein Küchentisch.
// 🤧 Schnupfspruch: Nüünzg Zentimeter übere Bode, das Fäischter-Brett –
//    grad rächt zum Drufsitze und Luege, wie s dusse schneit so nett.
export const SILL_HEIGHT_M = 0.9;

// Ein einzelner Gitterstab: Wo steht er (x), wo fängt er an (yM), wie hoch ist er?
export interface GitterStab {
  x: number;
  yM: number;
  heightM: number;
  shape: ProfileShape;
}

// Ein Quergurt: eine waagrechte Stange auf Höhe y, von x1 bis x2.
export interface GitterGurt {
  y: number;
  x1: number;
  x2: number;
  shape: ProfileShape;
}

// Eine Lasche: ein kleines Metallplättchen zum Festschrauben an der Wand.
export interface GitterLasche {
  center: [number, number, number];
  sizeM: [number, number, number];
}

// Ein Zierelement (Ringe, Schnörkel, Körbchen) mit Position und Grösse.
export interface GitterOrnament {
  kind: 'ringe' | 'voluten' | 'koerbe';
  center: [number, number, number];
  sizeM: number;
}

// Eine Masslinie mit Pfeil und Beschriftung.
export interface GitterDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

// Das ganze Paket für die 3D-Szene: Wand, Fensterloch, Gitter und alle Teile.
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

// buildGitterGeometry: Aus den Zahlen wird ein Gitter im Raum.
// 🤧 Schnupfspruch: Es Gitter im Computer, us Nulle und Eis –
//    im Chäller isch es Iise, und das isch de Priis.
export function buildGitterGeometry(
  inputs: FenstergitterInputs,
  derived: FenstergitterDerived,
  profiles: { rahmen?: Profile; stab?: Profile }
): FenstergitterGeometry {
  // Die Regeln holen und Millimeter in Meter umrechnen (÷ 1000).
  const params = FENSTERGITTER_RULES_V0;
  const frameW = derived.rahmenBreiteMm / 1000;
  const frameH = derived.rahmenHoeheMm / 1000;

  // Fensteröffnung (Lichtmass) für den Wandkontext.
  let openingW: number;
  let openingH: number;
  // Drei Fälle: Hat man das Loch gemessen, nehmen wir das direkt.
  // Sonst rechnen wir vom Gitter aus zurück: Vorwand-Gitter sind grösser als das Loch,
  // Leibungs-Gitter kleiner.
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
  // Das Loch soll mindestens 20 cm gross sein, sonst sieht man in 3D nichts.
  openingW = Math.max(openingW, 0.2);
  openingH = Math.max(openingH, 0.2);

  // Die Form von Rahmen und Stäben. Hat man eine Wunsch-Dicke angegeben,
  // wird der Stab rund mit genau dieser Dicke.
  const frameShape = shapeFromProfile(profiles.rahmen);
  const stabShape: ProfileShape = inputs.stabWunschDm
    ? { kind: 'round', dM: inputs.stabWunschDm / 1000 }
    : shapeFromProfile(profiles.stab);
  // Wie dick ist der Rahmen? Sonst 3 cm.
  const frameT = frameShape.hM ?? frameShape.dM ?? 0.03;

  // Ein Stück Wand rund ums Fenster, damit man sieht, wo das Gitter sitzt.
  // 🤧 Schnupfspruch: E Muur, es Loch, es Gitter dra –
  //    so schlaft de Hamster ruehig, und s Chind au, ja!
  const wall = {
    width: openingW + 1.6,
    height: SILL_HEIGHT_M + openingH + 0.55,
    thickness: 0.15,
  };

  // Gitterebene: in der Leibung versenkt oder vor der Wand.
  const gitterZ = inputs.montage === 'vorwand' ? 0.03 + frameT / 2 : -0.07;

  // Wo ist die Unterkante des Gitters? Vor der Wand etwas tiefer als das Loch,
  // in der Nische etwas höher. Die Oberkante ist dann Unterkante + Gitterhöhe.
  const yBot = inputs.montage === 'vorwand'
    ? SILL_HEIGHT_M - (params.vorwandUeberstandMm / 1000)
    : SILL_HEIGHT_M + (params.leibungSpielMm / 1000);
  const yTop = yBot + frameH;
  // Der Platz innerhalb des Rahmens (ohne die Rahmenrohre selbst).
  const innenW = frameW - 2 * (frameShape.wM ?? frameShape.dM ?? 0.03);
  const innenH = frameH - 2 * frameT;

  // Stäbe symmetrisch im Innenlicht.
  const stäbe: GitterStab[] = [];
  // Wir teilen die Innenbreite in (Anzahl Stäbe + 1) gleiche Stücke und setzen
  // die Stäbe an die Trennstellen. Bei 3 Stäben also 4 Stücke – schön gleichmässig.
  for (let s = 1; s <= derived.stabAnzahl; s++) {
    stäbe.push({
      x: -innenW / 2 + (innenW * s) / (derived.stabAnzahl + 1),
      yM: yBot + frameT,
      heightM: innenH,
      shape: stabShape,
    });
  }

  // Quergurte genau gleich, nur in der Höhe statt in der Breite verteilt.
  // 🤧 Schnupfspruch: Senkrächt de Stab und waagrächt de Gurt –
  //    so isch s Gitter e Schachbrätt, und de Dieb isch furt.
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
  // Zierelemente nur, wenn gewünscht und wenn es mindestens einen Stab gibt.
  if (inputs.ornamentTyp && derived.stabAnzahl >= 1) {
    // gap = Breite eines Feldes zwischen zwei Stäben.
    const gap = innenW / (derived.stabAnzahl + 1);
    // Das Ornament darf nicht zu gross werden – höchstens so breit wie gut 1½ Felder
    // und höchstens etwas mehr als ein Drittel der Höhe.
    const sizeM = Math.min(gap * 1.7, innenH * 0.35);
    // Oben, unten oder in der Mitte?
    const lageY =
      inputs.ornamentLage === 'oben'
        ? yTop - frameT - sizeM / 2 - 0.02
        : inputs.ornamentLage === 'unten'
          ? yBot + frameT + sizeM / 2 + 0.02
          : yBot + frameH / 2;
    // Nur in jedes zweite Feld ein Ornament (f = 0, 2, 4 …), damit es nicht zu voll wird.
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
  // Für jede Seite (links -1, rechts +1) und jede Lasche auf dieser Seite …
  for (let seite = -1; seite <= 1; seite += 2) {
    for (let k = 1; k <= derived.laschenProSeite; k++) {
      // … die Höhe: Rahmenhöhe gleichmässig aufteilen, wie bei den Stäben.
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

  // Masslinien: eine unten für die Breite, eine rechts für die Höhe.
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

  // Alles zusammenpacken. «bounds» ist der unsichtbare Karton um die Szene.
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
