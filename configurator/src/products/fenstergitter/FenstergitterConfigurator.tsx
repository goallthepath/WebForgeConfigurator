// Das ist die Bildschirmseite, auf der man ein Fenstergitter zusammenstellt.
// Man beantwortet Frage um Frage (wo, wie gross, welche Stäbe, welche Farbe),
// und rechts wächst das Gitter in 3D mit – wie ein Bastelbogen, der sich selber faltet.
// Der Entwurf wird im Browser gemerkt, damit nichts verloren geht.
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { tr } from '../../i18n';
import { StepSection } from '../../components/ui/StepSection';
import { OptionCardGroup } from '../../components/ui/OptionCardGroup';
import { NumberField } from '../../components/ui/NumberField';
import { GitterViewer } from '../../viewer/GitterViewer';
import { describeEstimate, estimateFor } from '../../pricing/estimate';
import { profilesForUse } from '../../rules/profiles';
import {
  FENSTERGITTER_RULES_V0,
  validateFenstergitter,
} from '../../rules/fenstergitter-rules';
import { GELAENDER_RULES_V0 } from '../../rules/gelaender-rules';
import { getProductModule } from '../catalog';
import {
  CATALOG_VERSION,
  crossSectionLabel,
  FINISHES,
  getProfile,
  MATERIALS,
  PROFILES,
  profilBreiteMm,
} from '../profile-catalog';
import type { Profile, ProfileRole } from '../types';
import {
  FARBEN,
  farbHex,
  MONTAGE_SERVICES,
  ORNAMENT_LAGEN,
  ORNAMENT_TYPEN,
  type OptionDef,
} from '../gelaender/options';
import { deriveFenstergitter, gitterMaterialAuszug } from './derive';
import { buildGitterGeometry } from './geometry';
import {
  DEFAULT_FENSTERGITTER_INPUTS,
  type FenstergitterInputs,
  type Fluchtweg,
  type GitterEinbauort,
  type GitterMasstyp,
  type GitterMontage,
  type GitterUntergrund,
  type Stabanordnung,
} from './types';

// Name der «Schublade» im Browser, in der wir den Entwurf aufbewahren.
const STORAGE_KEY = 'webforge-fenstergitter-draft-v2';

// Auswahlkarten: Kommt das Gitter nach draussen (Regen!) oder nach drinnen?
const EINBAUORTE_G: OptionDef<GitterEinbauort>[] = [
  { id: 'aussen', label: 'Aussen', description: 'Fassadenseitig – Witterung und Korrosionsschutz beachten.' },
  { id: 'innen', label: 'Innen', description: 'Raumseitig, z. B. Kellerfenster von innen.' },
];

// Ist das Fenster ein Fluchtweg? Das ist eine sehr wichtige Sicherheitsfrage.
const FLUCHTWEG_OPTIONEN: OptionDef<Fluchtweg>[] = [
  { id: 'nein', label: 'Nein', description: 'Kein Flucht- oder Rettungsweg.' },
  {
    id: 'ja',
    label: 'Ja',
    description: 'Fluchtweg – feste Gitter sind nicht zulässig (öffenbare Sonderlösung nötig).',
  },
  { id: 'unbekannt', label: 'Weiss ich nicht', description: 'Wird vor der Ausführung geklärt.' },
];

// Wo sitzt das Gitter: in der Fensternische oder vor der Wand?
// Die kleinen Bildchen (icons) zeigen es als winzige Zeichnung.
// 🤧 Schnupfspruch: I de Nische versteckt oder stolz vor de Wand –
//    es Gitter vom Schmied isch s schönscht im Land.
const MONTAGE_OPTIONEN: OptionDef<GitterMontage>[] = [
  {
    id: 'leibung',
    label: 'In der Leibung',
    description: 'Gitter sitzt in der Fensternische – dezent, geschützt.',
    icon: '<rect x="8" y="8" width="32" height="32"/><rect x="14" y="14" width="20" height="20"/><line x1="18" y1="14" x2="18" y2="34"/><line x1="24" y1="14" x2="24" y2="34"/><line x1="30" y1="14" x2="30" y2="34"/>',
  },
  {
    id: 'vorwand',
    label: 'Vor der Fassade',
    description: 'Gitter überdeckt die Öffnung aussen – kräftige Wirkung.',
    icon: '<rect x="12" y="12" width="24" height="24"/><rect x="6" y="6" width="36" height="36" stroke-dasharray="3 3"/><line x1="18" y1="6" x2="18" y2="42"/><line x1="24" y1="6" x2="24" y2="42"/><line x1="30" y1="6" x2="30" y2="42"/>',
  },
];

// Woraus ist die Wand? Beton, Backstein, Holz – oder weiss man es nicht?
const UNTERGRUENDE_G: OptionDef<GitterUntergrund>[] = [
  { id: 'beton', label: 'Beton', description: 'Betonleibung oder -wand.' },
  { id: 'backstein', label: 'Backstein / Mauerwerk', description: 'Dübelwahl wird fachlich bestimmt.' },
  { id: 'holz', label: 'Holz', description: 'Holzrahmen oder Riegelbau.' },
  { id: 'unbekannt', label: 'Weiss ich nicht', description: 'Wird vor Ort geprüft.' },
];

// Was hat man gemessen: das Loch in der Wand oder das fertige Gitter?
const MASSTYPEN: OptionDef<GitterMasstyp>[] = [
  {
    id: 'lichtmass',
    label: 'Leibungs-Lichtmass',
    description: 'Gemessene Breite/Höhe der Fensteröffnung – wir leiten das Gittermass ab.',
  },
  {
    id: 'aussenmass',
    label: 'Gitter-Aussenmass',
    description: 'Sie geben das gewünschte Aussenmass des Gitters direkt vor.',
  },
];

// Nur senkrechte Stäbe, oder zusätzlich waagrechte Quergurte?
const STABANORDNUNGEN: OptionDef<Stabanordnung>[] = [
  {
    id: 'vertikal',
    label: 'Vertikale Stäbe',
    description: 'Klassisches Fenstergitter – schlicht und wirksam.',
    icon: '<rect x="8" y="8" width="32" height="32"/><line x1="15" y1="8" x2="15" y2="40"/><line x1="22" y1="8" x2="22" y2="40"/><line x1="29" y1="8" x2="29" y2="40"/><line x1="36" y1="8" x2="36" y2="40"/>',
  },
  {
    id: 'vertikal-quergurt',
    label: 'Vertikal mit Quergurt',
    description: 'Zusätzliche Quergurte – steifer und gestalterisch gegliedert.',
    icon: '<rect x="8" y="8" width="32" height="32"/><line x1="15" y1="8" x2="15" y2="40"/><line x1="22" y1="8" x2="22" y2="40"/><line x1="29" y1="8" x2="29" y2="40"/><line x1="36" y1="8" x2="36" y2="40"/><line x1="8" y1="24" x2="40" y2="24"/>',
  },
];

// Zierelemente: «ohne» plus alle Ornamente aus der gemeinsamen Liste.
// 🤧 Schnupfspruch: Es Ringli, e Schnörkel, es Chörbli us Iise –
//    so cha sogar es Chällergitter vornehm riise.
const ZIER_OPTIONEN: OptionDef<'ohne' | 'ringe' | 'voluten' | 'koerbe'>[] = [
  { id: 'ohne', label: 'Ohne Zier', description: 'Rein funktional – Stäbe und Rahmen.' },
  ...ORNAMENT_TYPEN,
];

// Die Aufträge an den Reducer: «set» = etwas ändern, «reset» = von vorne.
type Action =
  | { type: 'set'; patch: Partial<FenstergitterInputs> }
  | { type: 'reset' };

// Der Reducer, unser ordentlicher Hausmeister: Er übernimmt die neuen Antworten
// und räumt auf, was nicht mehr passt.
function reducer(
  state: FenstergitterInputs,
  action: Action
): FenstergitterInputs {
  switch (action.type) {
    case 'set': {
      // Neue Antworten über die alten legen.
      const next = { ...state, ...action.patch };
      // Neues Material? Dann passen vielleicht die Profile und die Oberfläche nicht mehr.
      if (action.patch.materialId) {
        for (const key of ['rahmenProfilId', 'stabProfilId'] as const) {
          const id = next[key];
          if (id) {
            const prof = PROFILES.find((p) => p.profileId === id);
            if (prof && prof.material !== action.patch.materialId) next[key] = null;
          }
        }
        const finish = FINISHES.find((f) => f.finishId === next.finishId);
        if (finish && !finish.allowedMaterials.includes(action.patch.materialId)) {
          next.finishId = null;
        }
      }
      return next;
    }
    // Zurück zum Beispiel-Gitter.
    case 'reset':
      return DEFAULT_FENSTERGITTER_INPUTS;
  }
}

// loadInitial: Alten Entwurf suchen – zuerst im Link, dann in der Schublade.
// 🤧 Schnupfspruch: Wer sis Gitter im Link verstaut,
//    findet s wider – au wänn de Computer mal miaut.
function loadInitial(): FenstergitterInputs {
  try {
    // Steckt eine Konfiguration im Link (?c=…)? Dann auspacken.
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    if (fromUrl) {
      return {
        ...DEFAULT_FENSTERGITTER_INPUTS,
        ...(JSON.parse(decodeURIComponent(atob(fromUrl))) as FenstergitterInputs),
      };
    }
    // Sonst in der Browser-Schublade nachschauen.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return {
        ...DEFAULT_FENSTERGITTER_INPUTS,
        ...(JSON.parse(stored) as FenstergitterInputs),
      };
    }
  } catch {
    // defekte Drafts still verwerfen
  }
  return DEFAULT_FENSTERGITTER_INPUTS;
}

// profileOptions: Alle Eisenprofile, die fürs Fenstergitter in dieser Rolle
// (Rahmen oder Stab) erlaubt sind – als Auswahlkarten.
function profileOptions(
  role: ProfileRole,
  materialId: string | null
): OptionDef<string>[] {
  return profilesForUse(PROFILES, 'fenstergitter', role)
    .filter((p) => !materialId || p.material === materialId)
    .map((p) => ({
      id: p.profileId,
      label: p.name.replace(/^TESTDATEN\s*/, ''),
      description: crossSectionLabel(p),
    }));
}

// Die Hauptkomponente der Seite: Hier kommt alles zusammen.
export function FenstergitterConfigurator() {
  const module = getProductModule('fenstergitter');
  // «inputs» = alle Antworten; «dispatch» = Aufträge an den Hausmeister schicken.
  const [inputs, dispatch] = useReducer(reducer, undefined, loadInitial);
  // Merkt sich, ob der Teilen-Link gerade kopiert oder angezeigt wird.
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shown'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  // Bei jeder Änderung den Entwurf in der Schublade speichern.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  // Abkürzung, damit man nur set({...}) schreiben muss.
  const set = (patch: Partial<FenstergitterInputs>) =>
    dispatch({ type: 'set', patch });

  // Wie dick ist ein Stab? Zuerst der Wunsch, dann das Profil, sonst 12 mm.
  const stabBreite = inputs.stabWunschDm
    ? inputs.stabWunschDm
    : inputs.stabProfilId
      ? profilBreiteMm(getProfile(inputs.stabProfilId)!)
      : 12;

  // Rechnen! useMemo ist ein Notizzettel: nur neu rechnen, wenn sich etwas ändert.
  const derived = useMemo(
    () => deriveFenstergitter(inputs, stabBreite),
    [inputs, stabBreite]
  );

  // Den 3D-Bauplan erstellen.
  const geometry = useMemo(
    () =>
      buildGitterGeometry(inputs, derived, {
        rahmen: inputs.rahmenProfilId ? getProfile(inputs.rahmenProfilId) : undefined,
        stab: inputs.stabProfilId ? getProfile(inputs.stabProfilId) : undefined,
      }),
    [inputs, derived]
  );

  // Alle gewählten Profile als Liste (leere Plätze weglassen).
  const selectedProfiles = useMemo(
    () =>
      [inputs.rahmenProfilId, inputs.stabProfilId]
        .map((id) => (id ? getProfile(id) : undefined))
        .filter((p): p is Profile => Boolean(p)),
    [inputs.rahmenProfilId, inputs.stabProfilId]
  );

  // Den Prüfer fragen: rot oder gelb?
  const validation = useMemo(
    () => validateFenstergitter(inputs, selectedProfiles),
    [inputs, selectedProfiles]
  );

  // Preis-Schätzung und Einkaufszettel.
  const estimate = estimateFor(module.priceVersion);
  const material = useMemo(
    () => gitterMaterialAuszug(inputs, derived),
    [inputs, derived]
  );

  // Sind Breite und Höhe vernünftig eingetragen?
  const masseOk =
    inputs.breiteMm !== null &&
    inputs.breiteMm > 0 &&
    inputs.hoeheMm !== null &&
    inputs.hoeheMm > 0;
  // Welche Schritte sind fertig? Erst dann geht der nächste auf – wie Türchen im Adventskalender.
  // 🤧 Schnupfspruch: Es Türli im Adväntskaländer, es Gitter vor em Huus –
  //    eis nach em andere gaht uf, und am Schluss isch es Fäscht drus.
  const steps = {
    s2: inputs.einbauort !== null && inputs.fluchtweg !== null,
    s3: inputs.montage !== null && inputs.untergrund !== null,
    s4: masseOk,
    s5: inputs.stabanordnung !== null,
    s6: Boolean(
      inputs.materialId &&
        inputs.rahmenProfilId &&
        (inputs.stabProfilId || inputs.stabWunschDm)
    ),
    s7: Boolean(inputs.finishId && inputs.farbe),
  };
  // 3D lohnt sich erst, wenn Masse und Montageart bekannt sind.
  const geometryReady = masseOk && inputs.montage !== null;

  // Teilen: alles in einen Link packen und in die Zwischenablage kopieren.
  // Klappt das nicht, zeigen wir den Link an. Nach 6 Sekunden ist die Meldung weg.
  const share = async () => {
    const payload = btoa(encodeURIComponent(JSON.stringify(inputs)));
    const url = `${window.location.origin}${window.location.pathname}?c=${payload}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
    } catch {
      setShareState('shown');
    }
    window.setTimeout(() => setShareState('idle'), 6000);
  };

  // Jetzt das, was man sieht.
  return (
    <div className="configurator">
      <p>
        <Link to="/">← {tr('Produktauswahl')}</Link>
      </p>
      <h1>{tr('Fenstergitter konfigurieren')}</h1>
      <p className="lead">
        {tr(
          'Fest montiertes, rechteckiges Fenstergitter – mit 3D-Vorschau am Fenster und Masszeichnung. Unser Meister prüft jede Konfiguration persönlich (Einbruchhemmung, Befestigung, Baurecht).'
        )}
      </p>

      {/* Links die Schritte, rechts Vorschau und Zusammenfassung. */}
      <div className="configurator-layout">
        <div className="configurator-steps">
          {/* Schritt 1: Innen oder aussen? Und – ganz wichtig – ist es ein Fluchtweg? */}
          <StepSection number={1} title="Anwendung und Sicherheit" unlocked done={steps.s2}>
            <OptionCardGroup
              legend="Innen- oder Aussenanwendung?"
              name="fg-einbauort"
              options={EINBAUORTE_G}
              value={inputs.einbauort}
              onChange={(einbauort) => set({ einbauort })}
            />
            <OptionCardGroup
              legend="Ist dieses Fenster ein Flucht- oder Rettungsweg?"
              name="fg-fluchtweg"
              options={FLUCHTWEG_OPTIONEN}
              value={inputs.fluchtweg}
              onChange={(fluchtweg) => set({ fluchtweg })}
            />
            {/* Bei einem Fluchtweg erklären wir freundlich, dass es eine Speziallösung braucht. */}
            {inputs.fluchtweg === 'ja' && (
              <p className="escape-hatch">
                {tr('Für Fluchtwege braucht es öffenbare oder ausstellbare Sonderlösungen.')}
              </p>
            )}
          </StepSection>

          {/* Schritt 2: Wo und worauf wird das Gitter befestigt? */}
          <StepSection number={2} title="Montage und Untergrund" unlocked={steps.s2} done={steps.s3}>
            <OptionCardGroup
              legend="Wo wird das Gitter montiert?"
              name="fg-montage"
              options={MONTAGE_OPTIONEN}
              value={inputs.montage}
              onChange={(montage) => set({ montage })}
            />
            <OptionCardGroup
              legend="Auf welchem Untergrund?"
              name="fg-untergrund"
              options={UNTERGRUENDE_G}
              value={inputs.untergrund}
              onChange={(untergrund) => set({ untergrund })}
            />
          </StepSection>

          {/* Schritt 3: Messen – an mehreren Stellen, und das kleinste Mass nehmen. */}
          {/* 🤧 Schnupfspruch: Obe, Mitti, unne mässe –
                s chlinscht Mass zellt, das wämmer nöd vergässe. */}
          <StepSection
            number={3}
            title="Masse"
            hint="Leibungs-Lichtmass: an mehreren Stellen messen, kleinstes Mass angeben. Spielraum bzw. Überstand berechnen wir."
            unlocked={steps.s3}
            done={steps.s4}
          >
            <OptionCardGroup
              legend="Wie haben Sie gemessen?"
              name="fg-masstyp"
              options={MASSTYPEN}
              value={inputs.masstyp}
              onChange={(masstyp) => set({ masstyp })}
            />
            <NumberField
              label="Breite"
              unit="mm"
              value={inputs.breiteMm}
              min={FENSTERGITTER_RULES_V0.minBreiteMm}
              max={FENSTERGITTER_RULES_V0.maxBreiteMm}
              onChange={(breiteMm) => set({ breiteMm })}
            />
            <NumberField
              label="Höhe"
              unit="mm"
              value={inputs.hoeheMm}
              min={FENSTERGITTER_RULES_V0.minHoeheMm}
              max={FENSTERGITTER_RULES_V0.maxHoeheMm}
              onChange={(hoeheMm) => set({ hoeheMm })}
            />
            {/* Häkchen für «nur ungefähr gemessen». */}
            <label className="check-row">
              <input
                type="checkbox"
                checked={inputs.masseUngefaehr}
                onChange={(e) => set({ masseUngefaehr: e.target.checked })}
              />
              {tr('Meine Masse sind ungefähr (Aufmass nötig)')}
            </label>
          </StepSection>

          {/* Schritt 4: Wie sieht das Gitter aus? Stäbe, Quergurte, Verzierungen. */}
          <StepSection number={4} title="Gitterbild" unlocked={steps.s4} done={steps.s5}>
            <OptionCardGroup
              legend="Stabanordnung"
              name="fg-anordnung"
              options={STABANORDNUNGEN}
              value={inputs.stabanordnung}
              onChange={(stabanordnung) => set({ stabanordnung })}
            />
            {/* Quergurte: nur fragen, wenn man sie ausgewählt hat (1 oder 2). */}
            {inputs.stabanordnung === 'vertikal-quergurt' && (
              <NumberField
                label="Anzahl Quergurte"
                unit={tr('Stk.')}
                step={1}
                value={inputs.quergurtAnzahl}
                min={1}
                max={2}
                onChange={(v) => set({ quergurtAnzahl: v ?? 1 })}
              />
            )}
            <OptionCardGroup
              legend="Zierelemente (Manufaktur-Grundauswahl)"
              name="fg-zier"
              options={ZIER_OPTIONEN}
              value={inputs.ornamentTyp ?? 'ohne'}
              onChange={(wert) =>
                set({ ornamentTyp: wert === 'ohne' ? null : wert })
              }
            />
            {/* Wo sitzt die Verzierung? Oben, Mitte oder unten. */}
            {inputs.ornamentTyp && (
              <OptionCardGroup
                legend="Zier-Lage"
                name="fg-zierlage"
                options={ORNAMENT_LAGEN}
                value={inputs.ornamentLage}
                onChange={(ornamentLage) => set({ ornamentLage })}
              />
            )}
          </StepSection>

          {/* Schritt 5: Material und Eisenprofile – oder ein Wunsch-Durchmesser. */}
          <StepSection
            number={5}
            title="Material und Profile"
            hint="Testkatalog – definitive Querschnitte werden fachlich freigegeben."
            unlocked={steps.s5}
            done={steps.s6}
          >
            <OptionCardGroup
              legend="Werkstoff"
              name="fg-material"
              options={MATERIALS.filter((m) => m.active).map((m) => ({
                id: m.materialId,
                label: m.name.replace(/\s*\(TESTDATEN\)/, ''),
                description:
                  m.materialId === 'test-edelstahl'
                    ? 'Rostfrei – ideal aussen.'
                    : 'Klassischer Schlosserstahl.',
              }))}
              value={inputs.materialId}
              onChange={(materialId) => set({ materialId })}
              badge={() => 'TESTDATEN'}
            />
            {inputs.materialId && (
              <>
                <OptionCardGroup
                  legend="Rahmenprofil"
                  name="fg-rahmen"
                  options={profileOptions('gitterrahmen', inputs.materialId)}
                  value={inputs.rahmenProfilId}
                  onChange={(rahmenProfilId) => set({ rahmenProfilId })}
                  badge={() => 'TESTDATEN'}
                />
                <OptionCardGroup
                  legend="Stabprofil"
                  name="fg-stab"
                  options={profileOptions('gitterstab', inputs.materialId)}
                  value={inputs.stabProfilId}
                  onChange={(stabProfilId) =>
                    set({ stabProfilId, stabWunschDm: null })
                  }
                  badge={() => 'TESTDATEN'}
                />
                {/* Aufklappbares Kästchen für einen Sonderwunsch beim Stab. */}
                <details
                  className="material-details"
                  open={inputs.stabWunschDm !== null}
                >
                  <summary>{tr('Wunschmass Stab (Sonderprofil, prüfpflichtig)')}</summary>
                  <NumberField
                    label="Runddurchmesser"
                    unit="mm"
                    step={1}
                    value={inputs.stabWunschDm}
                    min={GELAENDER_RULES_V0.minWunschDmMm}
                    max={GELAENDER_RULES_V0.maxWunschDmMm}
                    onChange={(stabWunschDm) => set({ stabWunschDm })}
                  />
                </details>
              </>
            )}
          </StepSection>

          {/* Schritt 6: Rostschutz und Farbe. */}
          {/* 🤧 Schnupfspruch: Anthrazit, Schwarz oder Tannegrüen –
                de Rost blibt dusse, und s Gitter blibt schön. */}
          <StepSection number={6} title="Oberfläche und Farbe" unlocked={steps.s6} done={steps.s7}>
            <OptionCardGroup
              legend="Oberflächenbehandlung"
              name="fg-finish"
              options={FINISHES.filter(
                (f) =>
                  f.active &&
                  (!inputs.materialId ||
                    f.allowedMaterials.includes(inputs.materialId))
              ).map((f) => ({
                id: f.finishId,
                label: f.name.replace(/\s*\(TESTDATEN\)/, ''),
                description: 'Eignung wird fachlich geprüft.',
              }))}
              value={inputs.finishId}
              onChange={(finishId) => set({ finishId })}
              badge={() => 'TESTDATEN'}
            />
            <fieldset className="option-group">
              <legend>{tr('Farbe')}</legend>
              <div className="swatch-row">
                {/* Ein Farbtupfer für jede Farbe zum Anklicken. */}
                {FARBEN.map((farbe) => (
                  <label
                    key={farbe.id}
                    className={`swatch${inputs.farbe === farbe.id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="fg-farbe"
                      value={farbe.id}
                      checked={inputs.farbe === farbe.id}
                      onChange={() => set({ farbe: farbe.id })}
                    />
                    <span
                      className="swatch-chip"
                      style={{
                        background: farbe.hex ?? 'transparent',
                        borderStyle: farbe.hex ? 'solid' : 'dashed',
                      }}
                      aria-hidden="true"
                    >
                      {farbe.hex ? '' : '?'}
                    </span>
                    <span className="swatch-label">{tr(farbe.label)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </StepSection>

          {/* Schritt 7: Wer schraubt das Gitter an? */}
          <StepSection
            number={7}
            title="Montage"
            unlocked={steps.s7}
            done={inputs.montageService !== null}
          >
            <OptionCardGroup
              legend="Wer montiert?"
              name="fg-service"
              options={MONTAGE_SERVICES}
              value={inputs.montageService}
              onChange={(montageService) => set({ montageService })}
            />
          </StepSection>
        </div>

        {/* Rechte Seite: 3D-Vorschau und Zusammenfassung. */}
        <aside className="configurator-aside">
          {/* Das Gitter in 3D, direkt an einer kleinen Wand mit Fenster. */}
          <GitterViewer
            geometry={geometry}
            color={farbHex(inputs.farbe)}
            empty={!geometryReady}
          />

          {/* Die Zusammenfassung – wie ein Kassenzettel. */}
          <div className="summary-card">
            <h2>{tr('Ihre Konfiguration')}</h2>
            {/* Mit Massen: ausgerechnete Werte und Einkaufszettel. Ohne: kurzer Hinweis. */}
            {geometryReady ? (
              <>
                <ul className="summary-list">
                  <li>
                    {tr('Gitter-Aussenmass:')}{' '}
                    <strong>
                      {derived.rahmenBreiteMm} × {derived.rahmenHoeheMm} mm
                    </strong>
                    {inputs.masseUngefaehr && ` (${tr('ungefähr')})`}
                  </li>
                  <li>
                    {tr('Stäbe:')} <strong>{derived.stabAnzahl}</strong>
                    <span className="provisional"> {tr('provisorisch')}</span>
                  </li>
                  {derived.quergurtAnzahl > 0 && (
                    <li>
                      {tr('Quergurte:')} <strong>{derived.quergurtAnzahl}</strong>
                    </li>
                  )}
                  <li>
                    {tr('Befestigungslaschen:')} <strong>{derived.laschenTotal}</strong>
                    <span className="provisional"> {tr('provisorisch')}</span>
                  </li>
                </ul>
                {material.length > 0 && (
                  <details className="material-details">
                    <summary>{tr('Materialauszug (provisorisch, für die Werkstatt)')}</summary>
                    <table className="material-table">
                      <thead>
                        <tr>
                          <th>{tr('Position')}</th>
                          <th>{tr('Stk.')}</th>
                          <th>{tr('Länge')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {material.map((pos) => (
                          <tr key={pos.bezeichnung}>
                            <td>{pos.bezeichnung}</td>
                            <td>{pos.anzahl}</td>
                            <td>{pos.laengeMm ? `${pos.laengeMm} mm` : '–'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </>
            ) : (
              <p className="field-hint">{tr('Noch keine Masse erfasst.')}</p>
            )}

            {/* Rot für Fehler, gelb für Hinweise. */}
            {/* 🤧 Schnupfspruch: Isch s Kästli rot, dänn lueg nomol dri –
                  isch s gäl, dänn chunnt de Meister verbi. */}
            {validation.errors.length > 0 && (
              <div className="status-banner red" role="alert">
                <strong>{tr('Bitte prüfen:')}</strong>
                <ul>
                  {validation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="status-banner yellow" role="status">
                <ul>
                  {validation.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ungefähre Preis-Schätzung. */}
            <p className="estimate">{describeEstimate(estimate)}</p>

            {/* Knöpfe: speichern, Offerte anfragen (kommt bald), zurücksetzen. */}
            <div className="summary-actions">
              <button type="button" className="secondary" onClick={share}>
                {tr('Konfiguration speichern (Link)')}
              </button>
              <button
                type="button"
                className="primary"
                disabled={validation.level === 'red' || !inputs.montageService}
                title={tr('Übermittlung an die Werkstatt folgt mit dem Anfrage-System (Phase 3)')}
              >
                {tr('Offerte anfragen – folgt in Kürze')}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => dispatch({ type: 'reset' })}
              >
                {tr('Zurücksetzen')}
              </button>
            </div>
            {/* Rückmeldung nach dem Teilen. */}
            {shareState === 'copied' && (
              <p className="field-hint" role="status">
                {tr('Link kopiert – Konfiguration jederzeit wieder öffnen und teilen.')}
              </p>
            )}
            {shareState === 'shown' && (
              <p className="field-hint" role="status">
                {tr('Link:')} <code className="share-url">{shareUrl}</code>
              </p>
            )}

            {/* Versionsnummern fürs Kleingedruckte. */}
            <p className="versions">
              {tr('Produkt {p} · Regeln {r} · Preis: {preis} · Katalog {k}', {
                p: module.productVersion,
                r: module.ruleVersion,
                preis: module.priceVersion ?? tr('keine Version (individuelle Prüfung)'),
                k: CATALOG_VERSION,
              })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
