import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { StepSection } from '../../components/ui/StepSection';
import { OptionCardGroup } from '../../components/ui/OptionCardGroup';
import { NumberField } from '../../components/ui/NumberField';
import { RailingViewer } from '../../viewer/RailingViewer';
import { describeEstimate, estimateFor } from '../../pricing/estimate';
import { profilesForUse } from '../../rules/profiles';
import {
  GELAENDER_RULES_V0,
  validateGelaender,
} from '../../rules/gelaender-rules';
import { getProductModule } from '../catalog';
import {
  CATALOG_VERSION,
  FINISHES,
  getProfile,
  PROFILES,
  profilBreiteMm,
} from '../profile-catalog';
import type { Profile, ProfileRole } from '../types';
import { deriveGelaender, materialAuszug } from './derive';
import { buildRailingGeometry } from './geometry';
import {
  EINBAUORTE,
  FARBEN,
  farbHex,
  FUELLUNGSARTEN,
  GLASTYPEN,
  HANDLAUF_ABSCHLUESSE,
  MONTAGE_SERVICES,
  MONTAGEARTEN,
  UNTERGRUENDE,
  VARIANTEN,
  type OptionDef,
} from './options';
import {
  EMPTY_GELAENDER_INPUTS,
  SEGMENTE_PRO_VARIANTE,
  type GelaenderInputs,
} from './types';

const STORAGE_KEY = 'webforge-gelaender-draft-v1';

type Action =
  | { type: 'set'; patch: Partial<GelaenderInputs> }
  | { type: 'reset' };

function reducer(state: GelaenderInputs, action: Action): GelaenderInputs {
  switch (action.type) {
    case 'set': {
      const next = { ...state, ...action.patch };
      // Variantenwechsel passt die Segmentanzahl an, ohne Werte zu verlieren.
      if (action.patch.variante) {
        const anzahl = SEGMENTE_PRO_VARIANTE[action.patch.variante];
        next.segmentLaengenMm = Array.from(
          { length: anzahl },
          (_, i) => state.segmentLaengenMm[i] ?? 0
        );
      }
      // «Ohne Handlauf» gibt es nur bei Glasfüllung.
      if (action.patch.fuellungsart && action.patch.fuellungsart !== 'glas') {
        next.ohneHandlauf = false;
        next.glasTyp = null;
      }
      return next;
    }
    case 'reset':
      return EMPTY_GELAENDER_INPUTS;
  }
}

function loadInitial(): GelaenderInputs {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    if (fromUrl) {
      return {
        ...EMPTY_GELAENDER_INPUTS,
        ...(JSON.parse(decodeURIComponent(atob(fromUrl))) as GelaenderInputs),
      };
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return {
        ...EMPTY_GELAENDER_INPUTS,
        ...(JSON.parse(stored) as GelaenderInputs),
      };
    }
  } catch {
    // defekte Drafts still verwerfen
  }
  return EMPTY_GELAENDER_INPUTS;
}

const SEGMENT_LABELS = ['Erstes Segment', 'Zweites Segment', 'Drittes Segment'];

function profileOptions(role: ProfileRole): OptionDef<string>[] {
  return profilesForUse(PROFILES, 'gelaender', role).map((p) => ({
    id: p.profileId,
    label: p.name.replace(/^TESTDATEN\s*/, ''),
    description: crossSectionLabel(p),
  }));
}

function crossSectionLabel(p: Profile): string {
  const cs = p.crossSection as Record<string, number | string>;
  const shapeNames: Record<string, string> = {
    'round-tube': 'Rundrohr',
    'square-tube': 'Quadratrohr',
    'rect-tube': 'Rechteckrohr',
    'flat-bar': 'Flachstahl',
    'square-bar': 'Vierkantstab',
    'round-bar': 'Rundstab',
    't-profile': 'T-Stahl',
  };
  const shape = shapeNames[String(cs.shape)] ?? String(cs.shape);
  const masse = cs.diameterMm
    ? `Ø ${cs.diameterMm} mm`
    : `${cs.widthMm ?? '?'} × ${cs.heightMm ?? cs.widthMm ?? '?'} mm`;
  const wand = cs.wallThicknessMm ? ` · Wand ${cs.wallThicknessMm} mm` : '';
  return `${shape} ${masse}${wand}`;
}

export function GelaenderConfigurator() {
  const module = getProductModule('gelaender');
  const [inputs, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shown'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const set = (patch: Partial<GelaenderInputs>) => dispatch({ type: 'set', patch });

  const selectedProfiles = useMemo(
    () =>
      [
        inputs.pfostenProfilId,
        inputs.ohneHandlauf ? null : inputs.handlaufProfilId,
        inputs.fuellungsart === 'staketen' ? inputs.fuellstabProfilId : null,
        inputs.fuellungsart === 'querstab' ? inputs.querstabProfilId : null,
      ]
        .map((id) => (id ? getProfile(id) : undefined))
        .filter((p): p is Profile => Boolean(p)),
    [inputs]
  );

  // Massgebende Stabbreite je Füllungsart (für Teilung/Lagen).
  const stabProfil =
    inputs.fuellungsart === 'querstab'
      ? inputs.querstabProfilId
      : inputs.fuellstabProfilId;
  const stabBreite = stabProfil ? profilBreiteMm(getProfile(stabProfil)!) : 12;

  const derived = useMemo(
    () => deriveGelaender(inputs, stabBreite),
    [inputs, stabBreite]
  );

  const geometry = useMemo(
    () =>
      buildRailingGeometry(inputs, derived, {
        pfosten: inputs.pfostenProfilId
          ? getProfile(inputs.pfostenProfilId)
          : undefined,
        handlauf: inputs.handlaufProfilId
          ? getProfile(inputs.handlaufProfilId)
          : undefined,
        fuellstab: inputs.fuellstabProfilId
          ? getProfile(inputs.fuellstabProfilId)
          : undefined,
        querstab: inputs.querstabProfilId
          ? getProfile(inputs.querstabProfilId)
          : undefined,
      }),
    [inputs, derived]
  );

  const validation = useMemo(
    () => validateGelaender(inputs, selectedProfiles),
    [inputs, selectedProfiles]
  );

  const estimate = estimateFor(module.priceVersion);
  const material = useMemo(
    () => materialAuszug(inputs, derived),
    [inputs, derived]
  );

  // Freischaltlogik der Schritte
  const masseOk =
    inputs.segmentLaengenMm.length > 0 &&
    inputs.segmentLaengenMm.every((l) => l > 0) &&
    inputs.hoeheMm !== null &&
    inputs.hoeheMm > 0;
  const fuellungOk =
    inputs.fuellungsart === 'staketen'
      ? Boolean(inputs.fuellstabProfilId)
      : inputs.fuellungsart === 'querstab'
        ? Boolean(inputs.querstabProfilId)
        : inputs.fuellungsart === 'glas'
          ? Boolean(inputs.glasTyp)
          : false;
  const profileOk = Boolean(
    inputs.pfostenProfilId &&
      (inputs.ohneHandlauf || inputs.handlaufProfilId) &&
      fuellungOk
  );
  const ausfuehrungOk = inputs.ohneHandlauf || inputs.handlaufAbschluss !== null;
  const steps = {
    s2: inputs.variante !== null,
    s3: inputs.einbauort !== null,
    s4: inputs.montageart !== null && inputs.untergrund !== null,
    s5: masseOk,
    s6: inputs.fuellungsart !== null,
    s7: profileOk,
    s8: ausfuehrungOk && Boolean(inputs.finishId && inputs.farbe),
  };
  const geometryReady = masseOk && inputs.variante !== null;

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
      <h1>Geländer konfigurieren</h1>
      <p className="lead">
        Stellen Sie Ihr Geländer Schritt für Schritt zusammen – mit
        3D-Vorschau und Masszeichnung. Am Ende senden Sie eine unverbindliche
        Offertanfrage; unser Meister prüft jede Konfiguration persönlich.
      </p>

      <div className="configurator-layout">
        <div className="configurator-steps">
          <StepSection number={1} title="Form wählen" unlocked done={steps.s2}>
            <OptionCardGroup
              legend="Welchen Grundriss hat Ihr Geländer?"
              name="variante"
              options={VARIANTEN}
              value={inputs.variante}
              onChange={(variante) => set({ variante })}
            />
            <p className="escape-hatch">
              Mehr Ecken, Winkel ≠ 90°, geschwungene oder Treppenläufe?{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a> –
              Unser Meister plant sie persönlich mit Ihnen.
            </p>
          </StepSection>

          <StepSection
            number={2}
            title="Einbausituation"
            unlocked={steps.s2}
            done={steps.s3}
          >
            <OptionCardGroup
              legend="Wo wird das Geländer montiert?"
              name="einbauort"
              options={EINBAUORTE}
              value={inputs.einbauort}
              onChange={(einbauort) => set({ einbauort })}
            />
          </StepSection>

          <StepSection
            number={3}
            title="Montage und Untergrund"
            unlocked={steps.s3}
            done={steps.s4}
          >
            <OptionCardGroup
              legend="Wie werden die Pfosten befestigt?"
              name="montageart"
              options={MONTAGEARTEN}
              value={inputs.montageart}
              onChange={(montageart) => set({ montageart })}
            />
            <OptionCardGroup
              legend="Auf welchem Untergrund?"
              name="untergrund"
              options={UNTERGRUENDE}
              value={inputs.untergrund}
              onChange={(untergrund) => set({ untergrund })}
            />
          </StepSection>

          <StepSection
            number={4}
            title="Masse"
            hint="Messen Sie entlang der Vorderkante, bei Ecken jedes Segment einzeln. Bei Wandanschluss bis zur Wand messen – den Wandabstand berücksichtigen wir bei der Planung."
            unlocked={steps.s4}
            done={steps.s5}
          >
            {inputs.segmentLaengenMm.map((laenge, i) => (
              <NumberField
                key={i}
                label={
                  inputs.segmentLaengenMm.length === 1
                    ? 'Länge'
                    : `${SEGMENT_LABELS[i] ?? `Segment ${i + 1}`}`
                }
                unit="mm"
                value={laenge || null}
                min={GELAENDER_RULES_V0.minSegmentLaengeMm}
                max={GELAENDER_RULES_V0.maxSegmentLaengeMm}
                onChange={(v) => {
                  const next = [...inputs.segmentLaengenMm];
                  next[i] = v ?? 0;
                  set({ segmentLaengenMm: next });
                }}
              />
            ))}
            <NumberField
              label="Höhe ab Boden"
              unit="mm"
              value={inputs.hoeheMm}
              min={GELAENDER_RULES_V0.minHoeheMm}
              max={GELAENDER_RULES_V0.maxHoeheMm}
              hint="Übliche Geländerhöhen liegen um 1000 mm. Die verbindliche Höhe wird bei der fachlichen Prüfung nach Norm festgelegt."
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

          <StepSection
            number={5}
            title="Geländertyp"
            unlocked={steps.s5}
            done={steps.s6}
          >
            <OptionCardGroup
              legend="Welche Füllung wünschen Sie?"
              name="fuellungsart"
              options={FUELLUNGSARTEN}
              value={inputs.fuellungsart}
              onChange={(fuellungsart) => set({ fuellungsart })}
            />
            <p className="escape-hatch">
              Schmiedeeiserne Ornamente, Zierelemente oder historische
              Nachbildungen?{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a> –
              das ist das Kernhandwerk der Kunstschlosserei.
            </p>
          </StepSection>

          <StepSection
            number={6}
            title="Profile wählen"
            hint="Alle Profile stammen aus dem WebForge-Standardkatalog. Aktuell Testkatalog – das definitive Sortiment wird fachlich freigegeben."
            unlocked={steps.s6}
            done={steps.s7}
          >
            <OptionCardGroup
              legend="Pfosten"
              name="pfostenProfil"
              options={profileOptions('pfosten')}
              value={inputs.pfostenProfilId}
              onChange={(pfostenProfilId) => set({ pfostenProfilId })}
              badge={() => 'TESTDATEN'}
            />
            {inputs.fuellungsart === 'glas' && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={inputs.ohneHandlauf}
                  onChange={(e) => set({ ohneHandlauf: e.target.checked })}
                />
                Puristisch ohne Handlauf (nur Glaskante sichtbar)
              </label>
            )}
            {!inputs.ohneHandlauf && (
              <OptionCardGroup
                legend="Handlauf"
                name="handlaufProfil"
                options={profileOptions('handlauf')}
                value={inputs.handlaufProfilId}
                onChange={(handlaufProfilId) => set({ handlaufProfilId })}
                badge={() => 'TESTDATEN'}
              />
            )}
            {inputs.fuellungsart === 'staketen' && (
              <OptionCardGroup
                legend="Füllstäbe"
                name="fuellstabProfil"
                options={profileOptions('fuellstab')}
                value={inputs.fuellstabProfilId}
                onChange={(fuellstabProfilId) => set({ fuellstabProfilId })}
                badge={() => 'TESTDATEN'}
              />
            )}
            {inputs.fuellungsart === 'querstab' && (
              <OptionCardGroup
                legend="Querstäbe (Reling)"
                name="querstabProfil"
                options={profileOptions('querstab')}
                value={inputs.querstabProfilId}
                onChange={(querstabProfilId) => set({ querstabProfilId })}
                badge={() => 'TESTDATEN'}
              />
            )}
            {inputs.fuellungsart === 'glas' && (
              <OptionCardGroup
                legend="Glasart"
                name="glasTyp"
                options={GLASTYPEN}
                value={inputs.glasTyp}
                onChange={(glasTyp) => set({ glasTyp })}
                badge={() => 'TESTDATEN'}
              />
            )}
          </StepSection>

          <StepSection
            number={7}
            title="Ausführung, Oberfläche und Farbe"
            unlocked={steps.s7}
            done={steps.s8}
          >
            {!inputs.ohneHandlauf && (
              <OptionCardGroup
                legend="Handlauf-Abschluss"
                name="handlaufAbschluss"
                options={HANDLAUF_ABSCHLUESSE}
                value={inputs.handlaufAbschluss}
                onChange={(handlaufAbschluss) => set({ handlaufAbschluss })}
              />
            )}
            <OptionCardGroup
              legend="Oberflächenbehandlung"
              name="finish"
              options={FINISHES.filter((f) => f.active).map((f) => ({
                id: f.finishId,
                label: f.name.replace(/\s*\(TESTDATEN\)/, ''),
                description:
                  f.outdoorSuitable === null
                    ? 'Eignung innen/aussen wird fachlich geprüft.'
                    : f.outdoorSuitable
                      ? 'Für den Aussenbereich geeignet.'
                      : 'Nur Innenbereich.',
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
                      name="farbe"
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
              <p className="field-hint">
                Bildschirmfarben sind Näherungswerte – verbindlich ist die
                RAL-Karte. Standardfarben-Sortiment in fachlicher Freigabe.
              </p>
            </fieldset>
          </StepSection>

          <StepSection
            number={8}
            title="Montage"
            unlocked={steps.s8}
            done={inputs.montageService !== null}
          >
            <OptionCardGroup
              legend="Wer montiert?"
              name="montageService"
              options={MONTAGE_SERVICES}
              value={inputs.montageService}
              onChange={(montageService) => set({ montageService })}
            />
          </StepSection>
        </div>

        <aside className="configurator-aside">
          <RailingViewer
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
                    Gesamtlänge: <strong>{derived.gesamtlaengeMm} mm</strong>
                    {inputs.masseUngefaehr && ' (ungefähr)'}
                  </li>
                  <li>
                    Pfosten: <strong>{derived.pfostenTotal}</strong>
                    <span className="provisional"> provisorisch</span>
                  </li>
                  {derived.fuellstaebeTotal > 0 && (
                    <li>
                      Füllstäbe: <strong>{derived.fuellstaebeTotal}</strong>
                      <span className="provisional"> provisorisch</span>
                    </li>
                  )}
                  {derived.querstabLagen > 0 && (
                    <li>
                      Querstab-Lagen: <strong>{derived.querstabLagen}</strong>
                      <span className="provisional"> provisorisch</span>
                    </li>
                  )}
                  {derived.glasfelderTotal > 0 && (
                    <li>
                      Glasfelder: <strong>{derived.glasfelderTotal}</strong>
                      <span className="provisional"> provisorisch</span>
                    </li>
                  )}
                </ul>
                {material.length > 0 && (
                  <details className="material-details">
                    <summary>
                      Materialauszug (provisorisch, für die Werkstatt)
                    </summary>
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
                    <p className="field-hint">
                      Basis TESTDATEN-Regeln – verbindliche Stückliste erst
                      nach fachlicher Freigabe und Prüfung.
                    </p>
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
                Link kopiert – damit lässt sich die Konfiguration jederzeit
                wieder öffnen und teilen.
              </p>
            )}
            {shareState === 'shown' && (
              <p className="field-hint" role="status">
                Link zum Speichern: <code className="share-url">{shareUrl}</code>
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
