import type { GelaenderInputs } from '../products/gelaender/types';
import type { Profile, ValidationResult } from '../products/types';
import { isProductionReady } from './profiles';

/**
 * Regelkatalog Geländer, ruleVersion 0.0.1.
 *
 * ACHTUNG: Sämtliche Zahlenwerte sind TESTDATEN für Entwicklung und
 * 3D-Darstellung. Kein Wert ist fachlich freigegeben (Annahme A-004).
 * Solange approval != 'freigegeben', kann keine Konfiguration besser
 * als GELB klassifiziert werden und alle abgeleiteten Stückzahlen
 * gelten als provisorisch. Der Server prüft beim Absenden erneut.
 */
export interface GelaenderRuleParams {
  approval: 'freigegeben' | 'fachliche Freigabe erforderlich';
  /** Maximaler Pfostenabstand (Achsmass) in mm. */
  maxPfostenabstandMm: number;
  /** Maximaler lichter Abstand zwischen Füllstäben in mm. */
  maxStabAbstandMm: number;
  /** Maximaler lichter Abstand zwischen Querstab-Lagen (Reling) in mm. */
  maxQuerstabAbstandMm: number;
  /** Visuelle/prov. Bodenfreiheit der Füllung in mm. */
  bodenfreiheitMm: number;
  /** Maximaler Pfostenabstand bei Glasfüllung in mm. */
  maxPfostenabstandGlasMm: number;
  minSegmentLaengeMm: number;
  maxSegmentLaengeMm: number;
  minHoeheMm: number;
  maxHoeheMm: number;
  minFussplatteMm: number;
  maxFussplatteMm: number;
  minFussplatteDickeMm: number;
  maxFussplatteDickeMm: number;
  minWunschDmMm: number;
  maxWunschDmMm: number;
}

export const GELAENDER_RULES_V0: GelaenderRuleParams = {
  approval: 'fachliche Freigabe erforderlich',
  // TESTDATEN – dienen nur der Plausibilisierung und 3D-Vorschau.
  // Statikabhängige Werte (Abstände, Querschnitte) dürfen gemäss
  // Fachgrundlage NIE allein aus Konfigurator-Tabellen stammen.
  maxPfostenabstandMm: 1500,
  maxStabAbstandMm: 110,
  maxQuerstabAbstandMm: 120,
  bodenfreiheitMm: 50,
  maxPfostenabstandGlasMm: 1000,
  minSegmentLaengeMm: 300,
  maxSegmentLaengeMm: 6000,
  minHoeheMm: 800,
  maxHoeheMm: 1300,
  // Fussplatten-Wunschmasse (Vorschau; definitive Platte wird bemessen).
  minFussplatteMm: 80,
  maxFussplatteMm: 300,
  minFussplatteDickeMm: 6,
  maxFussplatteDickeMm: 25,
  // Sonderprofil-Wunschmasse (rund), rein für Vorschau/Anfrage.
  minWunschDmMm: 8,
  maxWunschDmMm: 76,
};

/**
 * BFU-Richtwerte aus der Fachdokumentation 2.003 «Geländer und Brüstungen»
 * (Ausgabe 2020) – quellenreferenzierte Planungsgrundsätze, KEINE
 * pauschale Objektfreigabe (docs/gelaender-fachgrundlagen.md).
 * Kantonales/kommunales Baurecht kann strenger sein → Ampel bleibt
 * maximal GELB, die Objektfreigabe ist immer fachlich.
 */
export const BFU_RICHTWERTE = {
  /** Ab dieser Absturzhöhe ist ein Schutzelement erforderlich. */
  schutzAbAbsturzhoeheMm: 1000,
  /** Geländerhöhe im Regelfall (Treppenlauf: 900 – eigener Konfigurator). */
  minGelaenderhoeheMm: 1000,
  /** Bis zu dieser Höhe darf die 12-cm-Kugel nicht durch Öffnungen passen. */
  kinderschutzZoneMm: 750,
  kugelDurchmesserMm: 120,
  /** Lochfüllungen schwer bekletterbar: Öffnungen ≤ ca. 5 cm. */
  maxLochblechOeffnungMm: 50,
  /** Netze/Gitter schwer bekletterbar: Maschenweite ≤ ca. 4 cm. */
  maxMaschenweiteMm: 40,
} as const;

export const RULE_APPROVAL_WARNING =
  'Die technischen Produktregeln (Abstände, Grenzmasse) sind noch nicht fachlich freigegeben – ' +
  'Stückzahlen und Masse in der Vorschau sind provisorisch. Unser Meister prüft jede Anfrage persönlich.';

export function validateGelaender(
  inputs: GelaenderInputs,
  selectedProfiles: readonly Profile[],
  params: GelaenderRuleParams = GELAENDER_RULES_V0
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const segment of inputs.segmentLaengenMm) {
    if (segment < params.minSegmentLaengeMm) {
      errors.push(
        `Segmentlänge ${segment} mm liegt unter dem Minimum von ${params.minSegmentLaengeMm} mm.`
      );
    }
    if (segment > params.maxSegmentLaengeMm) {
      errors.push(
        `Segmentlänge ${segment} mm überschreitet das Maximum von ${params.maxSegmentLaengeMm} mm – bitte als individuelle Ausführung anfragen.`
      );
    }
  }

  if (inputs.hoeheMm !== null) {
    if (inputs.hoeheMm < params.minHoeheMm || inputs.hoeheMm > params.maxHoeheMm) {
      errors.push(
        `Höhe ${inputs.hoeheMm} mm liegt ausserhalb des zulässigen Bereichs (${params.minHoeheMm}–${params.maxHoeheMm} mm).`
      );
    }
    // BFU: Regelfall ≥ 1.00 m Geländerhöhe bei Absturzsicherung.
    if (
      inputs.absturzhoehe === 'ueber-1m' &&
      inputs.hoeheMm < BFU_RICHTWERTE.minGelaenderhoeheMm
    ) {
      errors.push(
        `Bei über 1 m Absturzhöhe gilt der BFU-Richtwert von mindestens ${BFU_RICHTWERTE.minGelaenderhoeheMm} mm Geländerhöhe – bitte Höhe anpassen oder individuell prüfen lassen.`
      );
    }
  }

  // Konstruktive Höhenordnung: Untergurt < Knieleiste < Obergurt < Oberkante.
  if (inputs.hoeheMm) {
    const ober = inputs.mitObergurt ? inputs.obergurtHoeheMm : null;
    const knie = inputs.mitKnieleiste ? inputs.knieleisteHoeheMm : null;
    if (inputs.mitUntergurt && inputs.untergurtHoeheMm >= inputs.hoeheMm / 2) {
      errors.push('Der Untergurt liegt unplausibel hoch – bitte Höhe prüfen.');
    }
    if (ober !== null && ober !== undefined) {
      if (ober >= inputs.hoeheMm) {
        errors.push('Der Obergurt muss unterhalb der Geländeroberkante liegen.');
      }
      if (inputs.mitUntergurt && ober <= inputs.untergurtHoeheMm) {
        errors.push('Der Obergurt muss über dem Untergurt liegen.');
      }
    }
    if (knie !== null && knie !== undefined) {
      if (knie >= (ober ?? inputs.hoeheMm)) {
        errors.push('Die Knieleiste muss unterhalb des Ober- bzw. Handlaufgurts liegen.');
      }
      if (inputs.mitUntergurt && knie <= inputs.untergurtHoeheMm) {
        errors.push('Die Knieleiste muss über dem Untergurt liegen.');
      }
    }
  }

  // Fussplatten-Wunschmasse (nur bei aufgesetzter Montage relevant).
  if (inputs.montageart === 'boden') {
    const { fussplatteLaengeMm: fl, fussplatteBreiteMm: fb, fussplatteDickeMm: fd } = inputs;
    if (
      fl < params.minFussplatteMm || fl > params.maxFussplatteMm ||
      fb < params.minFussplatteMm || fb > params.maxFussplatteMm ||
      fd < params.minFussplatteDickeMm || fd > params.maxFussplatteDickeMm
    ) {
      errors.push(
        `Fussplatten-Masse ausserhalb des Vorschaubereichs (${params.minFussplatteMm}–${params.maxFussplatteMm} mm, Dicke ${params.minFussplatteDickeMm}–${params.maxFussplatteDickeMm} mm).`
      );
    }
    warnings.push(
      'Fussplatte und Verankerung (Dübel, Randabstände) werden statisch bemessen – Ihre Masse gelten als Wunsch.'
    );
  }

  // Sonderprofile (Wunschmass) sind immer prüfpflichtig.
  for (const [wert, teil] of [
    [inputs.handlaufWunschDm, 'Handlauf'],
    [inputs.fuellstabWunschDm, 'Staketen'],
  ] as const) {
    if (wert !== null) {
      if (wert < params.minWunschDmMm || wert > params.maxWunschDmMm) {
        errors.push(
          `Wunschmass ${teil} Ø ${wert} mm liegt ausserhalb des Vorschaubereichs (${params.minWunschDmMm}–${params.maxWunschDmMm} mm).`
        );
      } else {
        warnings.push(
          `Sonderprofil ${teil} Ø ${wert} mm: kein Katalogprofil – Machbarkeit und Statik werden fachlich geprüft.`
        );
      }
    }
  }

  if (inputs.fuellungsart === 'geschmiedet') {
    warnings.push(
      'Charakter-Familie: Die gewählten Ornamente sind eine Grundauswahl – Aufteilung und handwerkliche Ausarbeitung plant unser Meister persönlich mit Ihnen (Manufaktur).'
    );
  }

  if (inputs.absturzhoehe === 'unbekannt') {
    warnings.push(
      'Absturzhöhe unbekannt: Sie wird beim Aufmass gemessen – massgebend ist die begehbare bzw. besteigbare Fläche (BFU).'
    );
  }

  // Kinderschutz (BFU): 12-cm-Kugel bis 75 cm, Kletterwirkung.
  const kindersicherPlanen = inputs.kinderschutz !== 'nein';
  if (kindersicherPlanen) {
    if (inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet') {
      warnings.push(
        `Kinderschutz: Bis ${BFU_RICHTWERTE.kinderschutzZoneMm} mm Höhe darf die ${BFU_RICHTWERTE.kugelDurchmesserMm}-mm-Kugel nicht durch Öffnungen passen – die definitive Stabteilung wird danach geprüft.`
      );
    }
    if (inputs.fuellungsart === 'blech' && inputs.blechTyp === 'loch') {
      warnings.push(
        `Kinderschutz: Lochblech gilt bis ca. ${BFU_RICHTWERTE.maxLochblechOeffnungMm} mm Öffnung als schwer bekletterbar (BFU) – Lochbild wird entsprechend gewählt.`
      );
    }
    if (inputs.fuellungsart === 'blech' && inputs.blechTyp === 'laser') {
      warnings.push(
        'Kinderschutz: Laserschnitt-Ausschnitte werden auf Kletterwirkung und Öffnungsgrössen fachlich geprüft; Kanten werden entgratet/abgedeckt (BFU).'
      );
    }
    if (inputs.fuellungsart === 'gitter') {
      warnings.push(
        `Kinderschutz: Maschenweite bis ca. ${BFU_RICHTWERTE.maxMaschenweiteMm} mm gilt als schwer bekletterbar (BFU) – wird bei der Gitterwahl berücksichtigt.`
      );
    }
  }

  for (const profile of selectedProfiles) {
    if (!profile.active) {
      errors.push(`Profil «${profile.name}» ist nicht mehr verfügbar.`);
    } else if (!isProductionReady(profile)) {
      warnings.push(
        `Profil «${profile.name}» ist noch nicht fachlich freigegeben (${profile.approval}).`
      );
    }
  }

  if (inputs.masseUngefaehr) {
    warnings.push(
      'Ungefähre Masse: Vor der Offerte ist ein Aufmass oder eine Massbestätigung nötig.'
    );
  }

  if (inputs.untergrund === 'unbekannt') {
    warnings.push('Befestigungsuntergrund muss vor Ort geprüft werden.');
  }

  if (inputs.farbe === 'individuell') {
    warnings.push('Individuelle Farbe: wird als Sonderwunsch persönlich geprüft.');
  }

  if (inputs.fuellungsart === 'querstab') {
    warnings.push(
      kindersicherPlanen
        ? 'Querstäbe (Reling) wirken als Leiter – in Bereichen mit Kindern wird das Schutzziel damit oft nicht erreicht (BFU). Wir prüfen Alternativen (Staketen, Glas, vorgesetzte Füllung) oder sehr enge Abstände.'
        : 'Querstäbe (Reling) gelten als erkletterbar – die Eignung Ihrer Einbausituation wird fachlich geprüft (BFU).'
    );
  }

  if (inputs.fuellungsart === 'blech' && inputs.blechTyp === 'voll') {
    warnings.push(
      'Vollblech: Windlast, Wasserablauf und Befestigung der Füllung werden fachlich dimensioniert.'
    );
  }

  // Einsatzort-spezifische Hinweise (Fachgrundlage Abschnitt 1).
  if (inputs.einsatzort === 'attika') {
    warnings.push(
      'Dachterrasse/Attika: Dachhaut, Abdichtung, Entwässerung und Windexposition erfordern eine Detailabklärung vor Ort.'
    );
  }
  if (inputs.einsatzort === 'franz-balkon') {
    warnings.push(
      'Französischer Balkon: Befestigung an Fassade/Leibung und Fensteröffnung werden objektspezifisch geplant.'
    );
    if (inputs.montageart && inputs.montageart !== 'wand' && inputs.montageart !== 'seite') {
      warnings.push(
        'Hinweis: Für französische Balkone ist üblicherweise die Wand- oder seitliche Befestigung geeignet.'
      );
    }
  }
  if (inputs.einsatzort === 'garten') {
    warnings.push(
      'Garten/Stützmauer: Terrainverlauf, Absturzhöhe und Fundament/Mauerkrone werden beim Aufmass geprüft.'
    );
  }
  if (inputs.montageart === 'unten') {
    warnings.push(
      'Befestigung von unten (Kragarm): höhere Hebelarme und Zugänglichkeit – wird statisch und montagetechnisch geprüft.'
    );
  }
  if (inputs.montageart === 'eingelassen') {
    warnings.push(
      'Eingelassene Befestigung: Einbauteile müssen früh mit dem Baumeister koordiniert werden (Höhen, Toleranzen, Bauphasenschutz).'
    );
  }

  if (inputs.fuellungsart === 'glas') {
    warnings.push(
      'Glasaufbau und Glasstärke (Sicherheitsglas) werden bei der fachlichen Prüfung verbindlich festgelegt.'
    );
    if (inputs.ohneHandlauf) {
      warnings.push(
        'Ausführung ohne Handlauf: Zulässigkeit wird für Ihre Einbausituation fachlich geprüft.'
      );
    }
  }

  if (params.approval !== 'freigegeben') {
    warnings.push(RULE_APPROVAL_WARNING);
  }

  if (errors.length > 0) {
    return { level: 'red', warnings, errors };
  }
  return { level: 'yellow', warnings, errors };
}
