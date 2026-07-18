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
  MATERIALS,
  PROFILES,
  profilBreiteMm,
} from '../profile-catalog';
import type { Profile, ProfileRole } from '../types';
import { deriveGelaender, materialAuszug } from './derive';
import { buildRailingGeometry } from './geometry';
import {
  ABSTURZ_OPTIONEN,
  BLECHTYPEN,
  HANDLAUF_POSITIONEN,
  LASER_MOTIVE,
  ORNAMENT_DICHTEN,
  ORNAMENT_GROESSEN,
  ORNAMENT_LAGEN,
  ORNAMENT_TYPEN,
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
  OBERGURT_STANDARD_ABSTAND_MM,
  obergurtAktiv,
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
        if (action.patch.fuellungsart !== 'blech') {
          next.blechTyp = null;
          next.laserMotiv = null;
        }
        if (action.patch.fuellungsart !== 'gitter') next.gitterTyp = null;
        if (action.patch.fuellungsart !== 'geschmiedet') next.ornamentTyp = null;
      }
      if (action.patch.blechTyp && action.patch.blechTyp !== 'laser') {
        next.laserMotiv = null;
      }
      // Materialwechsel: nicht mehr passende Katalogprofile abwaehlen.
      if (action.patch.materialId) {
        for (const key of [
          'pfostenProfilId',
          'handlaufProfilId',
          'fuellstabProfilId',
          'querstabProfilId',
        ] as const) {
          const id = next[key];
          if (id) {
            const prof = PROFILES.find((p) => p.profileId === id);
            if (prof && prof.material !== action.patch.materialId) {
              next[key] = null;
            }
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

function profileOptions(
  role: ProfileRole,
  materialId: string | null
): OptionDef<string>[] {
  return profilesForUse(PROFILES, 'gelaender', role)
    .filter((p) => !materialId || p.material === materialId)
    .map((p) => ({
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
        inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet'
          ? inputs.fuellstabProfilId
          : null,
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
  const stabBreite =
    inputs.fuellungsart !== 'querstab' && inputs.fuellstabWunschDm
      ? inputs.fuellstabWunschDm
      : stabProfil
        ? profilBreiteMm(getProfile(stabProfil)!)
        : 12;

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
      ? inputs.blechTyp !== null &&
        (inputs.blechTyp !== 'laser' || inputs.laserMotiv !== null)
      : inputs.fuellungsart === 'gitter'
        ? inputs.gitterTyp !== null
        : inputs.fuellungsart === 'geschmiedet'
          ? inputs.ornamentTyp !== null
          : inputs.fuellungsart !== null;
  const fuellungOk =
    inputs.fuellungsart === 'staketen' || inputs.fuellungsart === 'geschmiedet'
      ? Boolean(inputs.fuellstabProfilId || inputs.fuellstabWunschDm)
      : inputs.fuellungsart === 'querstab'
        ? Boolean(inputs.querstabProfilId)
        : inputs.fuellungsart === 'glas'
          ? Boolean(inputs.glasTyp)
          : true; // Blech/Gitter brauchen kein zusätzliches Stabprofil
  const profileOk = Boolean(
    inputs.materialId &&
      inputs.pfostenProfilId &&
      (inputs.ohneHandlauf || inputs.handlaufProfilId || inputs.handlaufWunschDm) &&
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

  const hoeheOderDefault = inputs.hoeheMm ?? 1000;

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
            {inputs.montageart && (
              <fieldset className="option-group">
                <legend>
                  {inputs.montageart === 'boden'
                    ? 'Fussplatten-Wunschmass'
                    : inputs.montageart === 'seite'
                      ? 'Schwert-Wunschmass'
                      : inputs.montageart === 'unten'
                        ? 'Kragarm-Wunschmass'
                        : inputs.montageart === 'eingelassen'
                          ? 'Einbindung'
                          : 'Wandlaschen-Wunschmass'}
                </legend>
                <div className="field-row">
                  {inputs.montageart === 'boden' && (
                    <>
                      <NumberField label="Länge" unit="mm" value={inputs.fussplatteLaengeMm}
                        min={GELAENDER_RULES_V0.minFussplatteMm} max={GELAENDER_RULES_V0.maxFussplatteMm}
                        onChange={(v) => set({ fussplatteLaengeMm: v ?? 120 })} />
                      <NumberField label="Breite" unit="mm" value={inputs.fussplatteBreiteMm}
                        min={GELAENDER_RULES_V0.minFussplatteMm} max={GELAENDER_RULES_V0.maxFussplatteMm}
                        onChange={(v) => set({ fussplatteBreiteMm: v ?? 120 })} />
                      <NumberField label="Dicke" unit="mm" step={1} value={inputs.fussplatteDickeMm}
                        min={GELAENDER_RULES_V0.minFussplatteDickeMm} max={GELAENDER_RULES_V0.maxFussplatteDickeMm}
                        onChange={(v) => set({ fussplatteDickeMm: v ?? 10 })} />
                    </>
                  )}
                  {inputs.montageart === 'seite' && (
                    <>
                      <NumberField label="Höhe" unit="mm" value={inputs.schwertHoeheMm}
                        min={100} max={400}
                        onChange={(v) => set({ schwertHoeheMm: v ?? 160 })} />
                      <NumberField label="Breite" unit="mm" value={inputs.schwertBreiteMm}
                        min={40} max={150}
                        onChange={(v) => set({ schwertBreiteMm: v ?? 60 })} />
                      <NumberField label="Dicke" unit="mm" step={1} value={inputs.schwertDickeMm}
                        min={6} max={25}
                        onChange={(v) => set({ schwertDickeMm: v ?? 12 })} />
                    </>
                  )}
                  {inputs.montageart === 'unten' && (
                    <>
                      <NumberField label="Auskragung" unit="mm" value={inputs.kragarmLaengeMm}
                        min={150} max={600}
                        onChange={(v) => set({ kragarmLaengeMm: v ?? 300 })} />
                      <NumberField label="Profilstärke" unit="mm" step={5} value={inputs.kragarmStaerkeMm}
                        min={30} max={100}
                        onChange={(v) => set({ kragarmStaerkeMm: v ?? 50 })} />
                    </>
                  )}
                  {inputs.montageart === 'eingelassen' && (
                    <NumberField label="Einbindetiefe" unit="mm" step={5} value={inputs.einlassTiefeMm}
                      min={60} max={250}
                      onChange={(v) => set({ einlassTiefeMm: v ?? 100 })} />
                  )}
                  {inputs.montageart === 'wand' && (
                    <>
                      <NumberField label="Höhe" unit="mm" value={inputs.wandlascheHoeheMm}
                        min={60} max={200}
                        onChange={(v) => set({ wandlascheHoeheMm: v ?? 100 })} />
                      <NumberField label="Breite" unit="mm" value={inputs.wandlascheBreiteMm}
                        min={40} max={120}
                        onChange={(v) => set({ wandlascheBreiteMm: v ?? 60 })} />
                      <NumberField label="Dicke" unit="mm" step={1} value={inputs.wandlascheDickeMm}
                        min={5} max={15}
                        onChange={(v) => set({ wandlascheDickeMm: v ?? 8 })} />
                    </>
                  )}
                </div>
                <p className="field-hint">
                  Darstellung inkl. Ankerbild in der 3D-Vorschau. Definitive
                  Ausführung, Dübel und Randabstände werden statisch bemessen.
                </p>
              </fieldset>
            )}
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
            {inputs.blechTyp === 'laser' && (
              <OptionCardGroup
                legend="Laserschnitt-Motiv (Grundauswahl)"
                name="laserMotiv"
                options={LASER_MOTIVE}
                value={inputs.laserMotiv}
                onChange={(laserMotiv) => set({ laserMotiv })}
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
            {inputs.fuellungsart === 'geschmiedet' && (
              <>
                <OptionCardGroup
                  legend="Ornament-Grundauswahl (Feinausarbeitung persönlich)"
                  name="ornamentTyp"
                  options={ORNAMENT_TYPEN}
                  value={inputs.ornamentTyp}
                  onChange={(ornamentTyp) => set({ ornamentTyp })}
                />
                {inputs.ornamentTyp && (
                  <>
                    <OptionCardGroup
                      legend="Ornament-Grösse"
                      name="ornamentGroesse"
                      options={ORNAMENT_GROESSEN}
                      value={inputs.ornamentGroesse}
                      onChange={(ornamentGroesse) => set({ ornamentGroesse })}
                    />
                    <OptionCardGroup
                      legend="Ornament-Lage im Feld"
                      name="ornamentLage"
                      options={ORNAMENT_LAGEN}
                      value={inputs.ornamentLage}
                      onChange={(ornamentLage) => set({ ornamentLage })}
                    />
                    <OptionCardGroup
                      legend="Ornament-Rhythmus"
                      name="ornamentDichte"
                      options={ORNAMENT_DICHTEN}
                      value={inputs.ornamentDichte}
                      onChange={(ornamentDichte) => set({ ornamentDichte })}
                    />
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={inputs.ornamentDoppelt}
                        onChange={(e) => set({ ornamentDoppelt: e.target.checked })}
                      />
                      Doppelreihe (zwei Ornamente übereinander)
                    </label>
                  </>
                )}
              </>
            )}
            <fieldset className="option-group">
              <legend>Konstruktion (Gurte und Handlauf-Lage)</legend>
              {!inputs.ohneHandlauf && (
                <OptionCardGroup
                  legend="Handlauf-Position"
                  name="handlaufPosition"
                  options={HANDLAUF_POSITIONEN}
                  value={inputs.handlaufPosition}
                  onChange={(handlaufPosition) => set({ handlaufPosition })}
                />
              )}
              <p className="field-hint">
                {obergurtAktiv(inputs)
                  ? 'Aufgesetzter Handlauf: Der Obergurt entsteht automatisch (Rahmenbauweise).'
                  : 'Handlauf zwischen den Pfosten: Er übernimmt selbst die Obergurt-Funktion.'}
              </p>
              {obergurtAktiv(inputs) && (
                <NumberField
                  label="Obergurt-Höhe über Boden"
                  unit="mm"
                  value={
                    inputs.obergurtHoeheMm ??
                    hoeheOderDefault - OBERGURT_STANDARD_ABSTAND_MM
                  }
                  min={200}
                  max={hoeheOderDefault - 20}
                  hint="Standard: knapp unter dem Handlauf. Anpassbar für tiefere Rahmen."
                  onChange={(v) => set({ obergurtHoeheMm: v })}
                />
              )}
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={inputs.mitUntergurt}
                  onChange={(e) => set({ mitUntergurt: e.target.checked })}
                />
                Untergurt (unterer Rahmengurt – konstruktiv üblich)
              </label>
              {inputs.mitUntergurt && (
                <NumberField
                  label="Untergurt-Höhe über Boden"
                  unit="mm"
                  step={5}
                  value={inputs.untergurtHoeheMm}
                  min={20}
                  max={Math.floor(hoeheOderDefault / 2)}
                  onChange={(v) => set({ untergurtHoeheMm: v ?? 80 })}
                />
              )}
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={inputs.mitKnieleiste}
                  onChange={(e) =>
                    set({
                      mitKnieleiste: e.target.checked,
                      knieleisteHoeheMm: e.target.checked
                        ? (inputs.knieleisteHoeheMm ??
                          Math.round(hoeheOderDefault / 2))
                        : inputs.knieleisteHoeheMm,
                    })
                  }
                />
                Knieleiste (mittlerer Gurt)
              </label>
              {inputs.mitKnieleiste && (
                <NumberField
                  label="Knieleisten-Höhe über Boden"
                  unit="mm"
                  value={inputs.knieleisteHoeheMm}
                  min={100}
                  max={hoeheOderDefault - 50}
                  onChange={(v) => set({ knieleisteHoeheMm: v })}
                />
              )}
              <p className="field-hint">
                Gurthöhen sind Gestaltungswünsche – Öffnungsmasse und
                Kletterschutz werden fachlich geprüft (BFU).
              </p>
            </fieldset>
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
              legend="Werkstoff"
              name="materialId"
              options={MATERIALS.filter((m) => m.active).map((m) => ({
                id: m.materialId,
                label: m.name.replace(/\s*\(TESTDATEN\)/, ''),
                description:
                  m.materialId === 'test-edelstahl'
                    ? 'Rostfrei - geschliffen oder gebuerstet, ideal aussen.'
                    : 'Klassischer Schlosserstahl - verzinkt oder beschichtet.',
              }))}
              value={inputs.materialId}
              onChange={(materialId) => set({ materialId })}
              badge={() => 'TESTDATEN'}
            />
            {inputs.materialId && (
              <>
            <OptionCardGroup
              legend="Pfosten"
              name="pfostenProfil"
              options={profileOptions('pfosten', inputs.materialId)}
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
              <>
                <OptionCardGroup
                  legend="Handlauf"
                  name="handlaufProfil"
                  options={profileOptions('handlauf', inputs.materialId)}
                  value={inputs.handlaufProfilId}
                  onChange={(handlaufProfilId) =>
                    set({ handlaufProfilId, handlaufWunschDm: null })
                  }
                  badge={() => 'TESTDATEN'}
                />
                <details
                  className="material-details"
                  open={inputs.handlaufWunschDm !== null}
                >
                  <summary>Wunschmass Handlauf (Sonderprofil, pruefpflichtig)</summary>
                  <NumberField
                    label="Runddurchmesser"
                    unit="mm"
                    step={1}
                    value={inputs.handlaufWunschDm}
                    min={GELAENDER_RULES_V0.minWunschDmMm}
                    max={GELAENDER_RULES_V0.maxWunschDmMm}
                    hint="Kein Katalogprofil - Machbarkeit und Statik werden fachlich geprueft."
                    onChange={(handlaufWunschDm) => set({ handlaufWunschDm })}
                  />
                </details>
              </>
            )}
            {(inputs.fuellungsart === 'staketen' ||
              inputs.fuellungsart === 'geschmiedet') && (
              <>
                <OptionCardGroup
                  legend="Füllstäbe (Staketen)"
                  name="fuellstabProfil"
                  options={profileOptions('fuellstab', inputs.materialId)}
                  value={inputs.fuellstabProfilId}
                  onChange={(fuellstabProfilId) =>
                    set({ fuellstabProfilId, fuellstabWunschDm: null })
                  }
                  badge={() => 'TESTDATEN'}
                />
                <details
                  className="material-details"
                  open={inputs.fuellstabWunschDm !== null}
                >
                  <summary>Wunschmass Staketen (Sonderprofil, pruefpflichtig)</summary>
                  <NumberField
                    label="Runddurchmesser"
                    unit="mm"
                    step={1}
                    value={inputs.fuellstabWunschDm}
                    min={GELAENDER_RULES_V0.minWunschDmMm}
                    max={GELAENDER_RULES_V0.maxWunschDmMm}
                    hint="Kein Katalogprofil - Machbarkeit und Statik werden fachlich geprueft."
                    onChange={(fuellstabWunschDm) => set({ fuellstabWunschDm })}
                  />
                </details>
              </>
            )}
            {inputs.fuellungsart === 'querstab' && (
              <OptionCardGroup
                legend="Querstäbe (Reling)"
                name="querstabProfil"
                options={profileOptions('querstab', inputs.materialId)}
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
              </>
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
              options={FINISHES.filter(
                (f) =>
                  f.active &&
                  (!inputs.materialId ||
                    f.allowedMaterials.includes(inputs.materialId))
              ).map((f) => ({
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
