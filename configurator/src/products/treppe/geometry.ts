// ─────────────────────────────────────────────────────────────────────────
// Diese Datei ist der Bauplan für das 3D-Bild. Sie nimmt die ausgerechneten
// Zahlen (wie viele Stufen, wie hoch, wie tief) und sagt für jedes einzelne
// Eisenteil, WO es im Raum steht und wie gross es ist – wie eine Lego-
// Anleitung, die sagt: «Leg diesen Stein genau hierhin.» Malen tut sie aber
// nicht; das macht später die 3D-Szene.
// ─────────────────────────────────────────────────────────────────────────
import type { TreppeDerived, TreppeInputs } from './types';
import type { Profile } from '../types';
import { shapeFromProfile, type ProfileShape } from '../gelaender/geometry';
import type { HandlaufAbschluss } from '../gelaender/types';
import { tr } from '../../i18n';

/**
 * Geometriemodell Treppe: Lauf entlang +X (Antritt bei x=0), Höhe +Y,
 * Laufbreite in Z (zentriert). Masse in Metern. Reine Ableitung –
 * die Szene rendert nur dieses Modell.
 *
 * Referenzlinie ist die STUFEN-NASENLINIE (Vorderkanten der Tritte):
 * sie beginnt bei (0, Steigung) und endet bei (Lauflänge, Geschosshöhe).
 * Geländerpfosten, Füllstäbe und Handlauf beziehen sich auf diese Linie;
 * die Wange liegt mit ihrer Oberkante knapp über den Nasen.
 */

// Kinder-Erklärung der Richtungen: X ist «nach vorne», also die Richtung, in
// die du die Treppe hinaufgehst. Y ist «nach oben». Z ist «nach links und
// rechts». Alles in Metern, damit die 3D-Welt nicht mit Riesenzahlen rechnet.

/** Eine Trittstufe: wo ihre Mitte ist und wie gross der Eisen-Klotz ist. */
export interface TreppenStufe {
  center: [number, number, number];
  /** [Tiefe entlang Lauf, Dicke, Laufbreite]. */
  sizeM: [number, number, number];
}

/** Ein schräger Träger (Wange oder Mittelholm), der die Stufen trägt. */
export interface TreppenHolm {
  center: [number, number, number];
  laengeM: number;
  hoeheM: number;
  dickeM: number;
  neigungRad: number;
}

/** Ein senkrechter Stab (Pfosten oder Füllstab): Fusspunkt, Höhe, Form. */
export interface SchraegStab {
  base: [number, number, number];
  hoeheM: number;
  shape: ProfileShape;
}

/** Ein Stab von Punkt A nach Punkt B, z. B. der schräge Handlauf. */
export interface SchraegRail {
  start: [number, number, number];
  end: [number, number, number];
  shape: ProfileShape;
}

/** Das Ende vom Handlauf: z. B. eine Kugel oder ein schöner Bogen nach unten. */
export interface TreppenEndCap {
  position: [number, number, number];
  /** Auslaufrichtung in der XZ-Ebene. */
  dir: [number, number];
  kind: HandlaufAbschluss;
  shape: ProfileShape;
}
// 🤧 Schnupfspruch: Heb di am Handlauf, nid am Glück –
//    dänn chunnsch au sicher wieder zrugg.

/**
 * Der ganze Bauplan in einer Kiste: alle Stufen, Träger, Pfosten, Stäbe,
 * Handlauf-Enden, Masslinien und wie gross die ganze Szene ist.
 */

export interface TreppeGeometry {
  hoeheM: number;
  lauflaengeM: number;
  breiteM: number;
  steigungM: number;
  neigungRad: number;
  /** true = Treppe ist Bestand (nur Geländer wird geliefert). */
  treppeBestand: boolean;
  stufen: TreppenStufe[];
  /** Geschlossene Setzstufen (leer bei offener Bauweise). */
  setzstufen: TreppenStufe[];
  /** Wangen (2) oder Mittelholm (1). */
  traeger: TreppenHolm[];
  stufentyp: TreppeInputs['stufentyp'];
  pfosten: SchraegStab[];
  rails: SchraegRail[];
  staebe: SchraegStab[];
  endCaps: TreppenEndCap[];
  ornamentTyp: 'ringe' | 'voluten' | 'koerbe' | null;
  ornamentZentren: [number, number, number][];
  ornamentSizeM: number;
  dimensions: { start: [number, number, number]; end: [number, number, number]; label: string }[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; heightM: number };
}

/**
 * Baut den kompletten Bauplan der Treppe.
 * Wie beim Lego-Bauen gehen wir Schritt für Schritt vor: zuerst die Stufen,
 * dann die Träger darunter, dann das Geländer obendrauf, zum Schluss die
 * Masslinien (die kleinen Pfeile mit den Zahlen).
 */
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
  // Zuerst rechnen wir alle Millimeter in Meter um (÷ 1000).
  // H = Höhe, L = Länge am Boden, B = Breite, s = Stufenhöhe, a = Stufentiefe.
  const H = (inputs.geschosshoeheMm ?? 0) / 1000;
  const L = derived.lauflaengeMm / 1000;
  const B = (inputs.laufbreiteMm ?? 1000) / 1000;
  const s = derived.steigungMm / 1000;
  const a = derived.auftrittMm / 1000;
  const n = derived.steigungenAnzahl;
  // Wie schräg ist die Treppe? (0.001 verhindert, dass wir durch 0 teilen.)
  const neigungRad = Math.atan2(H, L || 0.001);
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe' && derived.gelaenderSeiten > 0;

  // Kinder-Erklärung: Die «Nasen» sind die vorderen Kanten der Stufen. Wenn
  // du ein Lineal über alle Nasen legst, bekommst du eine schräge Linie. Diese
  // kleine Funktion sagt: «Wie hoch ist das Lineal an der Stelle x?»
  /** Nasenlinie: y an Position x. */
  const noseY = (x: number) => s + (a > 0 ? (x / a) * s : 0);

  // Kinder-Erklärung: Stufe Nummer k liegt k Stufenhöhen hoch und beginnt
  // (k − 1) Stufentiefen weit vorne. Wie Bauklötze, die man treppenförmig
  // stapelt – jeder ein Stück höher und ein Stück weiter vorne.
  // Trittstufen: Tritt k (1..n−1), Oberkante bei k·s, von (k−1)a bis k·a.
  const stufen: TreppenStufe[] = [];
  for (let k = 1; k <= n - 1; k++) {
    stufen.push({
      center: [(k - 1) * a + a / 2 + 0.01, k * s - 0.02, 0],
      sizeM: [a + 0.03, 0.04, B],
    });
  }

  // 🤧 Schnupfspruch: Zäh Stufe ufe, zäh Stufe zrugg –
  //    es Prisli Schnupf isch d beschti Brugg.
  // Geschlossene Setzstufen: senkrechte Bleche unter jeder Vorderkante.
  const setzstufen: TreppenStufe[] = [];
  if (mitTreppe && inputs.setzstufen === 'geschlossen') {
    for (let k = 1; k <= n - 1; k++) {
      setzstufen.push({
        center: [(k - 1) * a, (k - 1) * s + s / 2 - 0.005, 0],
        sizeM: [0.008, s + 0.01, B - 0.02],
      });
    }
  }

  // Die Träger liegen schräg unter den Stufen, wie zwei Rutschbahn-Bretter.
  // Tragkonstruktion: 2 Wangen oder 1 Mittelholm, Oberkante an der
  // Nasenlinie ausgerichtet (senkrecht dazu nach unten versetzt).
  const wangenProfil = shapeFromProfile(profiles.wange);
  const wangenHoehe = wangenProfil.wM ?? 0.2; // Flachstahl hochkant
  const wangenDicke = wangenProfil.hM ?? 0.01;
  // Schräge Länge nach Pythagoras: √(H² + L²) – wie die lange Seite eines
  // Dreiecks, das von der Treppe, dem Boden und der Wand gebildet wird.
  const schraegeM = Math.sqrt(H * H + L * L);
  const mitte: [number, number] = [L / 2, (s + H + s) / 2 - s / 2]; // Mitte der Nasenlinie: ((0,s)+(L,H))/2
  // «perp» zeigt senkrecht zur Schräge nach unten – so können wir den Träger
  // ein kleines Stück unter die Stufenkanten schieben.
  const perp = { x: Math.sin(neigungRad), y: -Math.cos(neigungRad) };

  const traeger: TreppenHolm[] = [];
  if (mitTreppe || derived.gelaenderSeiten > 0) {
    const offset = wangenHoehe / 2 - 0.02; // Oberkante knapp über den Nasen
    const cx = mitte[0] + perp.x * offset;
    const cy = (s + H) / 2 + perp.y * offset;
    // Entweder ein dicker Balken in der Mitte …
    if (inputs.konstruktion === 'mittelholm' && mitTreppe) {
      traeger.push({
        center: [cx, cy - 0.05, 0],
        laengeM: schraegeM + 0.1,
        hoeheM: 0.18,
        dickeM: 0.12,
        neigungRad,
      });
    // … oder zwei Wangen: eine links (−1) und eine rechts (+1).
    } else {
      for (const seite of [-1, 1]) {
        traeger.push({
          center: [cx, cy, seite * (B / 2 + wangenDicke / 2)],
          laengeM: schraegeM + 0.12,
          hoeheM: wangenHoehe,
          dickeM: wangenDicke,
          neigungRad,
        });
      }
    }
  }
  // 🤧 Schnupfspruch: D Wange lauft schräg, de Pythagoras lacht –
  //    er hät d Längi scho lang usegmacht.

  // Geländer auf der Nasenlinie.
  // Zuerst die Formen der Geländerteile holen (rund, eckig, wie dick …).
  const gh = (inputs.gelaenderHoeheMm ?? 1000) / 1000;
  const postShape = shapeFromProfile(profiles.pfosten);
  const railShape = shapeFromProfile(profiles.handlauf);
  const barShape = shapeFromProfile(profiles.fuellstab);
  const crossShape = shapeFromProfile(profiles.querstab ?? profiles.fuellstab);
  const railR = (railShape.dM ?? railShape.hM ?? 0.04) / 2;
  const auslaufM = 0.3; // horizontaler Handlauf-Auslauf am Austritt

  // Wo stehen die Geländer quer zur Treppe? Links am Rand (−B/2),
  // rechts am Rand (+B/2) oder an beiden Rändern.
  const seitenZ: number[] =
    inputs.gelaenderSeite === 'beide'
      ? [-(B / 2), B / 2]
      : inputs.gelaenderSeite === 'links'
        ? [-(B / 2)]
        : inputs.gelaenderSeite === 'rechts'
          ? [B / 2]
          : [];

  // Leere Körbe, in die wir gleich alle Geländerteile hineinlegen.
  const pfosten: SchraegStab[] = [];
  const rails: SchraegRail[] = [];
  const staebe: SchraegStab[] = [];
  const endCaps: TreppenEndCap[] = [];
  const ornamentZentren: [number, number, number][] = [];

  if (mitGelaender) {
    for (const z of seitenZ) {
      // Pfosten gleichmässig verteilen, vom Anfang (x=0) bis zum Ende (x=L).
      const nP = derived.pfostenProSeite;
      for (let p = 0; p < nP; p++) {
        const x = (L * p) / (nP - 1);
        pfosten.push({ base: [x, noseY(x), z], hoeheM: gh, shape: postShape });
      }
      // Handlauf entlang der Nasenlinie + horizontaler Auslauf oben.
      rails.push({
        start: [0, noseY(0) + gh, z],
        end: [L, H + gh, z],
        shape: railShape,
      });
      rails.push({
        start: [L, H + gh, z],
        end: [L + auslaufM, H + gh, z],
        shape: railShape,
      });
      // Untergurt parallel zur Nasenlinie.
      rails.push({
        start: [0, noseY(0) + 0.08, z],
        end: [L, H + 0.08, z],
        shape: { kind: 'box', wM: 0.03, hM: 0.008 },
      });

      // Schöne Enden für den Handlauf: eins unten (zeigt schräg nach hinten)
      // und eins oben (zeigt geradeaus weiter).
      if (inputs.handlaufAbschluss) {
        endCaps.push(
          {
            position: [0, noseY(0) + gh, z],
            dir: [-Math.cos(neigungRad), 0],
            kind: inputs.handlaufAbschluss,
            shape: railShape,
          },
          {
            position: [L + auslaufM, H + gh, z],
            dir: [1, 0],
            kind: inputs.handlaufAbschluss,
            shape: railShape,
          }
        );
      }

      // Querstäbe: liegen schräg wie der Handlauf, in gleichen Abständen
      // übereinander – wie die Linien in einem Schulheft, nur schief.
      if (inputs.fuellung === 'querstab' && derived.querstabLagen > 0) {
        for (let lage = 1; lage <= derived.querstabLagen; lage++) {
          const y = 0.08 + ((gh - 0.1 - 2 * railR) * lage) / (derived.querstabLagen + 1);
          rails.push({
            start: [0, noseY(0) + y, z],
            end: [L, H + y, z],
            shape: crossShape,
          });
        }
      } else if (inputs.fuellung !== 'querstab') {
        // Senkrechte Stäbe gleichmässig zwischen Anfang und Ende verteilen.
        const nS = derived.staebeProSeite;
        for (let sIdx = 1; sIdx <= nS; sIdx++) {
          const x = (L * sIdx) / (nS + 1);
          staebe.push({
            base: [x, noseY(x) + 0.09, z],
            hoeheM: gh - 0.11 - railR,
            shape: barShape,
          });
        }
        // Geschmiedete Schnörkel: je einer in die Mitte jedes Feldes zwischen
        // zwei Pfosten.
        if (inputs.fuellung === 'geschmiedet' && inputs.ornamentTyp) {
          const felder = derived.pfostenProSeite - 1;
          for (let f = 0; f < felder; f++) {
            const x = (L * (f + 0.5)) / felder;
            ornamentZentren.push([x, noseY(x) + gh / 2, z]);
          }
        }
      }
    }
  }
  // 🤧 Schnupfspruch: Pfoste stönd stramm i de Reihe,
  //    de Handlauf lauft drüber – eis, zwei, drüü, nüüt verheie.

  // Masslinien: eine senkrechte für die Höhe und eine am Boden für die Länge.
  const dimensions: TreppeGeometry['dimensions'] = [
    {
      start: [L + 0.55, 0, 0],
      end: [L + 0.55, H, 0],
      label: `${inputs.geschosshoeheMm ?? 0} mm`,
    },
    {
      start: [0, 0.02, B / 2 + 0.4],
      end: [L, 0.02, B / 2 + 0.4],
      label: tr('{l} mm Lauf', { l: derived.lauflaengeMm }),
    },
  ];

  // Alles zusammen als fertigen Bauplan zurückgeben. «bounds» sagt, wie
  // gross die ganze Szene ist, damit die Kamera weiss, wohin sie schauen muss.
  return {
    hoeheM: H,
    lauflaengeM: L,
    breiteM: B,
    steigungM: s,
    neigungRad,
    treppeBestand: !mitTreppe,
    stufen,
    setzstufen,
    traeger,
    stufentyp: inputs.stufentyp,
    pfosten,
    rails,
    staebe,
    endCaps,
    ornamentTyp: inputs.fuellung === 'geschmiedet' ? inputs.ornamentTyp : null,
    ornamentZentren,
    ornamentSizeM: Math.min(0.28, gh * 0.4),
    dimensions,
    bounds: {
      minX: -0.3,
      maxX: L + 0.8,
      minZ: -(B / 2) - 0.45,
      maxZ: B / 2 + 0.45,
      heightM: H + (mitGelaender ? gh : 0.4),
    },
  };
}
