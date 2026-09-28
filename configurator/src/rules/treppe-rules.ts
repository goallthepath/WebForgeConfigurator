// ─────────────────────────────────────────────────────────────────────────
// Diese Datei ist der Schiedsrichter für Treppen. Sie schaut die Wünsche
// und die ausgerechneten Zahlen an und sagt: «Rot – so geht das nicht!»
// (errors) oder «Gelb – geht, aber der Meister schaut es nochmals an»
// (warnings). Grün gibt es hier nie, weil ein Mensch immer nochmals prüft.
// ─────────────────────────────────────────────────────────────────────────
import type { TreppeDerived, TreppeInputs } from '../products/treppe/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { BFU_RICHTWERTE, RULE_APPROVAL_WARNING } from './gelaender-rules';
import { tr } from '../i18n';

/**
 * Regelkatalog Treppe, ruleVersion 0.0.1.
 *
 * Die Schrittmassregel (2×Steigung + Auftritt ≈ 630 mm) ist eine
 * anerkannte Planungsformel; die konkreten Grenzwerte hier sind
 * TESTDATEN (A-004). BFU: Geländer im Treppenlauf mindestens 900 mm.
 * Statik, Norm-Nachweis und Baurecht bleiben fachliche Prüfung –
 * Ampel maximal GELB, Server rechnet beim Absenden erneut.
 */
// Die Liste aller Grenzwerte, die der Schiedsrichter kennt – wie die
// Spielregeln auf der Rückseite eines Brettspiels.
export interface TreppeRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  idealSteigungMm: number;
  schrittmassMm: number;
  minSteigungMm: number;
  maxSteigungMm: number;
  minAuftrittMm: number;
  maxAuftrittMm: number;
  minSchrittmassMm: number;
  maxSchrittmassMm: number;
  minGeschosshoeheMm: number;
  /** Ab hier braucht es Podeste → individuelle Planung. */
  maxGeschosshoeheMm: number;
  minLaufbreiteMm: number;
  maxLaufbreiteMm: number;
  /** Maximaler Pfostenabstand entlang der Schräge. */
  maxPfostenabstandSchraegMm: number;
  maxStabAbstandMm: number;
  maxQuerstabAbstandMm: number;
  minGelaenderhoeheMm: number;
  maxGelaenderhoeheMm: number;
}
// 🤧 Schnupfspruch: Isch d Stäge stotzig und s'Bei wird schwer,
//    nimm en Schnupf – dänn laufts wie vo sälber her.

// Die aktuellen Zahlen (Testwerte!). Zum Beispiel: Eine Stufe soll zwischen
// 14 und 20 cm hoch sein – höher wäre wie Klettern, tiefer wie Trippeln.
export const TREPPE_RULES_V0: TreppeRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  // TESTDATEN – Plausibilisierung und 3D-Vorschau.
  idealSteigungMm: 175,
  schrittmassMm: 630,
  minSteigungMm: 140,
  maxSteigungMm: 200,
  minAuftrittMm: 230,
  maxAuftrittMm: 320,
  minSchrittmassMm: 590,
  maxSchrittmassMm: 650,
  minGeschosshoeheMm: 400,
  maxGeschosshoeheMm: 3400,
  minLaufbreiteMm: 700,
  maxLaufbreiteMm: 1400,
  maxPfostenabstandSchraegMm: 1500,
  maxStabAbstandMm: 110,
  maxQuerstabAbstandMm: 120,
  minGelaenderhoeheMm: 850,
  maxGelaenderhoeheMm: 1200,
};

// Kinder-Erklärung: 90 cm ist ungefähr so hoch wie der Bauchnabel eines
// Erwachsenen. So hoch muss das Geländer mindestens sein, damit man sich
// sicher festhalten kann und nicht darüberkippt.
/** BFU-Richtwert: Geländer im Treppenlauf mindestens 0,90 m. */
export const BFU_TREPPENLAUF_MIN_MM = 900;

/**
 * Der Schiedsrichter selbst: prüft eine Regel nach der anderen und sammelt
 * rote Karten (errors) und gelbe Karten (warnings). Am Schluss sagt er,
 * welche Ampelfarbe die ganze Treppe bekommt.
 */
export function validateTreppe(
  inputs: TreppeInputs,
  derived: TreppeDerived,
  selectedProfiles: readonly Profile[],
  params: TreppeRuleParams = TREPPE_RULES_V0
): ValidationResult {
  // Zwei leere Kartenstapel: einer für gelbe, einer für rote Karten.
  const warnings: string[] = [];
  const errors: string[] = [];
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

  // Regel 1: Ist das Stockwerk zu niedrig oder zu hoch? Wer zu hoch baut,
  // braucht unterwegs einen Absatz zum Verschnaufen (ein «Podest»).
  const H = inputs.geschosshoeheMm;
  if (H !== null) {
    if (H < params.minGeschosshoeheMm) {
      errors.push(
        tr('Geschosshöhe {h} mm liegt unter dem Minimum von {min} mm.', {
          h: H,
          min: params.minGeschosshoeheMm,
        })
      );
    }
    if (H > params.maxGeschosshoeheMm) {
      errors.push(
        tr(
          'Geschosshöhe {h} mm: Ein gerader Lauf braucht hier ein Zwischenpodest – bitte als individuelle Ausführung anfragen.',
          { h: H }
        )
      );
    }
  }

  // Regel 2: Ist die Treppe zu schmal (man quetscht sich) oder zu breit?
  if (inputs.laufbreiteMm !== null) {
    if (
      inputs.laufbreiteMm < params.minLaufbreiteMm ||
      inputs.laufbreiteMm > params.maxLaufbreiteMm
    ) {
      errors.push(
        tr('Laufbreite {b} mm liegt ausserhalb des Bereichs {min}–{max} mm.', {
          b: inputs.laufbreiteMm,
          min: params.minLaufbreiteMm,
          max: params.maxLaufbreiteMm,
        })
      );
    }
  }
  // 🤧 Schnupfspruch: Wer z schnäll abe springt, liit im Chäller;
  //    wer langsam gaht, isch am Schluss de Schneller.

  // Regel 3: Stufenhöhe und Schrittmass prüfen. Zu hohe Stufen sind rot,
  // ein ungewohnter Schritt ist nur gelb (der Meister schaut es an).
  if (derived.steigungenAnzahl > 0) {
    if (
      derived.steigungMm < params.minSteigungMm ||
      derived.steigungMm > params.maxSteigungMm
    ) {
      errors.push(
        tr(
          'Steigung {s} mm liegt ausserhalb {min}–{max} mm – Stufenzahl anpassen oder individuell planen.',
          { s: derived.steigungMm, min: params.minSteigungMm, max: params.maxSteigungMm }
        )
      );
    }
    if (
      derived.schrittmassMm < params.minSchrittmassMm ||
      derived.schrittmassMm > params.maxSchrittmassMm
    ) {
      warnings.push(
        tr(
          'Schrittmass {sm} mm liegt ausserhalb des üblichen Bereichs {min}–{max} mm – Gehkomfort wird fachlich geprüft.',
          { sm: derived.schrittmassMm, min: params.minSchrittmassMm, max: params.maxSchrittmassMm }
        )
      );
    }
    if (
      derived.auftrittMm < params.minAuftrittMm ||
      derived.auftrittMm > params.maxAuftrittMm
    ) {
      warnings.push(
        tr('Auftritt {a} mm liegt ausserhalb des üblichen Bereichs – wird fachlich geprüft.', {
          a: derived.auftrittMm,
        })
      );
    }
  }

  // Regel 4: Ist das Geländer hoch genug? Unter 90 cm gibt es Rot.
  if (mitGelaender && inputs.gelaenderHoeheMm !== null) {
    if (inputs.gelaenderHoeheMm < BFU_TREPPENLAUF_MIN_MM) {
      errors.push(
        tr('Treppengeländer: BFU-Richtwert mindestens {min} mm im Lauf – bitte Höhe anpassen.', {
          min: BFU_TREPPENLAUF_MIN_MM,
        })
      );
    }
    if (
      inputs.gelaenderHoeheMm < params.minGelaenderhoeheMm ||
      inputs.gelaenderHoeheMm > params.maxGelaenderhoeheMm
    ) {
      errors.push(
        tr('Geländerhöhe {h} mm liegt ausserhalb des Vorschaubereichs.', {
          h: inputs.gelaenderHoeheMm,
        })
      );
    }
  }

  // Regel 5: Kinderschutz. Liegende Stäbe sind wie eine Leiter – Kinder
  // klettern gerne daran hoch. Darum gibt es dafür eine Warnung.
  if (mitGelaender && inputs.kinderschutz !== 'nein') {
    if (inputs.fuellung === 'querstab') {
      warnings.push(
        tr(
          'Querstäbe wirken als Leiter – im Treppenbereich mit Kindern wird das Schutzziel oft nicht erreicht (BFU). Wir prüfen Alternativen.'
        )
      );
    } else {
      warnings.push(
        tr('Kinderschutz: Öffnungen werden nach BFU geprüft ({d}-mm-Kugel bis {z} mm).', {
          d: BFU_RICHTWERTE.kugelDurchmesserMm,
          z: BFU_RICHTWERTE.kinderschutzZoneMm,
        })
      );
    }
  }
  // 🤧 Schnupfspruch: Hundertzäh Millimeter, kei Spur meh,
  //    suscht schlüüft s'Büsi dure – und das wär nid schö.

  // Regel 6: Glattes Blech draussen wird bei Regen rutschig wie eine Eisbahn.
  if (mitTreppe && inputs.einbauort === 'aussen' && inputs.stufentyp === 'blech-glatt') {
    warnings.push(
      tr(
        'Glattes Blech aussen: Rutschhemmung wird fachlich beurteilt – Gitterrost oder Tränenblech sind aussen üblich.'
      )
    );
  }

  // Ein paar freundliche Hinweise, die immer gelb sind: bestehende Treppe,
  // ungefähre Masse, geschmiedete Schnörkel, Statik …
  if (inputs.modus === 'gelaender') {
    warnings.push(
      tr(
        'Geländer auf bestehende Treppe: Befestigung an Wange/Stufen und Zustand des Bestands werden beim Aufmass geprüft.'
      )
    );
  }

  if (inputs.masseUngefaehr) {
    warnings.push(tr('Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.'));
  }

  if (inputs.fuellung === 'geschmiedet') {
    warnings.push(
      tr(
        'Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.'
      )
    );
  }

  if (mitTreppe) {
    warnings.push(
      inputs.konstruktion === 'mittelholm'
        ? tr(
            'Mittelholmtreppe: Holmquerschnitt und auskragende Stufen werden statisch bemessen – Darstellung ist Vorschau.'
          )
        : tr(
            'Tragkonstruktion (Wangen, Stufen, Auflager) wird statisch bemessen – Profile hier sind Vorschau.'
          )
    );
    if (inputs.setzstufen === 'offen' && inputs.kinderschutz !== 'nein') {
      warnings.push(
        tr(
          'Offene Steigungen: Öffnungen werden kindersicher begrenzt (BFU, {d}-mm-Kugel) – ggf. mit Blenden.',
          { d: BFU_RICHTWERTE.kugelDurchmesserMm }
        )
      );
    }
  }

  // Regel 7: Sind die ausgesuchten Eisenprofile noch lieferbar und geprüft?
  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(tr('Profil «{name}» ist nicht mehr verfügbar.', { name: profile.name }));
    } else if (!isProductionReady(profile)) {
      warnings.push(
        tr('Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).', {
          name: profile.name,
          approval: profile.approval,
        })
      );
    }
  }

  // Solange die Regeln selbst noch nicht offiziell freigegeben sind, gibt
  // es immer einen Hinweis dazu.
  if (params.approval !== 'freigegeben') {
    warnings.push(tr(RULE_APPROVAL_WARNING));
  }

  // Ampel: Mindestens eine rote Karte → rot. Sonst gelb, weil zum Schluss
  // immer noch ein Mensch draufschaut.
  // 🤧 Schnupfspruch: Nid rot, nid grüen – d Ampel isch gääl,
  //    de Meister luegt no, das isch kei Fähl.
  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
