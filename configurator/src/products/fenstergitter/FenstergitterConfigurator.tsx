import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
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
  EMPTY_FENSTERGITTER_INPUTS,
  type FenstergitterInputs,
  type Fluchtweg,
  type GitterEinbauort,
  type GitterMasstyp,
  type GitterMontage,
  type GitterUntergrund,
  type Stabanordnung,
} from './types';

const STORAGE_KEY = 'webforge-fenstergitter-draft-v1';

const EINBAUORTE_G: OptionDef<GitterEinbauort>[] = [
  { id: 'aussen', label: 'Aussen', description: 'Fassadenseitig – Witterung und Korrosionsschutz beachten.' },
  { id: 'innen', label: 'Innen', description: 'Raumseitig, z. B. Kellerfenster von innen.' },
];

const FLUCHTWEG_OPTIONEN: OptionDef<Fluchtweg>[] = [
  { id: 'nein', label: 'Nein', description: 'Kein Flucht- oder Rettungsweg.' },
  {
    id: 'ja',
    label: 'Ja',
    description: 'Fluchtweg – feste Gitter sind nicht zulässig (öffenbare Sonderlösung nötig).',
  },
  { id: 'unbekannt', label: 'Weiss ich nicht', description: 'Wird vor der Ausführung geklärt.' },
];

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

const UNTERGRUENDE_G: OptionDef<GitterUntergrund>[] = [
  { id: 'beton', label: 'Beton', description: 'Betonleibung oder -wand.' },
  { id: 'backstein', label: 'Backstein / Mauerwerk', description: 'Dübelwahl wird fachlich bestimmt.' },
  { id: 'holz', label: 'Holz', description: 'Holzrahmen oder Riegelbau.' },
  { id: 'unbekannt', label: 'Weiss ich nicht', description: 'Wird vor Ort geprüft.' },
];

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

const ZIER_OPTIONEN: OptionDef<'ohne' | 'ringe' | 'voluten' | 'koerbe'>[] = [
  { id: 'ohne', label: 'Ohne Zier', description: 'Rein funktional – Stäbe und Rahmen.' },
  ...ORNAMENT_TYPEN,
];

type Action =
  | { type: 'set'; patch: Partial<FenstergitterInputs> }
  | { type: 'reset' };

function reducer(
  state: FenstergitterInputs,
  action: Action
): FenstergitterInputs {
  switch (action.type) {
    case 'set': {
      const next = { ...state, ...action.patch };
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
    case 'reset':
      return EMPTY_FENSTERGITTER_INPUTS;
  }
}

function loadInitial(): FenstergitterInputs {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    if (fromUrl) {
      return {
        ...EMPTY_FENSTERGITTER_INPUTS,
        ...(JSON.parse(decodeURIComponent(atob(fromUrl))) as FenstergitterInputs),
      };
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return {
        ...EMPTY_FENSTERGITTER_INPUTS,
        ...(JSON.parse(stored) as FenstergitterInputs),
      };
    }
  } catch {
    // defekte Drafts still verwerfen
  }
  return EMPTY_FENSTERGITTER_INPUTS;
}

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

export function FenstergitterConfigurator() {
  const module = getProductModule('fenstergitter');
  const [inputs, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shown'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const set = (patch: Partial<FenstergitterInputs>) =>
    dispatch({ type: 'set', patch });

  const stabBreite = inputs.stabWunschDm
    ? inputs.stabWunschDm
    : inputs.stabProfilId
      ? profilBreiteMm(getProfile(inputs.stabProfilId)!)
      : 12;

  const derived = useMemo(
    () => deriveFenstergitter(inputs, stabBreite),
    [inputs, stabBreite]
  );

  const geometry = useMemo(
    () =>
      buildGitterGeometry(inputs, derived, {
        rahmen: inputs.rahmenProfilId ? getProfile(inputs.rahmenProfilId) : undefined,
        stab: inputs.stabProfilId ? getProfile(inputs.stabProfilId) : undefined,
      }),
    [inputs, derived]
  );

  const selectedProfiles = useMemo(
    () =>
      [inputs.rahmenProfilId, inputs.stabProfilId]
        .map((id) => (id ? getProfile(id) : undefined))
        .filter((p): p is Profile => Boolean(p)),
    [inputs.rahmenProfilId, inputs.stabProfilId]
  );

  const validation = useMemo(
    () => validateFenstergitter(inputs, selectedProfiles),
    [inputs, selectedProfiles]
  );

  const estimate = estimateFor(module.priceVersion);
  const material = useMemo(
    () => gitterMaterialAuszug(inputs, derived),
    [inputs, derived]
  );

  const masseOk =
    inputs.breiteMm !== null &&
    inputs.breiteMm > 0 &&
    inputs.hoeheMm !== null &&
    inputs.hoeheMm > 0;
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
  const geometryReady = masseOk && inputs.montage !== null;

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

  return (
    <div className="configurator">
      <p>
        <Link to="/">← Produktauswahl</Link>
      </p>
      <h1>Fenstergitter konfigurieren</h1>
      <p className="lead">
        Fest montiertes, rechteckiges Fenstergitter – mit 3D-Vorschau am
        Fenster und Masszeichnung. Unser Meister prüft jede Konfiguration
        persönlich (Einbruchhemmung, Befestigung, Baurecht).
      </p>

      <div className="configurator-layout">
        <div className="configurator-steps">
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
            {inputs.fluchtweg === 'ja' && (
              <p className="escape-hatch">
                Für Fluchtwege braucht es öffenbare oder ausstellbare
                Sonderlösungen.{' '}
                <a href="/projekt-starten/">Individuelle Ausführung anfragen</a>.
              </p>
            )}
            <p className="escape-hatch">
              Rundbogen, Schrägen oder öffenbare Gitter?{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a>.
            </p>
          </StepSection>

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
            <label className="check-row">
              <input
                type="checkbox"
                checked={inputs.masseUngefaehr}
                onChange={(e) => set({ masseUngefaehr: e.target.checked })}
              />
              Meine Masse sind ungefähr (Aufmass nötig)
            </label>
          </StepSection>

          <StepSection number={4} title="Gitterbild" unlocked={steps.s4} done={steps.s5}>
            <OptionCardGroup
              legend="Stabanordnung"
              name="fg-anordnung"
              options={STABANORDNUNGEN}
              value={inputs.stabanordnung}
              onChange={(stabanordnung) => set({ stabanordnung })}
            />
            {inputs.stabanordnung === 'vertikal-quergurt' && (
              <NumberField
                label="Anzahl Quergurte"
                unit="Stk."
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
                <details
                  className="material-details"
                  open={inputs.stabWunschDm !== null}
                >
                  <summary>Wunschmass Stab (Sonderprofil, prüfpflichtig)</summary>
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
              <legend>Farbe</legend>
              <div className="swatch-row">
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
                    <span className="swatch-label">{farbe.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </StepSection>

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

        <aside className="configurator-aside">
          <GitterViewer
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
                    Gitter-Aussenmass:{' '}
                    <strong>
                      {derived.rahmenBreiteMm} × {derived.rahmenHoeheMm} mm
                    </strong>
                    {inputs.masseUngefaehr && ' (ungefähr)'}
                  </li>
                  <li>
                    Stäbe: <strong>{derived.stabAnzahl}</strong>
                    <span className="provisional"> provisorisch</span>
                  </li>
                  {derived.quergurtAnzahl > 0 && (
                    <li>
                      Quergurte: <strong>{derived.quergurtAnzahl}</strong>
                    </li>
                  )}
                  <li>
                    Befestigungslaschen: <strong>{derived.laschenTotal}</strong>
                    <span className="provisional"> provisorisch</span>
                  </li>
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
