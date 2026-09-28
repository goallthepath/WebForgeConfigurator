// Diese Datei ist der Bauplan fürs 3D-Bild des Gartentors.
// Sie rechnet aus, WO jedes Teil im Raum steht: Pfosten, Flügel, Stäbe,
// Scharniere. Zeichnen tut sie nichts – das macht später die 3D-Szene.
// Stell dir vor, sie legt nur die Bauklötze auf den Tisch, am richtigen Platz.
import type { GartentorDerived, GartentorInputs } from './types';
import type { Profile } from '../types';
import { shapeFromProfile, type ProfileShape } from '../gelaender/geometry';
import type { PanelFill } from '../gelaender/geometry';

/**
 * Geometriemodell Gartentor. Öffnung zentriert bei x=0, Torebene z=0,
 * Betrachter (aussen) bei +z. Masse in Metern. Reine Ableitung –
 * die Szene rendert nur dieses Modell und animiert die Flügeldrehung.
 */

// Ein TorFluegel beschreibt EINEN Torflügel: Wo ist sein Scharnier (die Achse,
// um die er sich dreht wie eine Schranktür)? Wie breit ist er? Wo sind die Stäbe?
// 🤧 Schnupfspruch: Es Scharnier, wo gix-gax macht,
//    weckt de Nochber mitten i de Nacht – drum ölet me s, bevor s chracht!
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

// Ein Seitenelement ist das, woran das Tor befestigt ist:
// entweder ein Stück Mauer oder ein Metallpfosten.
export interface TorSeitenElement {
  kind: 'mauer' | 'pfosten';
  center: [number, number, number];
  sizeM: [number, number, number];
  shape?: ProfileShape;
}

// Eine Masslinie: ein Pfeil von «start» bis «end» mit einer Beschriftung,
// wie beim Messen mit dem Meterstab.
export interface TorDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

// Das ganze Geometrie-Paket: alles, was die 3D-Szene wissen muss,
// um das Tor zu zeichnen. Masse sind in Metern (1 Meter = 1000 Millimeter).
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

// buildTorGeometry: Hier wird aus Zahlen ein richtiges Tor im Raum.
export function buildTorGeometry(
  inputs: GartentorInputs,
  derived: GartentorDerived,
  profiles: { rahmen?: Profile; stab?: Profile; pfosten?: Profile }
): GartentorGeometry {
  // Millimeter in Meter umrechnen: durch 1000 teilen (1000 mm = 1 m).
  const oeffnungM = (inputs.oeffnungBreiteMm ?? 0) / 1000;
  const hoeheM = (inputs.hoeheMm ?? 0) / 1000;
  const bodenM = inputs.bodenfreiheitMm / 1000;
  const rahmenShape = shapeFromProfile(profiles.rahmen);
  const stabShape = shapeFromProfile(profiles.stab);
  const pfostenShape = shapeFromProfile(profiles.pfosten);
  // 15 Millimeter Luft zwischen Pfosten und Flügel, damit nichts reibt.
  const spaltM = 0.015;

  // Scharnier-Höhen: Wir teilen die Flügelhöhe in gleich grosse Stücke.
  // Bei 2 Scharnieren teilen wir in 3 Stücke und setzen die Scharniere
  // an die Trennstellen – so sind sie schön gleichmässig verteilt.
  const fluegel: TorFluegel[] = [];
  const bandYs = Array.from(
    { length: derived.baenderProFluegel },
    (_, i) =>
      bodenM + ((hoeheM - bodenM) * (i + 1)) / (derived.baenderProFluegel + 1)
  );

  // Wo stehen die Stäbe? Genau gleich wie bei den Scharnieren:
  // Flügelbreite in (Anzahl + 1) gleiche Teile schneiden, Stäbe an die Schnitte.
  // 🤧 Schnupfspruch: Stab a Stab und Lugg a Lugg,
  //    dur das Gitter chunnt kei Hund zrugg.
  const stabOffsets = (breiteM: number): number[] => {
    const n = derived.staebeProFluegel;
    return Array.from({ length: n }, (_, s) => (breiteM * (s + 1)) / (n + 1));
  };

  // Einflügelig: Das Scharnier ist links oder rechts, je nach Wunsch.
  // «richtung» sagt, in welche Richtung der Flügel zugeht (+1 oder -1).
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
  // Zweiflügelig: Ein Flügel hängt links, einer rechts, sie treffen sich
  // in der Mitte. Nur der rechte (der «Gehflügel») hat das Schloss.
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

  // Seitenteile bauen: entweder zwei Mauerstücke oder zwei Pfosten,
  // je eines links (-1) und eines rechts (+1) von der Öffnung.
  // 🤧 Schnupfspruch: Links e Muur und rächts e Pfoste,
  //    dezwüsche s Tor – das tuet nöd rooste!
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

  // Wenn die Füllung aus Blech ist, merken wir uns, welche Art Blech.
  const panelFill: PanelFill | null =
    inputs.fuellung === 'blech'
      ? (`blech-${inputs.blechTyp ?? 'voll'}` as PanelFill)
      : null;

  // Zwei Masslinien: eine für die Breite (unten) und eine für die Höhe (rechts).
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

  // Alles zusammenpacken. Die «bounds» sind wie ein unsichtbarer Karton
  // um das Tor – so weiss die Kamera, wie weit sie zurücktreten muss.
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
