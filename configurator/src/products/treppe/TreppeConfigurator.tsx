import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { StepSection } from '../../components/ui/StepSection';
import { OptionCardGroup } from '../../components/ui/OptionCardGroup';
import { NumberField } from '../../components/ui/NumberField';
import { TreppeViewer } from '../../viewer/TreppeViewer';
import { describeEstimate, estimateFor } from '../../pricing/estimate';
import { profilesForUse } from '../../rules/profiles';
import { TREPPE_RULES_V0, validateTreppe } from '../../rules/treppe-rules';
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
  EINBAUORTE,
  FARBEN,
  farbHex,
  HANDLAUF_ABSCHLUESSE,
  KINDERSCHUTZ_OPTIONEN,
  MONTAGE_SERVICES,
  ORNAMENT_TYPEN,
  type OptionDef,
} from '../gelaender/options';
import { deriveTreppe, treppeMaterialAuszug } from './derive';
import { buildTreppeGeometry } from './geometry';
import {
  EMPTY_TREPPE_INPUTS,
  type GelaenderSeite,
  type Setzstufen,
  type Stufentyp,
  type TreppeInputs,
  type TreppenFuellung,
  type TreppenKonstruktion,
  type TreppenModus,
} from './types';

const STORAGE_KEY = 'webforge-treppe-draft-v1';

const MODI: OptionDef<TreppenModus>[] = [
  {
    id: 'kombiniert',
    label: 'Treppe + Geländer',
    description: 'Komplette gerade Stahltreppe mit Treppengeländer.',
    icon: '<path d="M6 40 H16 V32 H26 V24 H36 V16 H44"/><line x1="16" y1="32" x2="16" y2="20"/><line x1="26" y1="24" x2="26" y2="12"/><line x1="36" y1="16" x2="36" y2="4"/><line x1="14" y1="20" x2="44" y2="2"/>',
  },
  {
    id: 'treppe',
    label: 'Nur Treppe',
    description: 'Gerade Stahltreppe ohne Geländer (z. B. zwischen Wänden).',
    icon: '<path d="M6 40 H16 V32 H26 V24 H36 V16 H44"/>',
  },
  {
    id: 'gelaender',
    label: 'Nur Treppengeländer',
    description: 'Geländer für Ihre bestehende Treppe – wir messen am Bestand.',
    icon: '<path d="M6 40 H16 V32 H26 V24 H36 V16 H44" stroke-dasharray="3 3"/><line x1="12" y1="34" x2="12" y2="22"/><line x1="22" y1="26" x2="22" y2="14"/><line x1="32" y1="18" x2="32" y2="6"/><line x1="10" y1="22" x2="40" y2="4"/>',
  },
];

const STUFENTYPEN: OptionDef<Stufentyp>[] = [
  {
    id: 'gitterrost',
    label: 'Gitterrost',
    description: 'Rutschhemmend und selbstreinigend – der Aussen-Klassiker.',
  },
  {
    id: 'traenenblech',
    label: 'Tränenblech',
    description: 'Geschlossene, profilierte Stahlstufe – robust.',
  },
  {
    id: 'blech-glatt',
    label: 'Glattblech',
    description: 'Glatte Stahlstufe – z. B. für Holz- oder Steinauflagen.',
  },
];

const KONSTRUKTIONEN: OptionDef<TreppenKonstruktion>[] = [
  {
    id: 'wangen',
    label: 'Wangentreppe',
    description: 'Zwei seitliche Wangen tragen die Stufen – der Klassiker.',
    icon: '<line x1="6" y1="40" x2="42" y2="10"/><line x1="10" y1="44" x2="46" y2="14"/><line x1="14" y1="36" x2="22" y2="36"/><line x1="22" y1="28" x2="30" y2="28"/><line x1="30" y1="20" x2="38" y2="20"/>',
  },
  {
    id: 'mittelholm',
    label: 'Mittelholmtreppe',
    description: 'Ein zentraler Holm, frei auskragende Stufen – leicht und modern.',
    icon: '<line x1="8" y1="42" x2="44" y2="12"/><line x1="12" y1="36" x2="24" y2="36"/><line x1="20" y1="28" x2="32" y2="28"/><line x1="28" y1="20" x2="40" y2="20"/>',
  },
];

const SETZSTUFEN_OPTIONEN: OptionDef<Setzstufen>[] = [
  {
    id: 'offen',
    label: 'Offene Steigungen',
    description: 'Luftig und leicht – Öffnungen werden nach BFU geprüft.',
  },
  {
    id: 'geschlossen',
    label: 'Geschlossene Setzstufen',
    description: 'Blech-Setzstufen – geschlossen, kindersicher, aussen dicht.',
  },
];

const SEITEN: OptionDef<GelaenderSeite>[] = [
  { id: 'links', label: 'Links', description: 'Geländer links (im Aufstieg gesehen).' },
  { id: 'rechts', label: 'Rechts', description: 'Geländer rechts (im Aufstieg gesehen).' },
  { id: 'beide', label: 'Beidseitig', description: 'Geländer auf beiden Seiten.' },
];

const FUELLUNGEN: OptionDef<TreppenFuellung>[] = [
  {
    id: 'staketen',
    label: 'Staketen (senkrecht)',
    description: 'Senkrechte Stäbe – kindersicher und zeitlos.',
  },
  {
    id: 'querstab',
    label: 'Querstäbe (Reling)',
    description: 'Schräg mitlaufende Stäbe – elegant, Kletter-Hinweis beachten.',
  },
  {
    id: 'geschmiedet',
    label: 'Charakter (geschmiedet)',
    description: 'Mit Schmiedeornamenten – Feinausarbeitung persönlich.',
  },
];

type Action = { type: 'set'; patch: Partial<TreppeInputs> } | { type: 'reset' };

function reducer(state: TreppeInputs, action: Action): TreppeInputs {
  switch (action.type) {
    case 'set': {
      const next = { ...state, ...action.patch };
      if (action.patch.fuellung && action.patch.fuellung !== 'geschmiedet') {
        next.ornamentTyp = null;
      }
      if (action.patch.modus === 'treppe') {
        next.gelaenderSeite = null;
        next.fuellung = null;
      }
      if (action.patch.materialId) {
        for (const key of [
          'wangenProfilId',
          'pfostenProfilId',
          'handlaufProfilId',
          'fuellstabProfilId',
          'querstabProfilId',
        ] as const) {
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
    case 'reset':
      return EMPTY_TREPPE_INPUTS;
  }
}

function loadInitial(): TreppeInputs {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    if (fromUrl) {
      return {
        ...EMPTY_TREPPE_INPUTS,
        ...(JSON.parse(decodeURIComponent(atob(fromUrl))) as TreppeInputs),
      };
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...EMPTY_TREPPE_INPUTS, ...(JSON.parse(stored) as TreppeInputs) };
    }
  } catch {
    // defekte Drafts still verwerfen
  }
  return EMPTY_TREPPE_INPUTS;
}

function profileOptions(
  role: ProfileRole,
  materialId: string | null
): OptionDef<string>[] {
  return profilesForUse(PROFILES, 'treppe', role)
    .filter((p) => !materialId || p.material === materialId)
    .map((p) => ({
      id: p.profileId,
      label: p.name.replace(/^TESTDATEN\s*/, ''),
      description: crossSectionLabel(p),
    }));
}

export function TreppeConfigurator() {
  const module = getProductModule('treppe');
  const [inputs, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shown'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const set = (patch: Partial<TreppeInputs>) => dispatch({ type: 'set', patch });

  const mitTreppe = inputs.modus !== 'gelaender';
  const mitGelaender = inputs.modus !== 'treppe';

  const stabBreite =
    inputs.fuellung === 'querstab'
      ? inputs.querstabProfilId
        ? profilBreiteMm(getProfile(inputs.querstabProfilId)!)
        : 16
      : inputs.fuellstabProfilId
        ? profilBreiteMm(getProfile(inputs.fuellstabProfilId)!)
        : 12;

  const derived = useMemo(
    () => deriveTreppe(inputs, stabBreite),
    [inputs, stabBreite]
  );

  const geometry = useMemo(
    () =>
      buildTreppeGeometry(inputs, derived, {
        wange: inputs.wangenProfilId ? getProfile(inputs.wangenProfilId) : undefined,
        pfosten: inputs.pfostenProfilId ? getProfile(inputs.pfostenProfilId) : undefined,
        handlauf: inputs.handlaufProfilId ? getProfile(inputs.handlaufProfilId) : undefined,
        fuellstab: inputs.fuellstabProfilId ? getProfile(inputs.fuellstabProfilId) : undefined,
        querstab: inputs.querstabProfilId ? getProfile(inputs.querstabProfilId) : undefined,
      }),
    [inputs, derived]
  );

  const selectedProfiles = useMemo(
    () =>
      [
        mitTreppe ? inputs.wangenProfilId : null,
        mitGelaender ? inputs.pfostenProfilId : null,
        mitGelaender ? inputs.handlaufProfilId : null,
        mitGelaender && inputs.fuellung !== 'querstab' ? inputs.fuellstabProfilId : null,
        mitGelaender && inputs.fuellung === 'querstab' ? inputs.querstabProfilId : null,
      ]
        .map((id) => (id ? getProfile(id) : undefined))
        .filter((p): p is Profile => Boolean(p)),
    [inputs, mitTreppe, mitGelaender]
  );

  const validation = useMemo(
    () => validateTreppe(inputs, derived, selectedProfiles),
    [inputs, derived, selectedProfiles]
  );

  const estimate = estimateFor(module.priceVersion);
  const material = useMemo(
    () => treppeMaterialAuszug(inputs, derived),
    [inputs, derived]
  );

  const masseOk =
    inputs.geschosshoeheMm !== null &&
    inputs.geschosshoeheMm > 0 &&
    inputs.laufbreiteMm !== null &&
    inputs.laufbreiteMm > 0;
  const treppeOk =
    !mitTreppe || Boolean(inputs.stufentyp && inputs.wangenProfilId);
  const gelaenderProfileOk =
    inputs.fuellung === 'querstab'
      ? Boolean(inputs.querstabProfilId)
      : inputs.fuellung === 'geschmiedet'
        ? Boolean(inputs.fuellstabProfilId && inputs.ornamentTyp)
        : Boolean(inputs.fuellstabProfilId);
  const gelaenderOk =
    !mitGelaender ||
    Boolean(
      inputs.gelaenderSeite &&
        inputs.gelaenderHoeheMm &&
        inputs.fuellung &&
        inputs.pfostenProfilId &&
        inputs.handlaufProfilId &&
        gelaenderProfileOk &&
        inputs.handlaufAbschluss
    );
  const steps = {
    s2: inputs.modus !== null,
    s3: inputs.einbauort !== null && inputs.kinderschutz !== null,
    s4: masseOk,
    s5: inputs.materialId !== null,
    s6: treppeOk && inputs.materialId !== null,
    s7: gelaenderOk && treppeOk,
    s8: Boolean(inputs.finishId && inputs.farbe),
  };
  const geometryReady = masseOk && inputs.modus !== null;

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

  const P = TREPPE_RULES_V0;
  const schrittmassOk =
    derived.schrittmassMm >= P.minSchrittmassMm &&
    derived.schrittmassMm <= P.maxSchrittmassMm;

  return (
    <div className="configurator">
      <p>
        <Link to="/">← Produktauswahl</Link>
      </p>
      <h1>Treppe &amp; Treppengeländer konfigurieren</h1>
      <p className="lead">
        Gerade, einläufige Stahltreppe – als komplette Treppe, als Geländer
        für Ihren Bestand oder kombiniert. Steigungsverhältnis nach
        Schrittmassregel, Geländer nach BFU-Richtwerten. Unser Meister
        prüft jede Konfiguration persönlich (Statik, Norm, Baurecht).
      </p>

      <div className="configurator-layout">
        <div className="configurator-steps">
          <StepSection number={1} title="Was möchten Sie?" unlocked done={steps.s2}>
            <OptionCardGroup
              legend="Umfang wählen"
              name="tr-modus"
              options={MODI}
              value={inputs.modus}
              onChange={(modus) => set({ modus })}
            />
            <p className="escape-hatch">
              Gewendelte, mehrläufige oder Podest-Treppen sowie
              Spindeltreppen plant unser Meister persönlich:{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a>.
            </p>
          </StepSection>

          <StepSection number={2} title="Nutzung" unlocked={steps.s2} done={steps.s3}>
            <OptionCardGroup
              legend="Innen- oder Aussenbereich?"
              name="tr-einbauort"
              options={EINBAUORTE}
              value={inputs.einbauort}
              onChange={(einbauort) => set({ einbauort })}
            />
            <OptionCardGroup
              legend="Sind Kinder zu erwarten?"
              name="tr-kinder"
              options={KINDERSCHUTZ_OPTIONEN}
              value={inputs.kinderschutz}
              onChange={(kinderschutz) => set({ kinderschutz })}
            />
          </StepSection>

          <StepSection
            number={3}
            title="Masse und Steigung"
            hint="Geschosshöhe = Oberkante Fertigboden unten bis Oberkante Fertigboden oben. Wir rechnen das Steigungsverhältnis nach der Schrittmassregel (2×Steigung + Auftritt ≈ 630 mm)."
            unlocked={steps.s3}
            done={steps.s4}
          >
            <NumberField
              label="Geschosshöhe"
              unit="mm"
              value={inputs.geschosshoeheMm}
              min={P.minGeschosshoeheMm}
              max={P.maxGeschosshoeheMm}
              onChange={(geschosshoeheMm) => set({ geschosshoeheMm })}
            />
            <NumberField
              label="Laufbreite"
              unit="mm"
              value={inputs.laufbreiteMm}
              min={P.minLaufbreiteMm}
              max={P.maxLaufbreiteMm}
              onChange={(laufbreiteMm) => set({ laufbreiteMm })}
            />
            {derived.steigungenAnzahl > 0 && (
              <div className="steigung-info">
                <table className="material-table">
                  <tbody>
                    <tr>
                      <td>Steigungen</td>
                      <td>
                        <strong>{derived.steigungenAnzahl}</strong>{' '}
                        ({derived.stufenAnzahl} Trittstufen)
                      </td>
                    </tr>
                    <tr>
                      <td>Steigung / Auftritt</td>
                      <td>
                        <strong>
                          {derived.steigungMm} / {derived.auftrittMm} mm
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <td>Schrittmass</td>
                      <td>
                        <strong>{derived.schrittmassMm} mm</strong>{' '}
                        {schrittmassOk ? '✓' : '⚠ ausserhalb üblich'}
                      </td>
                    </tr>
                    <tr>
                      <td>Lauflänge / Neigung</td>
                      <td>
                        <strong>
                          {derived.lauflaengeMm} mm / {derived.neigungGrad}°
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <NumberField
                  label="Steigungen anpassen (optional)"
                  unit="Stk."
                  step={1}
                  value={inputs.stufenAnzahlManuell}
                  min={3}
                  max={24}
                  hint="Leer = automatisch nach Schrittmassregel."
                  onChange={(stufenAnzahlManuell) => set({ stufenAnzahlManuell })}
                />
              </div>
            )}
            <label className="check-row">
              <input
                type="checkbox"
                checked={inputs.masseUngefaehr}
                onChange={(e) => set({ masseUngefaehr: e.target.checked })}
              />
              Meine Masse sind ungefähr (Aufmass nötig)
            </label>
          </StepSection>

          <StepSection number={4} title="Werkstoff" unlocked={steps.s4} done={steps.s5}>
            <OptionCardGroup
              legend="Werkstoff"
              name="tr-material"
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
          </StepSection>

          {mitTreppe && (
            <StepSection
              number={5}
              title="Treppe"
              hint="Wangenkonstruktion – die Tragfähigkeit wird statisch bemessen."
              unlocked={steps.s5}
              done={treppeOk}
            >
              <OptionCardGroup
                legend="Konstruktion"
                name="tr-konstruktion"
                options={KONSTRUKTIONEN}
                value={inputs.konstruktion}
                onChange={(konstruktion) => set({ konstruktion })}
              />
              <OptionCardGroup
                legend="Stufenausführung"
                name="tr-stufentyp"
                options={STUFENTYPEN}
                value={inputs.stufentyp}
                onChange={(stufentyp) => set({ stufentyp })}
              />
              <OptionCardGroup
                legend="Steigungen (Setzstufen)"
                name="tr-setzstufen"
                options={SETZSTUFEN_OPTIONEN}
                value={inputs.setzstufen}
                onChange={(setzstufen) => set({ setzstufen })}
              />
              <OptionCardGroup
                legend={inputs.konstruktion === 'mittelholm' ? 'Holm-/Wangenmaterial (Vorschau)' : 'Wangenprofil'}
                name="tr-wange"
                options={profileOptions('wange', inputs.materialId)}
                value={inputs.wangenProfilId}
                onChange={(wangenProfilId) => set({ wangenProfilId })}
                badge={() => 'TESTDATEN'}
              />
            </StepSection>
          )}

          {mitGelaender && (
            <StepSection
              number={mitTreppe ? 6 : 5}
              title="Treppengeländer"
              hint="BFU-Richtwert im Treppenlauf: mindestens 900 mm Geländerhöhe."
              unlocked={steps.s6}
              done={gelaenderOk}
            >
              <OptionCardGroup
                legend="Auf welcher Seite?"
                name="tr-seite"
                options={SEITEN}
                value={inputs.gelaenderSeite}
                onChange={(gelaenderSeite) => set({ gelaenderSeite })}
              />
              <NumberField
                label="Geländerhöhe (senkrecht über Stufenkante)"
                unit="mm"
                value={inputs.gelaenderHoeheMm}
                min={P.minGelaenderhoeheMm}
                max={P.maxGelaenderhoeheMm}
                hint="BFU: mindestens 900 mm im Lauf; bei grosser Absturzhöhe mehr."
                onChange={(gelaenderHoeheMm) => set({ gelaenderHoeheMm })}
              />
              <OptionCardGroup
                legend="Füllung"
                name="tr-fuellung"
                options={FUELLUNGEN}
                value={inputs.fuellung}
                onChange={(fuellung) => set({ fuellung })}
              />
              {inputs.fuellung === 'geschmiedet' && (
                <OptionCardGroup
                  legend="Ornament-Grundauswahl"
                  name="tr-ornament"
                  options={ORNAMENT_TYPEN}
                  value={inputs.ornamentTyp}
                  onChange={(ornamentTyp) => set({ ornamentTyp })}
                />
              )}
              <OptionCardGroup
                legend="Pfosten"
                name="tr-pfosten"
                options={profileOptions('pfosten', inputs.materialId)}
                value={inputs.pfostenProfilId}
                onChange={(pfostenProfilId) => set({ pfostenProfilId })}
                badge={() => 'TESTDATEN'}
              />
              <OptionCardGroup
                legend="Handlauf"
                name="tr-handlauf"
                options={profileOptions('handlauf', inputs.materialId)}
                value={inputs.handlaufProfilId}
                onChange={(handlaufProfilId) => set({ handlaufProfilId })}
                badge={() => 'TESTDATEN'}
              />
              {inputs.fuellung !== 'querstab' && (
                <OptionCardGroup
                  legend="Füllstäbe"
                  name="tr-stab"
                  options={profileOptions('fuellstab', inputs.materialId)}
                  value={inputs.fuellstabProfilId}
                  onChange={(fuellstabProfilId) => set({ fuellstabProfilId })}
                  badge={() => 'TESTDATEN'}
                />
              )}
              {inputs.fuellung === 'querstab' && (
                <OptionCardGroup
                  legend="Querstäbe"
                  name="tr-querstab"
                  options={profileOptions('querstab', inputs.materialId)}
                  value={inputs.querstabProfilId}
                  onChange={(querstabProfilId) => set({ querstabProfilId })}
                  badge={() => 'TESTDATEN'}
                />
              )}
              <OptionCardGroup
                legend="Handlauf-Abschluss"
                name="tr-abschluss"
                options={HANDLAUF_ABSCHLUESSE}
                value={inputs.handlaufAbschluss}
                onChange={(handlaufAbschluss) => set({ handlaufAbschluss })}
              />
            </StepSection>
          )}

          <StepSection
            number={mitTreppe && mitGelaender ? 7 : 6}
            title="Oberfläche und Farbe"
            unlocked={steps.s7}
            done={steps.s8}
          >
            <OptionCardGroup
              legend="Oberflächenbehandlung"
              name="tr-finish"
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
              <legend>Farbe</legend>
              <div className="swatch-row">
                {FARBEN.map((farbe) => (
                  <label
                    key={farbe.id}
                    className={`swatch${inputs.farbe === farbe.id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tr-farbe"
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
                    <span className="swatch-label">{farbe.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </StepSection>

          <StepSection
            number={mitTreppe && mitGelaender ? 8 : 7}
            title="Montage"
            unlocked={steps.s8}
            done={inputs.montageService !== null}
          >
            <OptionCardGroup
              legend="Wer montiert?"
              name="tr-service"
              options={MONTAGE_SERVICES}
              value={inputs.montageService}
              onChange={(montageService) => set({ montageService })}
            />
          </StepSection>
        </div>

        <aside className="configurator-aside">
          <TreppeViewer
            geometry={geometry}
            color={farbHex(inputs.farbe)}
            empty={!geometryReady}
          />

          <div className="summary-card">
            <h2>Ihre Konfiguration</h2>
            {geometryReady ? (
              <>
                <ul className="summary-list">
                  <li>
                    Geschosshöhe: <strong>{inputs.geschosshoeheMm} mm</strong>
                    {inputs.masseUngefaehr && ' (ungefähr)'}
                  </li>
                  <li>
                    Steigungsverhältnis:{' '}
                    <strong>
                      {derived.steigungMm}/{derived.auftrittMm} mm
                    </strong>{' '}
                    ({derived.steigungenAnzahl} Stg.)
                    <span className="provisional"> provisorisch</span>
                  </li>
                  <li>
                    Lauflänge: <strong>{derived.lauflaengeMm} mm</strong> ·{' '}
                    {derived.neigungGrad}°
                  </li>
                  {derived.gelaenderSeiten > 0 && (
                    <li>
                      Geländer:{' '}
                      <strong>
                        {derived.gelaenderSeiten}× ·{' '}
                        {derived.pfostenProSeite} Pfosten/Seite
                      </strong>
                      <span className="provisional"> provisorisch</span>
                    </li>
                  )}
                </ul>
                {material.length > 0 && (
                  <details className="material-details">
                    <summary>Materialauszug (provisorisch, für die Werkstatt)</summary>
                    <table className="material-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Stk.</th>
                          <th>Länge</th>
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
              <p className="field-hint">Noch keine Masse erfasst.</p>
            )}

            {validation.errors.length > 0 && (
              <div className="status-banner red" role="alert">
                <strong>Bitte prüfen:</strong>
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

            <p className="estimate">{describeEstimate(estimate)}</p>

            <div className="summary-actions">
              <button type="button" className="secondary" onClick={share}>
                Konfiguration speichern (Link)
              </button>
              <button
                type="button"
                className="primary"
                disabled={validation.level === 'red' || !inputs.montageService}
                title="Übermittlung an die Werkstatt folgt mit dem Anfrage-System (Phase 3)"
              >
                Offerte anfragen – folgt in Kürze
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => dispatch({ type: 'reset' })}
              >
                Zurücksetzen
              </button>
            </div>
            {shareState === 'copied' && (
              <p className="field-hint" role="status">
                Link kopiert – Konfiguration jederzeit wieder öffnen und teilen.
              </p>
            )}
            {shareState === 'shown' && (
              <p className="field-hint" role="status">
                Link: <code className="share-url">{shareUrl}</code>
              </p>
            )}

            <p className="versions">
              Produkt {module.productVersion} · Regeln {module.ruleVersion} ·
              Preis: {module.priceVersion ?? 'keine Version (individuelle Prüfung)'} ·
              Katalog {CATALOG_VERSION}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
