// Das ist die grosse Bildschirmseite, auf der man sein eigenes Gartentor
// zusammenstellt – Schritt für Schritt, wie bei einem Rezept.
// Links stehen die Fragen (Torart, Masse, Füllung, Farbe …),
// rechts sieht man das Tor in 3D und eine kleine Zusammenfassung.
// Alles, was man wählt, merkt sich die Seite, auch wenn man sie neu lädt.
import { useEffect, useMemo, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { StepSection } from '../../components/ui/StepSection';
import { OptionCardGroup } from '../../components/ui/OptionCardGroup';
import { NumberField } from '../../components/ui/NumberField';
import { TorViewer } from '../../viewer/TorViewer';
import { describeEstimate, estimateFor } from '../../pricing/estimate';
import { profilesForUse } from '../../rules/profiles';
import {
  GARTENTOR_RULES_V0,
  validateGartentor,
} from '../../rules/gartentor-rules';
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
  BLECHTYPEN,
  FARBEN,
  farbHex,
  LASER_MOTIVE,
  MONTAGE_SERVICES,
  ORNAMENT_TYPEN,
  type OptionDef,
} from '../gelaender/options';
import { deriveGartentor, torMaterialAuszug } from './derive';
import { buildTorGeometry } from './geometry';
import { tr } from '../../i18n';
import {
  DEFAULT_GARTENTOR_INPUTS,
  type Anschlagseite,
  type Fluegelart,
  type GartentorInputs,
  type Oeffnungsrichtung,
  type Seitenbau,
  type TorFuellung,
  type TorSchloss,
  type TorUntergrund,
} from './types';

// Unter diesem Namen legt der Browser unseren Entwurf in seine «Schublade»
// (localStorage), damit er beim nächsten Besuch noch da ist.
const STORAGE_KEY = 'webforge-gartentor-draft-v2';

// Die Auswahlkarten für «ein oder zwei Flügel». Jede Karte hat ein kleines
// Bildchen (icon) – das sind winzige Zeichnungen aus Rechtecken und Linien.
const FLUEGELARTEN: OptionDef<Fluegelart>[] = [
  {
    id: 'ein',
    label: 'Einflügelig',
    description: 'Ein Torflügel – für Gehöffnungen bis ca. Türbreite.',
    icon: '<rect x="8" y="10" width="24" height="30"/><line x1="14" y1="10" x2="14" y2="40"/><line x1="20" y1="10" x2="20" y2="40"/><line x1="26" y1="10" x2="26" y2="40"/><circle cx="30" cy="26" r="1.6"/>',
  },
  {
    id: 'zwei',
    label: 'Zweiflügelig',
    description: 'Zwei symmetrische Flügel – für breite Öffnungen und Einfahrten.',
    icon: '<rect x="6" y="10" width="17" height="30"/><rect x="25" y="10" width="17" height="30"/><line x1="12" y1="10" x2="12" y2="40"/><line x1="18" y1="10" x2="18" y2="40"/><line x1="30" y1="10" x2="30" y2="40"/><line x1="36" y1="10" x2="36" y2="40"/>',
  },
];

// Auswahlkarten: Hängt das Tor an einer alten Mauer oder an neuen Pfosten?
const SEITENBAUTEN: OptionDef<Seitenbau>[] = [
  {
    id: 'mauer',
    label: 'Bestehende Mauer / Pfosten',
    description: 'Das Tor wird an vorhandene Mauern oder Pfeiler montiert.',
    icon: '<rect x="4" y="8" width="10" height="34"/><rect x="34" y="8" width="10" height="34"/><line x1="14" y1="14" x2="34" y2="14"/><line x1="14" y1="38" x2="34" y2="38"/><line x1="20" y1="14" x2="20" y2="38"/><line x1="27" y1="14" x2="27" y2="38"/>',
  },
  {
    id: 'pfosten',
    label: 'Neue Torpfosten',
    description: 'Freistehend – wir liefern und setzen die Torpfosten.',
    icon: '<line x1="10" y1="42" x2="10" y2="8"/><line x1="38" y1="42" x2="38" y2="8"/><line x1="12" y1="14" x2="36" y2="14"/><line x1="12" y1="38" x2="36" y2="38"/><line x1="19" y1="14" x2="19" y2="38"/><line x1="29" y1="14" x2="29" y2="38"/>',
  },
];

// Geht das Tor zum Garten hin auf (innen) oder zum Weg hin (aussen)?
const OEFFNUNGSRICHTUNGEN: OptionDef<Oeffnungsrichtung>[] = [
  { id: 'innen', label: 'Öffnet nach innen', description: 'Flügel schwenken zum Grundstück (üblich).' },
  { id: 'aussen', label: 'Öffnet nach aussen', description: 'Flügel schwenken zum Weg – Platzverhältnisse prüfen.' },
];

// Auf welcher Seite sind die Scharniere? Wie bei einer Zimmertür:
// Man muss wissen, ob sie links oder rechts angeschlagen ist.
const ANSCHLAEGE: OptionDef<Anschlagseite>[] = [
  { id: 'links', label: 'Anschlag links', description: 'Bänder links (von aussen gesehen).' },
  { id: 'rechts', label: 'Anschlag rechts', description: 'Bänder rechts (von aussen gesehen).' },
];

// Worauf steht das Tor? Auf Beton, Pflastersteinen oder weicher Erde?
const UNTERGRUENDE_T: OptionDef<TorUntergrund>[] = [
  { id: 'beton', label: 'Beton', description: 'Betonfundament oder -platte vorhanden.' },
  { id: 'pflaster', label: 'Pflaster / Platten', description: 'Fundamente werden geplant.' },
  { id: 'mergel', label: 'Kies / Mergel / Erde', description: 'Fundamente werden erstellt.' },
  { id: 'unbekannt', label: 'Weiss ich nicht', description: 'Wird beim Aufmass geprüft.' },
];

// Womit wird der Flügel gefüllt? Stäbe, ein Blech oder schöne Schmiede-Schnörkel.
// 🤧 Schnupfspruch: Staketli, Blech und Schnörkeli fin –
//    jede Garte wott sis eigne Törli ha, und das isch schön!
const FUELLUNGEN_T: OptionDef<TorFuellung>[] = [
  {
    id: 'staketen',
    label: 'Staketen',
    description: 'Senkrechte Stäbe – klassisch und luftig.',
    icon: '<rect x="8" y="10" width="32" height="28"/><line x1="14" y1="10" x2="14" y2="38"/><line x1="20" y1="10" x2="20" y2="38"/><line x1="26" y1="10" x2="26" y2="38"/><line x1="32" y1="10" x2="32" y2="38"/>',
  },
  {
    id: 'blech',
    label: 'Blechfüllung',
    description: 'Voll, gelocht oder mit Laser-Motiv – Sichtschutz möglich.',
    icon: '<rect x="8" y="10" width="32" height="28"/><circle cx="18" cy="18" r="1.5"/><circle cx="26" cy="18" r="1.5"/><circle cx="34" cy="18" r="1.5"/><circle cx="18" cy="26" r="1.5"/><circle cx="26" cy="26" r="1.5"/><circle cx="34" cy="26" r="1.5"/>',
  },
  {
    id: 'geschmiedet',
    label: 'Charakter (geschmiedet)',
    description: 'Mit Schmiedeornamenten – Grundauswahl hier, Feinarbeit persönlich.',
    icon: '<rect x="8" y="10" width="32" height="28"/><path d="M24 14 C19 17 19 22 24 24 C29 26 29 31 24 34"/>',
  },
];

// Wie geht das Tor zu? Mit richtigem Schloss, mit einem Riegel oder gar nicht.
// 🤧 Schnupfspruch: De Schlüssel im Sack, de Riegel im Schloss –
//    und de Gartezwerg hüetet d Rose ganz grooss.
const SCHLOESSER: OptionDef<TorSchloss>[] = [
  {
    id: 'schloss-druecker',
    label: 'Schloss mit Drücker',
    description: 'Einsteckschloss, beidseitig Drücker – abschliessbar.',
  },
  { id: 'riegel', label: 'Überwurf / Riegel', description: 'Einfacher Verschluss, Vorhängeschloss möglich.' },
  { id: 'ohne', label: 'Ohne Verschluss', description: 'Nur Anschlag – z. B. für Gartenwege.' },
];

// Eine «Action» ist ein kleiner Auftrag an den Reducer:
// «set» = ändere diese Antworten, «reset» = alles zurück auf Anfang.
type Action =
  | { type: 'set'; patch: Partial<GartentorInputs> }
  | { type: 'reset' };

// Der Reducer ist wie ein ordentlicher Hausmeister: Er bekommt einen Auftrag
// und räumt danach auf, damit keine unpassenden Antworten übrig bleiben.
function reducer(state: GartentorInputs, action: Action): GartentorInputs {
  switch (action.type) {
    case 'set': {
      // Neue Antworten über die alten legen (wie ein frischer Kleber übers alte Etikett).
      const next = { ...state, ...action.patch };
      // Andere Füllung gewählt? Dann passen die alten Blech- oder Ornament-Wünsche
      // nicht mehr und werden gelöscht.
      if (action.patch.fuellung) {
        if (action.patch.fuellung !== 'blech') {
          next.blechTyp = null;
          next.laserMotiv = null;
        }
        if (action.patch.fuellung !== 'geschmiedet') next.ornamentTyp = null;
      }
      // Kein Laser-Blech? Dann braucht es auch kein Laser-Motiv.
      if (action.patch.blechTyp && action.patch.blechTyp !== 'laser') {
        next.laserMotiv = null;
      }
      // Anderes Material (z. B. Edelstahl statt Stahl)? Dann schauen wir alle
      // gewählten Profile und die Oberfläche an und werfen weg, was nicht passt.
      // 🤧 Schnupfspruch: Isch s Iise gwächslet, flüügt s Profil devo –
      //    de Huusmeister rumt uf, bevor d Gäscht chömed cho.
      if (action.patch.materialId) {
        for (const key of [
          'rahmenProfilId',
          'fuellstabProfilId',
          'pfostenProfilId',
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
    // «reset»: Zurück zum schönen Standard-Tor.
    case 'reset':
      return DEFAULT_GARTENTOR_INPUTS;
  }
}

// loadInitial: Beim Öffnen der Seite suchen wir einen alten Entwurf.
// Zuerst im Link (?c=…), sonst in der Browser-Schublade, sonst Standard-Tor.
function loadInitial(): GartentorInputs {
  try {
    // Steckt eine Konfiguration im Link? Dann auspacken (sie ist verschlüsselt
    // wie eine Geheimschrift, aber nur, damit sie in eine Web-Adresse passt).
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    if (fromUrl) {
      return {
        ...DEFAULT_GARTENTOR_INPUTS,
        ...(JSON.parse(decodeURIComponent(atob(fromUrl))) as GartentorInputs),
      };
    }
    // Sonst: Liegt noch etwas in der Browser-Schublade?
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return {
        ...DEFAULT_GARTENTOR_INPUTS,
        ...(JSON.parse(stored) as GartentorInputs),
      };
    }
  } catch {
    // defekte Drafts still verwerfen
  }
  return DEFAULT_GARTENTOR_INPUTS;
}

// profileOptions: Sucht alle Eisenprofile, die für eine bestimmte Aufgabe
// (Rahmen, Stab, Pfosten) beim Gartentor erlaubt sind, und macht Auswahlkarten daraus.
function profileOptions(
  role: ProfileRole,
  materialId: string | null
): OptionDef<string>[] {
  return profilesForUse(PROFILES, 'gartentor', role)
    .filter((p) => !materialId || p.material === materialId)
    .map((p) => ({
      id: p.profileId,
      label: p.name.replace(/^TESTDATEN\s*/, ''),
      description: crossSectionLabel(p),
    }));
}

// Das Hauptbauteil (Komponente) der Seite. Hier kommt alles zusammen.
// 🤧 Schnupfspruch: Es Törli im Browser, es Törli im Code –
//    und wänn s nöd schlüsst, isch es gwüss nume en Bug im Mode.
export function GartentorConfigurator() {
  const module = getProductModule('gartentor');
  // «inputs» sind alle Antworten; mit «dispatch» schicken wir dem Hausmeister Aufträge.
  const [inputs, dispatch] = useReducer(reducer, undefined, loadInitial);
  // Merkt sich, ob der Teilen-Link gerade kopiert oder angezeigt wird.
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shown'>('idle');
  const [shareUrl, setShareUrl] = useState('');

  // Jedes Mal, wenn sich eine Antwort ändert, speichern wir den Entwurf.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  // Kleine Abkürzung: set({...}) statt jedes Mal den ganzen Auftrag zu schreiben.
  const set = (patch: Partial<GartentorInputs>) => dispatch({ type: 'set', patch });

  // Wie dick ist ein Füllstab? Kennen wir das Profil nicht, nehmen wir 12 mm.
  const stabBreite = inputs.fuellstabProfilId
    ? profilBreiteMm(getProfile(inputs.fuellstabProfilId)!)
    : 12;

  // Ab hier wird gerechnet. useMemo ist wie ein Notizzettel: Man rechnet nur neu,
  // wenn sich etwas geändert hat – sonst liest man einfach vom Zettel ab.
  const derived = useMemo(
    () => deriveGartentor(inputs, stabBreite),
    [inputs, stabBreite]
  );

  // Aus Zahlen wird ein 3D-Bauplan (wo steht welches Teil?).
  const geometry = useMemo(
    () =>
      buildTorGeometry(inputs, derived, {
        rahmen: inputs.rahmenProfilId ? getProfile(inputs.rahmenProfilId) : undefined,
        stab: inputs.fuellstabProfilId
          ? getProfile(inputs.fuellstabProfilId)
          : undefined,
        pfosten: inputs.pfostenProfilId
          ? getProfile(inputs.pfostenProfilId)
          : undefined,
      }),
    [inputs, derived]
  );

  // Die Liste aller ausgewählten Profile (leere Plätze werden weggelassen).
  const selectedProfiles = useMemo(
    () =>
      [inputs.rahmenProfilId, inputs.fuellstabProfilId, inputs.pfostenProfilId]
        .map((id) => (id ? getProfile(id) : undefined))
        .filter((p): p is Profile => Boolean(p)),
    [inputs.rahmenProfilId, inputs.fuellstabProfilId, inputs.pfostenProfilId]
  );

  // Den Prüfer fragen: Ist alles in Ordnung? (rot / gelb)
  const validation = useMemo(
    () => validateGartentor(inputs, selectedProfiles),
    [inputs, selectedProfiles]
  );

  // Preis-Schätzung und Einkaufszettel für die Werkstatt.
  const estimate = estimateFor(module.priceVersion);
  const material = useMemo(
    () => torMaterialAuszug(inputs, derived),
    [inputs, derived]
  );

  // Sind Breite und Höhe eingetragen und grösser als 0?
  const masseOk =
    inputs.oeffnungBreiteMm !== null &&
    inputs.oeffnungBreiteMm > 0 &&
    inputs.hoeheMm !== null &&
    inputs.hoeheMm > 0;
  // Ist die Füllung fertig ausgewählt? Beim Blech braucht es eine Blechart
  // (und beim Laser ein Motiv), beim Geschmiedeten ein Ornament.
  const fuellungOk =
    inputs.fuellung === 'blech'
      ? inputs.blechTyp !== null &&
        (inputs.blechTyp !== 'laser' || inputs.laserMotiv !== null)
      : inputs.fuellung === 'geschmiedet'
        ? inputs.ornamentTyp !== null
        : inputs.fuellung !== null;
  // Braucht dieses Tor überhaupt Stäbe?
  const brauchtStab =
    inputs.fuellung === 'staketen' || inputs.fuellung === 'geschmiedet';
  // Welche Schritte sind erledigt? Wie in einem Videospiel: Erst wenn ein Level
  // geschafft ist, geht das nächste auf.
  // 🤧 Schnupfspruch: Schritt für Schritt, Level für Level –
  //    so chunnt au s Törli dur de Näbel.
  const steps = {
    s2: inputs.fluegelart !== null && inputs.seitenbau !== null,
    s3:
      inputs.oeffnungsrichtung !== null &&
      inputs.untergrund !== null &&
      (inputs.fluegelart !== 'ein' || inputs.anschlag !== null),
    s4: masseOk,
    s5: fuellungOk,
    s6: inputs.schloss !== null,
    s7: Boolean(
      inputs.materialId &&
        inputs.rahmenProfilId &&
        (!brauchtStab || inputs.fuellstabProfilId) &&
        (inputs.seitenbau !== 'pfosten' || inputs.pfostenProfilId)
    ),
    s8: Boolean(inputs.finishId && inputs.farbe),
  };
  // Erst wenn Masse und Flügelart bekannt sind, lohnt sich das 3D-Bild.
  const geometryReady = masseOk && inputs.fluegelart !== null;

  // Teilen: Wir packen alle Antworten in einen Link und kopieren ihn.
  // Klappt das Kopieren nicht, zeigen wir den Link einfach an.
  // Nach 6 Sekunden verschwindet die Meldung wieder.
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

  // Und jetzt: Was man auf dem Bildschirm sieht (JSX ist wie HTML in JavaScript).
  return (
    <div className="configurator">
      <p>
        <Link to="/">← {tr('Produktauswahl')}</Link>
      </p>
      <h1>{tr('Gartentor konfigurieren')}</h1>
      <p className="lead">
        {tr(
          'Ein- oder zweiflügeliges Drehtor – mit 3D-Vorschau inklusive Öffnungs-Simulation. Unser Meister prüft jede Konfiguration persönlich (Fundamente, Beschläge, Windlast).'
        )}
      </p>

      {/* Zwei Spalten: links die Schritte, rechts Vorschau und Zusammenfassung. */}
      <div className="configurator-layout">
        <div className="configurator-steps">
          {/* Schritt 1: Wie viele Flügel, und woran wird das Tor befestigt? */}
          <StepSection number={1} title="Torart" unlocked done={steps.s2}>
            <OptionCardGroup
              legend="Ein- oder zweiflügelig?"
              name="gt-fluegel"
              options={FLUEGELARTEN}
              value={inputs.fluegelart}
              onChange={(fluegelart) => set({ fluegelart })}
            />
            <OptionCardGroup
              legend="Wo wird das Tor angeschlagen?"
              name="gt-seiten"
              options={SEITENBAUTEN}
              value={inputs.seitenbau}
              onChange={(seitenbau) => set({ seitenbau })}
            />
            <p className="escape-hatch">
              {tr(
                'Schiebetore, automatisierte Anlagen oder Tore an starkem Gefälle planen wir individuell.'
              )}
            </p>
          </StepSection>

          {/* Schritt 2: In welche Richtung geht es auf, und worauf steht es? */}
          <StepSection number={2} title="Öffnung und Untergrund" unlocked={steps.s2} done={steps.s3}>
            <OptionCardGroup
              legend="Öffnungsrichtung"
              name="gt-richtung"
              options={OEFFNUNGSRICHTUNGEN}
              value={inputs.oeffnungsrichtung}
              onChange={(oeffnungsrichtung) => set({ oeffnungsrichtung })}
            />
            {/* Nur bei einem Flügel muss man sagen, wo die Scharniere sind. */}
            {inputs.fluegelart === 'ein' && (
              <OptionCardGroup
                legend="Anschlagseite (von aussen gesehen)"
                name="gt-anschlag"
                options={ANSCHLAEGE}
                value={inputs.anschlag}
                onChange={(anschlag) => set({ anschlag })}
              />
            )}
            <OptionCardGroup
              legend="Untergrund"
              name="gt-untergrund"
              options={UNTERGRUENDE_T}
              value={inputs.untergrund}
              onChange={(untergrund) => set({ untergrund })}
            />
          </StepSection>

          {/* Schritt 3: Messen! Breite, Höhe und die Luft unter dem Tor. */}
          {/* 🤧 Schnupfspruch: Zwöimol mässe, eimol bohre –
                susch hät de Schlosser d Gedult verlore. */}
          <StepSection
            number={3}
            title="Masse"
            hint="Lichte Öffnungsbreite zwischen Mauern/Pfosten messen. Spalten und Flügelteilung berechnen wir."
            unlocked={steps.s3}
            done={steps.s4}
          >
            <NumberField
              label="Lichte Öffnungsbreite"
              unit="mm"
              value={inputs.oeffnungBreiteMm}
              min={GARTENTOR_RULES_V0.minOeffnungMm}
              max={GARTENTOR_RULES_V0.maxOeffnungZweiMm}
              onChange={(oeffnungBreiteMm) => set({ oeffnungBreiteMm })}
            />
            <NumberField
              label="Torhöhe"
              unit="mm"
              value={inputs.hoeheMm}
              min={GARTENTOR_RULES_V0.minHoeheMm}
              max={GARTENTOR_RULES_V0.maxHoeheMm}
              onChange={(hoeheMm) => set({ hoeheMm })}
            />
            <NumberField
              label="Bodenfreiheit"
              unit="mm"
              step={5}
              value={inputs.bodenfreiheitMm}
              min={GARTENTOR_RULES_V0.minBodenfreiheitMm}
              max={GARTENTOR_RULES_V0.maxBodenfreiheitMm}
              hint="Abstand Flügelunterkante zum Boden."
              onChange={(v) => set({ bodenfreiheitMm: v ?? 30 })}
            />
            {/* Häkchen: «Ich habe nur ungefähr gemessen.» */}
            <label className="check-row">
              <input
                type="checkbox"
                checked={inputs.masseUngefaehr}
                onChange={(e) => set({ masseUngefaehr: e.target.checked })}
              />
              {tr('Meine Masse sind ungefähr (Aufmass nötig)')}
            </label>
          </StepSection>

          {/* Schritt 4: Die Füllung – und je nach Wahl noch Blechart, Motiv oder Ornament. */}
          <StepSection number={4} title="Füllung" unlocked={steps.s4} done={steps.s5}>
            <OptionCardGroup
              legend="Torfüllung"
              name="gt-fuellung"
              options={FUELLUNGEN_T}
              value={inputs.fuellung}
              onChange={(fuellung) => set({ fuellung })}
            />
            {inputs.fuellung === 'blech' && (
              <OptionCardGroup
                legend="Blechausführung"
                name="gt-blech"
                options={BLECHTYPEN}
                value={inputs.blechTyp}
                onChange={(blechTyp) => set({ blechTyp })}
              />
            )}
            {inputs.blechTyp === 'laser' && (
              <OptionCardGroup
                legend="Laserschnitt-Motiv"
                name="gt-motiv"
                options={LASER_MOTIVE}
                value={inputs.laserMotiv}
                onChange={(laserMotiv) => set({ laserMotiv })}
              />
            )}
            {inputs.fuellung === 'geschmiedet' && (
              <OptionCardGroup
                legend="Ornament-Grundauswahl"
                name="gt-ornament"
                options={ORNAMENT_TYPEN}
                value={inputs.ornamentTyp}
                onChange={(ornamentTyp) => set({ ornamentTyp })}
              />
            )}
          </StepSection>

          {/* Schritt 5: Schloss oder Riegel, und vielleicht später ein Motor. */}
          {/* 🤧 Schnupfspruch: E Törli mit Motor, das gaht vo sälber uf –
                aber s Hüehnli fragt: Wo isch de Chnopf? */}
          <StepSection number={5} title="Beschläge" unlocked={steps.s5} done={steps.s6}>
            <OptionCardGroup
              legend="Verschluss"
              name="gt-schloss"
              options={SCHLOESSER}
              value={inputs.schloss}
              onChange={(schloss) => set({ schloss })}
            />
            <label className="check-row">
              <input
                type="checkbox"
                checked={inputs.antriebVorbereitung}
                onChange={(e) => set({ antriebVorbereitung: e.target.checked })}
              />
              {tr('Vorbereitung für späteren Antrieb (Leerrohr) – wird persönlich geprüft')}
            </label>
          </StepSection>

          {/* Schritt 6: Aus welchem Metall und mit welchen Eisenstangen? */}
          <StepSection
            number={6}
            title="Material und Profile"
            hint="Testkatalog – definitive Querschnitte werden statisch bemessen und fachlich freigegeben."
            unlocked={steps.s6}
            done={steps.s7}
          >
            <OptionCardGroup
              legend="Werkstoff"
              name="gt-material"
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
                  name="gt-rahmen"
                  options={profileOptions('torrahmen', inputs.materialId)}
                  value={inputs.rahmenProfilId}
                  onChange={(rahmenProfilId) => set({ rahmenProfilId })}
                  badge={() => 'TESTDATEN'}
                />
                {brauchtStab && (
                  <OptionCardGroup
                    legend="Füllstab-Profil"
                    name="gt-stab"
                    options={profileOptions('torfuellung', inputs.materialId)}
                    value={inputs.fuellstabProfilId}
                    onChange={(fuellstabProfilId) => set({ fuellstabProfilId })}
                    badge={() => 'TESTDATEN'}
                  />
                )}
                {inputs.seitenbau === 'pfosten' && (
                  <OptionCardGroup
                    legend="Torpfosten-Profil"
                    name="gt-pfosten"
                    options={profileOptions('torpfosten', inputs.materialId)}
                    value={inputs.pfostenProfilId}
                    onChange={(pfostenProfilId) => set({ pfostenProfilId })}
                    badge={() => 'TESTDATEN'}
                  />
                )}
              </>
            )}
          </StepSection>

          {/* Schritt 7: Die Oberfläche (Schutz gegen Rost) und die Farbe. */}
          <StepSection number={7} title="Oberfläche und Farbe" unlocked={steps.s7} done={steps.s8}>
            <OptionCardGroup
              legend="Oberflächenbehandlung"
              name="gt-finish"
              options={FINISHES.filter(
                (f) =>
                  f.active &&
                  (!inputs.materialId ||
                    f.allowedMaterials.includes(inputs.materialId))
              ).map((f) => ({
                id: f.finishId,
                label: f.name
                  .replace(/\s*\(TESTDATEN\)/, '')
                  .replace(/,\s*TESTDATEN\)/, ')'),
                description: 'Eignung wird fachlich geprüft.',
              }))}
              value={inputs.finishId}
              onChange={(finishId) => set({ finishId })}
              badge={() => 'TESTDATEN'}
            />
            <fieldset className="option-group">
              <legend>{tr('Farbe')}</legend>
              <div className="swatch-row">
                {/* Für jede Farbe ein kleines rundes Farbmuster zum Anklicken. */}
                {FARBEN.map((farbe) => (
                  <label
                    key={farbe.id}
                    className={`swatch${inputs.farbe === farbe.id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="gt-farbe"
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

          {/* Schritt 8: Montieren wir, oder macht man es selbst? */}
          <StepSection
            number={8}
            title="Montage"
            unlocked={steps.s8}
            done={inputs.montageService !== null}
          >
            <OptionCardGroup
              legend="Wer montiert?"
              name="gt-service"
              options={MONTAGE_SERVICES}
              value={inputs.montageService}
              onChange={(montageService) => set({ montageService })}
            />
          </StepSection>
        </div>

        {/* Rechte Spalte: 3D-Vorschau und Zusammenfassung. */}
        <aside className="configurator-aside">
          {/* Das Tor in 3D – man kann es sogar auf- und zugehen lassen! */}
          {/* 🤧 Schnupfspruch: Drei Dimensione, zwei Flügel, ei Klick –
                s Törli gaht uf – was für es Glück! */}
          <TorViewer
            geometry={geometry}
            color={farbHex(inputs.farbe)}
            empty={!geometryReady}
            oeffnungsrichtung={inputs.oeffnungsrichtung ?? 'innen'}
          />

          {/* Die Zusammenfassung: wie ein Kassenzettel für die Auswahl. */}
          <div className="summary-card">
            <h2>{tr('Ihre Konfiguration')}</h2>
            {/* Sind Masse da, zeigen wir die ausgerechneten Werte, sonst einen Hinweis. */}
            {geometryReady ? (
              <>
                <ul className="summary-list">
                  <li>
                    {tr('Lichte Öffnung:')}{' '}
                    <strong>{inputs.oeffnungBreiteMm} mm</strong>
                    {inputs.masseUngefaehr && ` ${tr('(ungefähr)')}`}
                  </li>
                  <li>
                    {derived.fluegelBreitenMm.length > 1
                      ? tr('Flügelbreiten:')
                      : tr('Flügelbreite:')}{' '}
                    <strong>{derived.fluegelBreitenMm.join(' + ')} mm</strong>
                    <span className="provisional"> {tr('provisorisch')}</span>
                  </li>
                  {derived.staebeProFluegel > 0 && (
                    <li>
                      {tr('Stäbe je Flügel:')} <strong>{derived.staebeProFluegel}</strong>
                      <span className="provisional"> {tr('provisorisch')}</span>
                    </li>
                  )}
                  <li>
                    {tr('Bänder je Flügel:')} <strong>{derived.baenderProFluegel}</strong>
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

            {/* Rote Kiste für Fehler, gelbe Kiste für Hinweise. */}
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

            {/* Knöpfe: Link speichern, Offerte anfragen (kommt bald), zurücksetzen. */}
            {/* 🤧 Schnupfspruch: Es Chnöpfli zum Teile, es Chnöpfli zum Frage –
                  und eis zum Vergässe – das darf me au mal wage. */}
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
            {/* Kleine Rückmeldung, nachdem man den Link geteilt hat. */}
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

            {/* Ganz klein unten: Versionsnummern, damit die Werkstatt weiss, womit gerechnet wurde. */}
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
