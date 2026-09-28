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

/** BFU-Richtwert: Geländer im Treppenlauf mindestens 0,90 m. */
export const BFU_TREPPENLAUF_MIN_MM = 900;

export function validateTreppe(
  inputs: TreppeInputs,
  derived: TreppeDerived,
  selectedProfiles: readonly Profile[],
  params: TreppeRuleParams = TREPPE_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

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

  if (mitTreppe && inputs.einbauort === 'aussen' && inputs.stufentyp === 'blech-glatt') {
    warnings.push(
      tr(
        'Glattes Blech aussen: Rutschhemmung wird fachlich beurteilt – Gitterrost oder Tränenblech sind aussen üblich.'
      )
    );
  }

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

  if (params.approval !== 'freigegeben') {
    warnings.push(tr(RULE_APPROVAL_WARNING));
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
