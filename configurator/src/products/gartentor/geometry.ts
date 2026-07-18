import type { GartentorDerived, GartentorInputs } from './types';
import type { Profile } from '../types';
import { shapeFromProfile, type ProfileShape } from '../gelaender/geometry';
import type { PanelFill } from '../gelaender/geometry';

/**
 * Geometriemodell Gartentor. Öffnung zentriert bei x=0, Torebene z=0,
 * Betrachter (aussen) bei +z. Masse in Metern. Reine Ableitung –
 * die Szene rendert nur dieses Modell und animiert die Flügeldrehung.
 */

export interface TorFluegel {
  /** Band-Drehachse (x) und Öffnungsrichtung des Flügels (+1 = nach rechts schliessend). */
  hingeX: number;
  richtung: 1 | -1;
  breiteM: number;
  /** Stab-Offsets relativ zur Bandkante. */
  stabOffsetsM: number[];
  /** Bandhöhen (y). */
  bandYs: number[];
  /** true = dieser Flügel trägt das Schloss (Drücker an der Schliesskante). */
  mitSchloss: boolean;
}

export interface TorSeitenElement {
  kind: 'mauer' | 'pfosten';
  center: [number, number, number];
  sizeM: [number, number, number];
  shape?: ProfileShape;
}

export interface TorDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

export interface GartentorGeometry {
  oeffnungM: number;
  hoeheM: number;
  bodenM: number;
  rahmenShape: ProfileShape;
  stabShape: ProfileShape;
  fluegel: TorFluegel[];
  seiten: TorSeitenElement[];
  panelFill: PanelFill | null;
  motiv?: 'schlitze' | 'kreise' | 'quadrate' | 'floral';
  ornamentTyp: 'ringe' | 'voluten' | 'koerbe' | null;
  dimensions: TorDimension[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; heightM: number };
}

export function buildTorGeometry(
  inputs: GartentorInputs,
  derived: GartentorDerived,
  profiles: { rahmen?: Profile; stab?: Profile; pfosten?: Profile }
): GartentorGeometry {
  const oeffnungM = (inputs.oeffnungBreiteMm ?? 0) / 1000;
  const hoeheM = (inputs.hoeheMm ?? 0) / 1000;
  const bodenM = inputs.bodenfreiheitMm / 1000;
  const rahmenShape = shapeFromProfile(profiles.rahmen);
  const stabShape = shapeFromProfile(profiles.stab);
  const pfostenShape = shapeFromProfile(profiles.pfosten);
  const spaltM = 0.015;

  const fluegel: TorFluegel[] = [];
  const bandYs = Array.from(
    { length: derived.baenderProFluegel },
    (_, i) =>
      bodenM + ((hoeheM - bodenM) * (i + 1)) / (derived.baenderProFluegel + 1)
  );

  const stabOffsets = (breiteM: number): number[] => {
    const n = derived.staebeProFluegel;
    return Array.from({ length: n }, (_, s) => (breiteM * (s + 1)) / (n + 1));
  };

  if (derived.fluegelBreitenMm.length === 1) {
    const breiteM = derived.fluegelBreitenMm[0] / 1000;
    const links = inputs.anschlag !== 'rechts';
    fluegel.push({
      hingeX: links ? -oeffnungM / 2 + spaltM : oeffnungM / 2 - spaltM,
      richtung: links ? 1 : -1,
      breiteM,
      stabOffsetsM: stabOffsets(breiteM),
      bandYs,
      mitSchloss: true,
    });
  } else if (derived.fluegelBreitenMm.length === 2) {
    const breiteM = derived.fluegelBreitenMm[0] / 1000;
    fluegel.push(
      {
        hingeX: -oeffnungM / 2 + spaltM,
        richtung: 1,
        breiteM,
        stabOffsetsM: stabOffsets(breiteM),
        bandYs,
        mitSchloss: false,
      },
      {
        hingeX: oeffnungM / 2 - spaltM,
        richtung: -1,
        breiteM,
        stabOffsetsM: stabOffsets(breiteM),
        bandYs,
        mitSchloss: true, // Gehflügel mit Schloss
      }
    );
  }

  const seiten: TorSeitenElement[] = [];
  if (inputs.seitenbau === 'mauer') {
    const mauerH = hoeheM + 0.15;
    for (const seite of [-1, 1] as const) {
      seiten.push({
        kind: 'mauer',
        center: [seite * (oeffnungM / 2 + 0.2), mauerH / 2, 0],
        sizeM: [0.4, mauerH, 0.25],
      });
    }
  } else if (inputs.seitenbau === 'pfosten') {
    const pw = pfostenShape.dM ?? pfostenShape.wM ?? 0.08;
    for (const seite of [-1, 1] as const) {
      seiten.push({
        kind: 'pfosten',
        center: [seite * (oeffnungM / 2 + pw / 2), (hoeheM + 0.1) / 2, 0],
        sizeM: [pw, hoeheM + 0.1, pw],
        shape: pfostenShape,
      });
    }
  }

  const panelFill: PanelFill | null =
    inputs.fuellung === 'blech'
      ? (`blech-${inputs.blechTyp ?? 'voll'}` as PanelFill)
      : null;

  const dimensions: TorDimension[] = [
    {
      start: [-oeffnungM / 2, 0.02, 0.45],
      end: [oeffnungM / 2, 0.02, 0.45],
      label: `${inputs.oeffnungBreiteMm ?? 0} mm`,
    },
    {
      start: [oeffnungM / 2 + 0.55, 0, 0],
      end: [oeffnungM / 2 + 0.55, hoeheM, 0],
      label: `${inputs.hoeheMm ?? 0} mm`,
    },
  ];

  return {
    oeffnungM,
    hoeheM,
    bodenM,
    rahmenShape,
    stabShape,
    fluegel,
    seiten,
    panelFill,
    motiv:
      panelFill === 'blech-laser' ? (inputs.laserMotiv ?? 'schlitze') : undefined,
    ornamentTyp: inputs.fuellung === 'geschmiedet' ? inputs.ornamentTyp : null,
    dimensions,
    bounds: {
      minX: -oeffnungM / 2 - 0.6,
      maxX: oeffnungM / 2 + 0.6,
      minZ: -Math.max(1, oeffnungM * 0.6),
      maxZ: Math.max(1, oeffnungM * 0.6),
      heightM: Math.max(hoeheM, 1),
    },
  };
}
