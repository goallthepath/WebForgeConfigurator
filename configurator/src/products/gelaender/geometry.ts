// ─────────────────────────────────────────────────────────────────────────
// Für Kinder erklärt: Diese Datei ist der Bauplan-Zeichner. Sie rechnet für
// jedes einzelne Teil des Geländers aus, WO es im Raum steht – wie wenn du
// auf Häuschenpapier für jeden Lego-Stein aufschreibst: «3 Kästchen nach
// rechts, 2 nach hinten, 5 nach oben». Die 3D-Ansicht liest diesen Plan
// später und malt die Teile genau dorthin. Alles wird in Metern gemessen.
// ─────────────────────────────────────────────────────────────────────────
// 🤧 Schnupfspruch: X, Y und Z – s Gländer stoht im Bett.
//    De Computer rächnet s Eisen, mir tüend schnupfe und verreise.
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

// Die Form einer Stange, von vorne angeschaut: rund wie ein Rohr
// (mit Durchmesser dM) oder eckig wie eine Schachtel (Breite wM, Höhe hM).
export interface ProfileShape {
  kind: 'round' | 'box';
  /** Durchmesser (round) in m. */
  dM?: number;
  /** Breite/Tiefe (box) in m. */
  wM?: number;
  hM?: number;
}

// Ein Pfosten: der senkrechte Stecken, der im Boden steht. x und z sagen,
// wo er am Boden steht (wie Koordinaten auf einer Schatzkarte).
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

// Eine waagrechte Stange (Handlauf oder Gurt): von einem Punkt «start» zu
// einem Punkt «end» – wie ein Strich, den man mit dem Lineal zieht.
export interface GeoRail {
  start: [number, number, number];
  end: [number, number, number];
  /** Abgewickelter Bereich entlang des Pfads in m (für 2D). */
  tRangeM: [number, number];
  shape: ProfileShape;
}

// Ein senkrechter Füllstab zwischen den Pfosten – wie die Latten im Zaun.
export interface GeoBar {
  x: number;
  z: number;
  tM: number;
  yM: number;
  heightM: number;
  shape: ProfileShape;
}

// Wie eine Platte aussieht: Glas klar oder milchig, Blech voll/gelocht/
// gelasert oder Gitter.
/** Darstellungsart einer Flächenfüllung. */
export type PanelFill =
  | 'glas-klar'
  | 'glas-satiniert'
  | 'blech-voll'
  | 'blech-loch'
  | 'blech-laser'
  | 'gitter-streckmetall'
  | 'gitter-drahtgitter';

// Kinder-Erklärung: Eine ganze Platte zwischen zwei Pfosten – wie eine
// Fensterscheibe im Fensterrahmen.
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

// Kinder-Erklärung: Die «Füsse» und «Hände» des Geländers, mit denen es
// am Boden, an der Seite oder an der Wand festhält.
// 🤧 Schnupfspruch: Fuessplatte, Schwert und Wandlasche –
//    es Gländer ohni Füess gheit i d Asche. Schnupf!
/** Fussplatte, seitliches Schwert oder Kragarm am Pfosten. */
export interface GeoPlate {
  center: [number, number, number];
  /** [entlang Lauf, Höhe, quer zum Lauf] in m. */
  sizeM: [number, number, number];
  rotY: number;
  /** Steuert die Anker-Darstellung in der Szene. */
  kind: 'fussplatte' | 'schwert' | 'kragarm' | 'wandlasche';
}

// Ein geschmiedeter Schnörkel, den der Schmied mit dem Hammer biegt.
/** Schmiedeornament (Grundauswahl der Charakter-Familie). */
export interface GeoOrnament {
  kind: 'ringe' | 'voluten' | 'koerbe';
  center: [number, number, number];
  tM: number;
  rotY: number;
  /** Verfügbare Breite/Höhe für das Element in m. */
  sizeM: number;
}

// Ein Stück Boden oder Mauer, auf dem das Geländer steht – nur zum
// Anschauen in 3D, damit das Geländer nicht in der Luft schwebt.
/** Baukörper-Andeutung je Lauf – Darstellung folgt dem Untergrund. */
export interface GeoSlab {
  center: [number, number, number];
  sizeM: [number, number, number];
  rotY: number;
  kind: 'beton' | 'holz' | 'stahl' | 'unbekannt';
}

// Wie das Ende des Handlaufs aussieht, und wo genau so ein Ende sitzt.
export type EndCap = 'gerade' | 'kugel-drittel' | 'kugel' | 'endbogen';

export interface GeoEndCap {
  position: [number, number, number];
  /** Laufrichtung am Ende (für Endbogen). */
  dir: [number, number];
  kind: EndCap;
  shape: ProfileShape;
}

// Eine Masslinie: ein Pfeil mit einer Zahl dran, wie auf einem Bauplan
// («3000 mm»), damit man sieht, wie lang etwas ist.
export interface GeoDimension {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
}

// Der ganze fertige Bauplan in einer Schachtel: alle Pfosten, Stangen,
// Stäbe, Platten, Füsse, Schnörkel und Masslinien. Dazu die «bounds»:
// wie gross das Ganze ist, damit die Kamera weiss, wie weit sie weg muss.
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

// Schaut im Profil-Katalog nach, wie dick eine Stange ist, und rechnet
// Millimeter in Meter um (durch 1000 teilen – 1000 mm sind 1 Meter).
// Gibt's kein Profil, nehmen wir einfach ein 4-cm-Rohr.
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

// Ein gerades Stück («Lauf»): wo es anfängt (origin), in welche Richtung
// es geht (dir) und wie lang es ist.
interface RunDef {
  origin: [number, number];
  dir: [number, number];
  lengthM: number;
}

// Kinder-Erklärung: Beim Laufen um die Ecke: +1 heisst «links abbiegen»,
// -1 heisst «rechts abbiegen». Ein I biegt nie ab, ein U zweimal.
/** 90°-Drehungen je Grundform (+1 = links, -1 = rechts), Start entlang +X. */
const TURNS: Record<string, number[]> = {
  i: [],
  'l-innen': [1],
  'l-aussen': [-1],
  'u-innen': [1, 1],
  'u-aussen': [-1, -1],
};

// Kinder-Erklärung: Stell dir vor, du läufst mit Kreide auf dem Pausenplatz
// das Geländer ab: Du startest bei 0, gehst geradeaus so weit wie das erste
// Stück lang ist, drehst dich um 90° und gehst das nächste Stück – so
// entsteht der Grundriss, Strich für Strich.
/** Läufe (Segmente) als Polygonzug in der Bodenebene. */
export function runsFromInputs(inputs: GelaenderInputs): RunDef[] {
  const seg = inputs.segmentLaengenMm.map((l) => l / 1000).filter((l) => l > 0);
  if (seg.length === 0) return [];
  const turns = TURNS[inputs.variante ?? 'i'] ?? [];
  const result: RunDef[] = [];
  let pos: [number, number] = [0, 0];
  let dir: [number, number] = [1, 0];
  // Für jedes Stück: (ausser beim ersten) zuerst um die Ecke drehen,
  // dann das Stück aufschreiben und bis ans Ende weiterlaufen.
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

// 🤧 Schnupfspruch: Pfoste, Stab und Handlauf – so stapled mir s Gländer uf.
//    Wie Lego, nume us Iise, gäll – und dänn en Schnupf, ganz schnäll!
// Die grosse Bau-Funktion: Sie baut Stück für Stück den ganzen Bauplan
// zusammen – zuerst die Grössen, dann für jedes gerade Stück die Pfosten,
// Füsse, Stangen, Stäbe, Platten, Schnörkel und Masslinien.
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
  // Zuerst: Wie hoch ist das Geländer und wie dick sind die Stangen?
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
  // Kinder-Erklärung: Jetzt überlegen wir, wie hoch alles liegt – wie bei
  // einem Regal: unterstes Brett, oberstes Brett und dazwischen der Platz
  // für die Füllung (fillBottomM bis fillTopM).
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

  // Welche Sorte Platte gibt's? (Oder gar keine, dann «null».)
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

  // 🤧 Schnupfspruch: Lauf für Lauf und Eck für Eck –
  //    de Schmied isch fliissig, de Rost isch weg.
  const runDefs = runsFromInputs(inputs);

  let baseT = 0;
  // Jetzt gehen wir jedes gerade Stück einzeln durch.
  runDefs.forEach((run, runIndex) => {
    // Kinder-Erklärung: Abstand zwischen zwei Pfosten = Länge geteilt durch
    // (Anzahl Pfosten − 1). Bei 4 Pfosten gibt's nur 3 Lücken – zähl mal
    // die Lücken zwischen deinen Fingern! «at(t)» sagt uns, wo wir stehen,
    // wenn wir t Meter auf dem Stück gelaufen sind.
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

    // Die Pfosten hinstellen, einen nach dem anderen, in gleichen Abständen.
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

    // Kinder-Erklärung: Bei der Wand-Montage gibt es an den Enden kleine
    // Laschen – wie Hände, die sich an der Wand festhalten.
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

    // Unter das Geländer malen wir ein Stück Boden (Beton, Holz oder Stahl),
    // damit man sieht, worauf es steht.
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

    // Die waagrechten Stangen: «gurt» ist eine kleine Helfer-Funktion, die
    // eine Stange auf einer bestimmten Höhe über das ganze Stück legt.
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

    // Zwischen den Pfosten liegen die Felder – mindestens eines.
    const felder = Math.max(1, nPosts - 1);

    const mitStaeben =
      inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet';

    // Kinder-Erklärung: Die senkrechten Stäbe verteilen wir gleichmässig
    // in jedem Feld, wie Zaunlatten mit immer gleich viel Platz dazwischen.
    // 🤧 Schnupfspruch: Stab a Stab, grad wie Soldate –
    //    s Gländer isch de Stolz vom Schlossermeischter-Grate!
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

        // Kinder-Erklärung: Beim geschmiedeten Geländer kommt in die Mitte
        // des Feldes (oder jedes zweiten) ein Schnörkel. Wie gross er wird,
        // hängt von der Wahl «klein / mittel / gross» ab – aber er darf nie
        // grösser sein als der Platz, den er hat.
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

    // Querstäbe (Reling): gleichmässig übereinander verteilt, wie die
    // Sprossen einer Leiter, die man hingelegt hat.
    if (inputs.fuellungsart === 'querstab' && derived.querstabLagen > 0) {
      const oben = mitHandlauf ? railAxisM - railThickness / 2 : heightM;
      const frei = oben - bottomM;
      for (let lage = 1; lage <= derived.querstabLagen; lage++) {
        gurt(bottomM + (frei * lage) / (derived.querstabLagen + 1), crossShape);
      }
    }

    // Platten (Glas, Blech, Gitter): pro Feld eine, genau in die Mitte.
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

    // Kinder-Erklärung: Die Masslinie liegt ein Stückchen neben dem Geländer,
    // damit sie nicht mitten durch die Stäbe geht – wie eine Beschriftung
    // neben einer Zeichnung.
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

    // Weiterzählen: Das nächste Stück beginnt dort, wo dieses aufhört.
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

  // Zum Schluss: den kleinsten und grössten Punkt suchen, damit die Kamera
  // weiss, wie gross der «Rahmen» ums ganze Geländer ist.
  // 🤧 Schnupfspruch: Vom Pfoste bis zum Amboss, vom Amboss bis zum Zaun –
  //    en guete Plan isch halbi Arbet, de Rescht isch Schnupf und Staun.
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
