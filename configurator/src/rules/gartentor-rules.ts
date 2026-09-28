// Diese Datei ist der strenge, aber freundliche Prüfer fürs Gartentor.
// Sie schaut: Ist das Tor zu schmal? Zu breit? Zu hoch? Dann gibt es eine
// Warnung (gelb) oder einen Fehler (rot) – wie eine Verkehrsampel.
import type { GartentorInputs } from '../products/gartentor/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';
import { RULE_APPROVAL_WARNING } from './gelaender-rules';
import { tr } from '../i18n';

// Die Regel-Liste: Welche Zahlen gelten als Grenzen? (kleinste Öffnung,
// grösste Höhe usw.). Wie die Regeln bei einem Brettspiel.
/**
 * Regelkatalog Gartentor, ruleVersion 0.0.1.
 * Alle Zahlenwerte sind TESTDATEN (A-004) – Ampel bleibt maximal GELB,
 * der Server prüft beim Absenden erneut.
 */
export interface GartentorRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  minOeffnungMm: number;
  /** Maximale lichte Öffnung einflügelig / zweiflügelig. */
  maxOeffnungEinMm: number;
  maxOeffnungZweiMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
  /** Spalt je Seite (Band-/Schlossseite) und zwischen den Flügeln. */
  spaltMm: number;
  minBodenfreiheitMm: number;
  maxBodenfreiheitMm: number;
  /** Ab dieser Torhöhe drei statt zwei Bänder je Flügel. */
  drittesBandAbHoeheMm: number;
  /** Maximaler lichter Stababstand der Füllung. */
  maxStabLichtMm: number;
}

// Die aktuellen Grenzwerte. Achtung: Es sind noch Testzahlen!
// 🤧 Schnupfspruch: Drizähhundert fürs Einte, drüütuusigzweihundert fürs Zwei –
//    wer no meh wott, gaht zum Meister sälber verbi.
export const GARTENTOR_RULES_V0: GartentorRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  minOeffnungMm: 700,
  maxOeffnungEinMm: 1300,
  maxOeffnungZweiMm: 3200,
  minHoeheMm: 600,
  maxHoeheMm: 1800,
  spaltMm: 15,
  minBodenfreiheitMm: 20,
  maxBodenfreiheitMm: 100,
  drittesBandAbHoeheMm: 1200,
  maxStabLichtMm: 110,
};

// validateGartentor: Geht Punkt für Punkt durch und notiert alles,
// was nicht passt – wie eine Lehrerin, die ein Diktat korrigiert.
export function validateGartentor(
  inputs: GartentorInputs,
  selectedProfiles: readonly Profile[],
  params: GartentorRuleParams = GARTENTOR_RULES_V0
): ValidationResult {
  // Zwei Notizblöcke: einer für Warnungen, einer für echte Fehler.
  const warnings: string[] = [];
  const errors: string[] = [];

  // Prüfung der Breite: nicht zu schmal, und je nach Flügelzahl nicht zu breit.
  const b = inputs.oeffnungBreiteMm;
  if (b !== null) {
    if (b < params.minOeffnungMm) {
      errors.push(
        tr('Öffnung {b} mm ist schmaler als das Minimum von {min} mm.', {
          b,
          min: params.minOeffnungMm,
        })
      );
    }
    if (inputs.fluegelart === 'ein' && b > params.maxOeffnungEinMm) {
      errors.push(
        tr(
          'Einflügelig bis {max} mm Öffnung – bitte zweiflügelig wählen oder individuell anfragen.',
          { max: params.maxOeffnungEinMm }
        )
      );
    }
    if (inputs.fluegelart === 'zwei' && b > params.maxOeffnungZweiMm) {
      errors.push(
        tr(
          'Öffnung {b} mm überschreitet das Maximum von {max} mm – bitte als Toranlage individuell anfragen.',
          { b, max: params.maxOeffnungZweiMm }
        )
      );
    }
  }

  // Prüfung der Höhe: Sie muss zwischen Minimum und Maximum liegen.
  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        tr('Torhöhe {h} mm liegt ausserhalb des Bereichs {min}–{max} mm.', {
          h: inputs.hoeheMm,
          min: params.minHoeheMm,
          max: params.maxHoeheMm,
        })
      );
    }
  }

  // Bodenfreiheit: Der Spalt unter dem Tor darf nicht zu klein sein
  // (sonst schleift es am Boden) und nicht zu gross (sonst schlüpft der Hase durch).
  // 🤧 Schnupfspruch: Under em Tor e Hand breit Luft –
  //    das isch für s Igeli, nöd für de Schuft.
  if (
    inputs.bodenfreiheitMm < params.minBodenfreiheitMm ||
    inputs.bodenfreiheitMm > params.maxBodenfreiheitMm
  ) {
    errors.push(
      tr('Bodenfreiheit {b} mm liegt ausserhalb des Bereichs {min}–{max} mm.', {
        b: inputs.bodenfreiheitMm,
        min: params.minBodenfreiheitMm,
        max: params.maxBodenfreiheitMm,
      })
    );
  }

  // Ab hier kommen nur noch gelbe Hinweise, keine roten Fehler:
  // Wenn die Masse nur geschätzt sind, misst der Schmied selber nach.
  if (inputs.masseUngefaehr) {
    warnings.push(tr('Ungefähre Masse: Vor der Fertigung wird vor Ort ausgemessen.'));
  }

  // Weicher Boden (Mergel, Pflaster) braucht besondere Fundamente.
  if (inputs.untergrund === 'unbekannt') {
    warnings.push(tr('Untergrund/Fundamente werden beim Aufmass geprüft.'));
  } else if (inputs.untergrund && inputs.untergrund !== 'beton') {
    warnings.push(tr('Für Torpfosten in weichem Untergrund werden Fundamente fachlich dimensioniert.'));
  }

  // Eine alte Mauer muss man zuerst anschauen, ob sie das Tor tragen kann.
  if (inputs.seitenbau === 'mauer') {
    warnings.push(tr('Befestigung an bestehender Mauer: Zustand und Tragfähigkeit werden vor Ort geprüft.'));
  }

  // Motor für später vorbereiten? Das bespricht man persönlich.
  if (inputs.antriebVorbereitung) {
    warnings.push(tr('Antriebs-Vorbereitung (Leerrohr): Die konkrete Motorisierung wird persönlich geprüft und offeriert.'));
  }

  // Geschmiedete Ornamente sind Handarbeit – da redet der Meister mit.
  if (inputs.fuellung === 'geschmiedet') {
    warnings.push(tr('Charakter-Füllung: Ornament-Grundauswahl – die handwerkliche Ausarbeitung plant unser Meister persönlich.'));
  }

  // Hohe Tore fangen viel Wind wie ein Segel. Das muss man nachrechnen.
  if (inputs.hoeheMm !== null && inputs.hoeheMm > 1400) {
    warnings.push(tr('Hohe Torflügel: Windlast und Bandbelastung werden statisch geprüft.'));
  }

  // Jedes ausgewählte Profil (Eisenstange) prüfen: Gibt es sie noch?
  // Ist sie schon offiziell freigegeben?
  // 🤧 Schnupfspruch: Es Profil, wo nümme git,
  //    das schmiedet au de bescht Meischter nit.
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

  // Solange die Regeln selber noch nicht freigegeben sind, gibt es immer eine Warnung.
  if (params.approval !== 'freigegeben') {
    warnings.push(tr(RULE_APPROVAL_WARNING));
  }

  // Die Ampel: Gibt es Fehler, wird sie rot. Sonst höchstens gelb
  // (nie grün, weil alles noch Testdaten sind).
  // 🤧 Schnupfspruch: Rot heisst Halt und Gäl heisst Lueg –
  //    und Grüen gits erscht, wänn de Meister seit: gnueg!
  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
