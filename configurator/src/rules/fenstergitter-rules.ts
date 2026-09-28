// Der Prüfer fürs Fenstergitter. Er schaut, ob alles erlaubt und sicher ist,
// und gibt gelbe Hinweise oder rote Fehler – wie eine Verkehrsampel.
// Besonders wichtig: Durch ein Fluchtweg-Fenster muss man bei Gefahr hinaus
// können, darum darf dort kein festes Gitter hin.
import type { FenstergitterInputs } from '../products/fenstergitter/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { BFU_RICHTWERTE, RULE_APPROVAL_WARNING } from './gelaender-rules';
import { tr } from '../i18n';

// Die Spielregeln fürs Fenstergitter (Abstände, grösste und kleinste Masse …).
/**
 * Regelkatalog Fenstergitter, ruleVersion 0.0.1.
 * Alle Zahlenwerte sind TESTDATEN (A-004) – Ampel bleibt maximal GELB,
 * der Server prüft beim Absenden erneut.
 */
export interface FenstergitterRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  /** Spielraum je Seite bei Leibungsmontage (Lichtmass → Aussenmass). */
  leibungSpielMm: number;
  /** Überstand je Seite bei Montage vor der Wand. */
  vorwandUeberstandMm: number;
  /** Maximaler lichter Stababstand. */
  maxStabLichtMm: number;
  minBreiteMm: number;
  maxBreiteMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
  /** Ab dieser Gitterhöhe drei statt zwei Laschen je Seite. */
  dritteLascheAbHoeheMm: number;
}

// Die aktuellen Zahlen – noch Testwerte, bis der Meister sie freigibt.
// 🤧 Schnupfspruch: Füfzäh Millimeter Spiel, sächzg Millimeter Rand –
//    so passt s Gitter i jedes Fäischter im ganze Land.
export const FENSTERGITTER_RULES_V0: FenstergitterRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  leibungSpielMm: 15,
  vorwandUeberstandMm: 60,
  maxStabLichtMm: 130,
  minBreiteMm: 300,
  maxBreiteMm: 2500,
  minHoeheMm: 300,
  maxHoeheMm: 2200,
  dritteLascheAbHoeheMm: 1200,
};

// validateFenstergitter: Geht alle Punkte durch und notiert, was auffällt.
export function validateFenstergitter(
  inputs: FenstergitterInputs,
  selectedProfiles: readonly Profile[],
  params: FenstergitterRuleParams = FENSTERGITTER_RULES_V0
): ValidationResult {
  // Zwei Notizblöcke: Warnungen (gelb) und Fehler (rot).
  const warnings: string[] = [];
  const errors: string[] = [];

  // Ein Fluchtweg ist ein Fenster, durch das man bei Feuer hinausklettern kann.
  // Ein festes Gitter würde den Weg versperren – das geht nicht!
  // Fluchtweg: fest montierte Gitter sind dort nicht zulässig.
  if (inputs.fluchtweg === 'ja') {
    errors.push(
      tr(
        'Fluchtweg-Fenster dürfen nicht fest vergittert werden – dafür braucht es eine öffenbare Sonderlösung. Bitte als individuelle Ausführung anfragen.'
      )
    );
  } else if (inputs.fluchtweg === 'unbekannt') {
    warnings.push(
      tr(
        'Ob das Fenster ein Fluchtweg ist, wird vor der Ausführung verbindlich geklärt (Baurecht/Brandschutz).'
      )
    );
  }

  // Ist die Breite im erlaubten Bereich?
  if (inputs.breiteMm !== null) {
    if (inputs.breiteMm < params.minBreiteMm || inputs.breiteMm > params.maxBreiteMm) {
      errors.push(
        tr('Breite {b} mm liegt ausserhalb des Bereichs {min}–{max} mm – bitte individuell anfragen.', {
          b: inputs.breiteMm,
          min: params.minBreiteMm,
          max: params.maxBreiteMm,
        })
      );
    }
  }
  // Ist die Höhe im erlaubten Bereich?
  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        tr('Höhe {h} mm liegt ausserhalb des Bereichs {min}–{max} mm – bitte individuell anfragen.', {
          h: inputs.hoeheMm,
          min: params.minHoeheMm,
          max: params.maxHoeheMm,
        })
      );
    }
  }

  // Nur ungefähr gemessen? Dann misst der Schmied nochmals nach.
  if (inputs.masseUngefaehr) {
    warnings.push(
      tr('Ungefähre Masse: Vor der Fertigung wird am Fenster ausgemessen (Aufmass).')
    );
  }

  // Unbekannte oder bröckelige Wand (Backstein): Das schaut sich ein Profi an.
  if (inputs.untergrund === 'unbekannt') {
    warnings.push(tr('Befestigungsuntergrund wird vor Ort geprüft.'));
  }
  if (inputs.untergrund === 'backstein') {
    warnings.push(
      tr('Backstein/Mauerwerk: Dübelwahl und Randabstände werden fachlich bestimmt.')
    );
  }

  // Draussen regnet es – das Gitter braucht guten Schutz gegen Rost.
  // 🤧 Schnupfspruch: Dusse Räge, dinne Rueh –
  //    guet pulverbeschichtet, dänn gits kei Rost dezue.
  if (inputs.einbauort === 'aussen') {
    warnings.push(tr('Ausseneinsatz: Korrosionsschutz wird entsprechend ausgelegt.'));
  }

  // Wunsch-Stabdicke, die nicht im Katalog ist: wird extra geprüft.
  if (inputs.stabWunschDm !== null) {
    warnings.push(
      tr('Sonderprofil Stab Ø {d} mm: kein Katalogprofil – Machbarkeit wird fachlich geprüft.', {
        d: inputs.stabWunschDm,
      })
    );
  }

  // Zierelemente: Da hilft der Meister persönlich.
  if (inputs.ornamentTyp) {
    warnings.push(
      tr(
        'Zierelemente: Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich (Manufaktur).'
      )
    );
  }

  // Dieser Hinweis kommt immer: Die Lücken werden mit einer Kugel geprüft,
  // die so gross ist wie ein Kinderkopf. Passt die Kugel nicht durch, ist es sicher.
  // 🤧 Schnupfspruch: D Chugle probiert s und bliibt stecke im Gitter –
  //    so isch s für d Chind sicher, und für d Eltere nüt Bitters.
  warnings.push(
    tr('Stabteilung wird einbruchhemmend und kindersicher geprüft (BFU-Richtwert {d}-mm-Kugel).', {
      d: BFU_RICHTWERTE.kugelDurchmesserMm,
    })
  );

  // Jedes gewählte Profil prüfen: gibt es das noch, ist es freigegeben?
  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(tr('Profil «{name}» ist nicht mehr verfügbar.', { name: tr(profile.name) }));
    } else if (!isProductionReady(profile)) {
      warnings.push(
        tr('Profil «{name}» ist noch nicht fachlich freigegeben ({approval}).', {
          name: tr(profile.name),
          approval: tr(profile.approval),
        })
      );
    }
  }

  // Regeln noch nicht freigegeben? Dann immer eine Warnung.
  if (params.approval !== 'freigegeben') {
    warnings.push(tr(RULE_APPROVAL_WARNING));
  }

  // Die Ampel: rot bei Fehlern, sonst gelb.
  // 🤧 Schnupfspruch: Gäl isch d Ample, s Gitter isch guet –
  //    de Meister lueget s no a, dänn hät me Muet.
  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
