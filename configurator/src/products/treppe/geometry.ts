import type { TreppeDerived, TreppeInputs } from './types';
import type { Profile } from '../types';
import { shapeFromProfile, type ProfileShape } from '../gelaender/geometry';

/**
 * Geometriemodell Treppe: Lauf entlang +X (Antritt bei x=0), Höhe +Y,
 * Laufbreite in Z (zentriert). Masse in Metern. Reine Ableitung –
 * die Szene rendert nur dieses Modell.
 */

export interface TreppenStufe {
  /** Zentrum der Trittstufe. */
  center: [number, number, number];
  /** [Auftrittstiefe, Stufendicke, Laufbreite]. */
  sizeM: [number, number, number];
}

export interface TreppenWange {
  center: [number, number, number];
  laengeM: number;
  hoeheM: number;
  dickeM: number;
  neigungRad: number;
}

export interface SchraegStab {
  /** Fusspunkt auf der Schrägen. */
  base: [number, number, number];
  hoeheM: number;
  shape: ProfileShape;
}

export interface SchraegRail {
  start: [number, number, number];
  end: [number, number, number];
  shape: ProfileShape;
}

export interface TreppeGeometry {
  hoeheM: number;
  lauflaengeM: number;
  breiteM: number;
  neigungRad: number;
  /** true = Treppe ist Bestand (nur Geländer wird geliefert). */
  treppeBestand: boolean;
  stufen: TreppenStufe[];
  wangen: TreppenWange[];
  wangenShape: ProfileShape;
  stufentyp: TreppeInputs['stufentyp'];
  /** Geländer: je Seite Pfosten, Handlauf, Gurte, Stäbe. */
  pfosten: SchraegStab[];
  rails: SchraegRail[];
  staebe: SchraegStab[];
  ornamentTyp: 'ringe' | 'voluten' | 'koerbe' | null;
  ornamentZentren: [number, number, number][];
  ornamentSizeM: number;
  dimensions: { start: [number, number, number]; end: [number, number, number]; label: string }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; heightM: number };
}

export function buildTreppeGeometry(
  inputs: TreppeInputs,
  derived: TreppeDerived,
  profiles: {
    wange?: Profile;
    pfosten?: Profile;
    handlauf?: Profile;
    fuellstab?: Profile;
    querstab?: Profile;
  }
): TreppeGeometry {
  const H = (inputs.geschosshoeheMm ?? 0) / 1000;
  const L = derived.lauflaengeMm / 1000;
  const B = (inputs.laufbreiteMm ?? 1000) / 1000;
  const s = derived.steigungMm / 1000;
  const a = derived.auftrittMm / 1000;
  const n = derived.steigungenAnzahl;
  const neigungRad = Math.atan2(H, L || 0.001);
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe' && derived.gelaenderSeiten > 0;

  const wangenProfil = shapeFromProfile(profiles.wange);
  const wangenHoehe = wangenProfil.wM ?? 0.2; // Flachstahl hochkant
  const wangenDicke = wangenProfil.hM ?? 0.01;

  // Trittstufen: Stufe k (1..n−1) mit Oberkante bei k·s.
  const stufen: TreppenStufe[] = [];
  for (let k = 1; k <= n - 1; k++) {
    stufen.push({
      center: [(k - 1) * a + a / 2, k * s - 0.02, 0],
      sizeM: [a + 0.02, 0.04, B],
    });
  }

  const wangen: TreppenWange[] = [-1, 1].map((seite) => ({
    center: [L / 2, H / 2, seite * (B / 2 + wangenDicke / 2)] as [number, number, number],
    laengeM: Math.sqrt(H * H + L * L) + 0.15,
    hoeheM: wangenHoehe,
    dickeM: wangenDicke,
    neigungRad,
  }));

  // Geländer entlang der Schrägen: y(x) = (x/L)·H + Versatz.
  const gh = (inputs.gelaenderHoeheMm ?? 1000) / 1000;
  const postShape = shapeFromProfile(profiles.pfosten);
  const railShape = shapeFromProfile(profiles.handlauf);
  const barShape = shapeFromProfile(profiles.fuellstab);
  const crossShape = shapeFromProfile(profiles.querstab ?? profiles.fuellstab);

  const seitenZ: number[] =
    inputs.gelaenderSeite === 'beide'
      ? [-(B / 2), B / 2]
      : inputs.gelaenderSeite === 'links'
        ? [-(B / 2)]
        : inputs.gelaenderSeite === 'rechts'
          ? [B / 2]
          : [];

  const pfosten: SchraegStab[] = [];
  const rails: SchraegRail[] = [];
  const staebe: SchraegStab[] = [];
  const ornamentZentren: [number, number, number][] = [];

  const yAt = (x: number) => (L > 0 ? (x / L) * H : 0);

  if (mitGelaender) {
    for (const z of seitenZ) {
      const nP = derived.pfostenProSeite;
      for (let p = 0; p < nP; p++) {
        const x = (L * p) / (nP - 1);
        pfosten.push({ base: [x, yAt(x), z], hoeheM: gh, shape: postShape });
      }
      // Handlauf parallel zur Schrägen.
      rails.push({
        start: [0, gh, z],
        end: [L, H + gh, z],
        shape: railShape,
      });
      // Untergurt (Knieleistenersatz) parallel, tiefer.
      rails.push({
        start: [0, 0.08, z],
        end: [L, H + 0.08, z],
        shape: { kind: 'box', wM: 0.03, hM: 0.008 },
      });
      if (inputs.fuellung === 'querstab' && derived.querstabLagen > 0) {
        for (let lage = 1; lage <= derived.querstabLagen; lage++) {
          const y = 0.08 + ((gh - 0.12) * lage) / (derived.querstabLagen + 1);
          rails.push({
            start: [0, y, z],
            end: [L, H + y, z],
            shape: crossShape,
          });
        }
      } else if (inputs.fuellung !== 'querstab') {
        const nS = derived.staebeProSeite;
        for (let sIdx = 1; sIdx <= nS; sIdx++) {
          const x = (L * sIdx) / (nS + 1);
          staebe.push({
            base: [x, yAt(x) + 0.09, z],
            hoeheM: gh - 0.13,
            shape: barShape,
          });
        }
        if (inputs.fuellung === 'geschmiedet' && inputs.ornamentTyp) {
          const felder = derived.pfostenProSeite - 1;
          for (let f = 0; f < felder; f++) {
            const x = (L * (f + 0.5)) / felder;
            ornamentZentren.push([x, yAt(x) + gh / 2, z]);
          }
        }
      }
    }
  }

  const dimensions: TreppeGeometry['dimensions'] = [
    {
      start: [L + 0.35, 0, 0],
      end: [L + 0.35, H, 0],
      label: `${inputs.geschosshoeheMm ?? 0} mm`,
    },
    {
      start: [0, 0.02, B / 2 + 0.35],
      end: [L, 0.02, B / 2 + 0.35],
      label: `${derived.lauflaengeMm} mm Lauf`,
    },
  ];

  return {
    hoeheM: H,
    lauflaengeM: L,
    breiteM: B,
    neigungRad,
    treppeBestand: !mitTreppe,
    stufen,
    wangen,
    wangenShape: wangenProfil,
    stufentyp: inputs.stufentyp,
    pfosten,
    rails,
    staebe,
    ornamentTyp: inputs.fuellung === 'geschmiedet' ? inputs.ornamentTyp : null,
    ornamentZentren,
    ornamentSizeM: Math.min(0.28, gh * 0.4),
    dimensions,
    bounds: {
      minX: -0.3,
      maxX: L + 0.6,
      minZ: -(B / 2) - 0.4,
      maxZ: B / 2 + 0.4,
      heightM: H + gh,
    },
  };
}
