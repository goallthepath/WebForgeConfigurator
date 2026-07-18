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
  ABSTURZ_OPTIONEN,
  BLECHTYPEN,
  EINBAUORTE,
  EINSATZORTE,
  FARBEN,
  farbHex,
  FUELLUNGSARTEN,
  GITTERTYPEN,
  GLASTYPEN,
  HANDLAUF_ABSCHLUESSE,
  KINDERSCHUTZ_OPTIONEN,
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
      // Füllungswechsel räumt nicht mehr passende Unterauswahlen auf.
      if (action.patch.fuellungsart) {
        if (action.patch.fuellungsart !== 'glas') {
          next.ohneHandlauf = false;
          next.glasTyp = null;
        }
        if (action.patch.fuellungsart !== 'blech') next.blechTyp = null;
        if (action.patch.fuellungsart !== 'gitter') next.gitterTyp = null;
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

  // Untergurt nutzt automatisch das freigegebene Rahmenprofil des Katalogs.
  const untergurtProfil = useMemo(
    () => profilesForUse(PROFILES, 'gelaender', 'rahmen')[0],
    []
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
        untergurt: untergurtProfil,
      }),
    [inputs, derived, untergurtProfil]
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
  const sicherheitOk =
    inputs.kinderschutz !== null &&
    inputs.absturzhoehe !== null &&
    inputs.einbauort !== null;
  const masseOk =
    inputs.segmentLaengenMm.length > 0 &&
    inputs.segmentLaengenMm.every((l) => l > 0) &&
    inputs.hoeheMm !== null &&
    inputs.hoeheMm > 0;
  const typOk =
    inputs.fuellungsart === 'blech'
      ? inputs.blechTyp !== null
      : inputs.fuellungsart === 'gitter'
        ? inputs.gitterTyp !== null
        : inputs.fuellungsart !== null;
  const fuellungOk =
    inputs.fuellungsart === 'staketen'
      ? Boolean(inputs.fuellstabProfilId)
      : inputs.fuellungsart === 'querstab'
        ? Boolean(inputs.querstabProfilId)
        : inputs.fuellungsart === 'glas'
          ? Boolean(inputs.glasTyp)
          : true; // Blech/Gitter brauchen kein zusätzliches Stabprofil
  const profileOk = Boolean(
    inputs.pfostenProfilId &&
      (inputs.ohneHandlauf || inputs.handlaufProfilId) &&
      fuellungOk
  );
  const ausfuehrungOk = inputs.ohneHandlauf || inputs.handlaufAbschluss !== null;
  const steps = {
    s2: inputs.einsatzort !== null,
    s3: sicherheitOk,
    s4: inputs.variante !== null,
    s5: inputs.montageart !== null && inputs.untergrund !== null,
    s6: masseOk,
    s7: typOk,
    s8: profileOk,
    s9: ausfuehrungOk && Boolean(inputs.finishId && inputs.farbe),
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

  const zeigeUntergurt =
    inputs.fuellungsart === 'staketen' ||
    inputs.fuellungsart === 'blech' ||
    inputs.fuellungsart === 'gitter';

  return (
    <div className="configurator">
      <p>
        <Link to="/">← Produktauswahl</Link>
      </p>
      <h1>Geländer konfigurieren</h1>
      <p className="lead">
        Stellen Sie Ihr Geländer Schritt für Schritt zusammen – mit
        3D-Vorschau und Masszeichnung. Am Ende senden Sie eine unverbindliche
        Offertanfrage; unser Meister prüft jede Konfiguration persönlich
        (Sicherheit nach BFU/SIA gehört zur fachlichen Prüfung).
      </p>

      <div className="configurator-layout">
        <div className="configurator-steps">
          <StepSection number={1} title="Einsatzort" unlocked done={steps.s2}>
            <OptionCardGroup
              legend="Wo kommt das Geländer zum Einsatz?"
              name="einsatzort"
              options={EINSATZORTE}
              value={inputs.einsatzort}
              onChange={(einsatzort) => set({ einsatzort })}
            />
            <p className="escape-hatch">
              <strong>Treppengeländer?</strong> Dafür entsteht ein eigener
              Konfigurator (Stufenverlauf, Podeste, Handlaufführung) – bis
              dahin: <a href="/projekt-starten/">Anfrage für Treppengeländer</a>.
              Ebenfalls persönlich geplant:{' '}
              <a href="/projekt-starten/">Industriegeländer</a> (Suva-Regelwerk)
              und <a href="/projekt-starten/">Bestandssanierung/Erhöhung</a>.
            </p>
          </StepSection>

          <StepSection
            number={2}
            title="Nutzung und Sicherheit"
            hint="Diese Angaben steuern die Sicherheitsprüfung nach BFU-Richtwerten – die verbindliche Beurteilung erfolgt fachlich am Objekt."
            unlocked={steps.s2}
            done={steps.s3}
          >
            <OptionCardGroup
              legend="Sind Kinder zu erwarten?"
              name="kinderschutz"
              options={KINDERSCHUTZ_OPTIONEN}
              value={inputs.kinderschutz}
              onChange={(kinderschutz) => set({ kinderschutz })}
            />
            <OptionCardGroup
              legend="Wie hoch ist die Absturzhöhe hinter dem Geländer?"
              name="absturzhoehe"
              options={ABSTURZ_OPTIONEN}
              value={inputs.absturzhoehe}
              onChange={(absturzhoehe) => set({ absturzhoehe })}
            />
            <OptionCardGroup
              legend="Innen- oder Aussenbereich?"
              name="einbauort"
              options={EINBAUORTE}
              value={inputs.einbauort}
              onChange={(einbauort) => set({ einbauort })}
            />
          </StepSection>

          <StepSection number={3} title="Form wählen" unlocked={steps.s3} done={steps.s4}>
            <OptionCardGroup
              legend="Welchen Grundriss hat Ihr Geländer?"
              name="variante"
              options={VARIANTEN}
              value={inputs.variante}
              onChange={(variante) => set({ variante })}
            />
            <p className="escape-hatch">
              Mehr Ecken, Winkel ≠ 90° oder geschwungene Verläufe?{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a> –
              Unser Meister plant sie persönlich mit Ihnen.
            </p>
          </StepSection>

          <StepSection
            number={4}
            title="Befestigung und Untergrund"
            unlocked={steps.s4}
            done={steps.s5}
          >
            <OptionCardGroup
              legend="Wie soll befestigt werden? (Wunsch – die definitive Verankerung wird statisch geprüft)"
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
            number={5}
            title="Masse"
            hint="Messen Sie entlang der Vorderkante, bei Ecken jedes Segment einzeln. Achtung Messbezug: massgebend ist die begehbare bzw. besteigbare Fläche (Bank, Kiste oder späterer Belag zählt mit)."
            unlocked={steps.s5}
            done={steps.s6}
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
              hint="BFU-Richtwert bei Absturzsicherung: mindestens 1000 mm. Die verbindliche Höhe wird fachlich am Objekt festgelegt."
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
            number={6}
            title="Geländertyp"
            unlocked={steps.s6}
            done={steps.s7}
          >
            <OptionCardGroup
              legend="Welche Füllung wünschen Sie?"
              name="fuellungsart"
              options={FUELLUNGSARTEN}
              value={inputs.fuellungsart}
              onChange={(fuellungsart) => set({ fuellungsart })}
            />
            {inputs.fuellungsart === 'blech' && (
              <OptionCardGroup
                legend="Blechausführung"
                name="blechTyp"
                options={BLECHTYPEN}
                value={inputs.blechTyp}
                onChange={(blechTyp) => set({ blechTyp })}
              />
            )}
            {inputs.fuellungsart === 'gitter' && (
              <OptionCardGroup
                legend="Gitterausführung"
                name="gitterTyp"
                options={GITTERTYPEN}
                value={inputs.gitterTyp}
                onChange={(gitterTyp) => set({ gitterTyp })}
              />
            )}
            {zeigeUntergurt && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={inputs.mitUntergurt}
                  onChange={(e) => set({ mitUntergurt: e.target.checked })}
                />
                Mit Untergurt (unterer Rahmengurt – konstruktiv üblich)
              </label>
            )}
            <p className="escape-hatch">
              Schmiedeeiserne Ornamente, Voluten, Rosetten oder historische
              Nachbildungen?{' '}
              <a href="/projekt-starten/">Individuelle Ausführung anfragen</a> –
              das ist das Kernhandwerk der Kunstschlosserei.
            </p>
          </StepSection>

          <StepSection
            number={7}
            title="Profile wählen"
            hint="Alle Profile stammen aus dem WebForge-Standardkatalog. Aktuell Testkatalog – definitive Querschnitte werden statisch bemessen und fachlich freigegeben."
            unlocked={steps.s7}
            done={steps.s8}
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
                legend="Füllstäbe (Staketen)"
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
            number={8}
            title="Ausführung, Oberfläche und Farbe"
            unlocked={steps.s8}
            done={steps.s9}
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
                RAL-Karte. Duplex-System (verzinkt + beschichtet) empfiehlt
                sich aussen; Details klärt die fachliche Prüfung.
              </p>
            </fieldset>
          </StepSection>

          <StepSection
            number={9}
            title="Montage"
            unlocked={steps.s9}
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
                      Füllfelder: <strong>{derived.glasfelderTotal}</strong>
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
                      nach statischer Bemessung und fachlicher Freigabe.
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
