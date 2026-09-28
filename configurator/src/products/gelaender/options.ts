// ─────────────────────────────────────────────────────────────────────────
// Für Kinder erklärt: Diese Datei ist wie die Speisekarte im Restaurant.
// Für jede Frage im Geländer-Assistenten steht hier, welche Antworten man
// antippen kann – mit Namen, einem kurzen Erklärsatz und manchmal einem
// kleinen Bildchen (Piktogramm). Hier wird nichts gerechnet, nur aufgezählt.
// ─────────────────────────────────────────────────────────────────────────
import type {
  Absturzhoehe,
  BlechTyp,
  Einbauort,
  Einsatzort,
  Fuellungsart,
  GelaenderVariante,
  GitterTyp,
  GlasTyp,
  HandlaufAbschluss,
  HandlaufPosition,
  Kinderschutz,
  LaserMotiv,
  Montageart,
  MontageService,
  OrnamentTyp,
  Untergrund,
} from './types';

// 🤧 Schnupfspruch: Uf de Charte stoht vill, doch s Gländer bliibt still –
//    wähl was d wotsch, gäll, und dänn e Prise schnäll!
/** Optionslisten des Geländer-Assistenten (Texte, keine Fachlogik). */

// Kinder-Erklärung: So sieht EIN Knopf auf der Speisekarte aus – er hat
// einen Namen im Computer (id), eine Beschriftung (label), einen Erklärsatz
// (description) und vielleicht ein Bildchen (icon), das mit Strichen und
// Kreisen gezeichnet wird wie mit einem Lineal auf Häuschenpapier.
export interface OptionDef<T extends string> {
  id: T;
  label: string;
  description: string;
  /** Inline-SVG-Piktogramm (viewBox 0 0 48 48), optional. */
  icon?: string;
}

// Wo steht das Geländer? Jede Antwort hat ein kleines Strich-Bildchen:
// z. B. «line» ist ein Strich von einem Punkt zum anderen, «rect» ein Rechteck.
export const EINSATZORTE: OptionDef<Einsatzort>[] = [
  {
    id: 'balkon',
    label: 'Balkon / Loggia',
    description: 'Absturzsicherung am Balkon – Kinderschutz und Befestigung im Fokus.',
    icon: '<rect x="8" y="22" width="32" height="4"/><line x1="10" y1="22" x2="10" y2="10"/><line x1="24" y1="22" x2="24" y2="10"/><line x1="38" y1="22" x2="38" y2="10"/><line x1="8" y1="10" x2="40" y2="10"/>',
  },
  {
    id: 'terrasse',
    label: 'Terrasse / Sitzplatz',
    description: 'Geländer an Terrasse oder erhöhtem Sitzplatz.',
    icon: '<line x1="6" y1="36" x2="42" y2="36"/><line x1="10" y1="36" x2="10" y2="16"/><line x1="24" y1="36" x2="24" y2="16"/><line x1="38" y1="36" x2="38" y2="16"/><line x1="8" y1="16" x2="40" y2="16"/>',
  },
  {
    id: 'attika',
    label: 'Dachterrasse / Attika',
    description: 'Auf dem Flachdach – Dachhaut, Abdichtung und Wind werden speziell geprüft.',
    icon: '<polyline points="6,38 6,26 42,26 42,38"/><line x1="12" y1="26" x2="12" y2="12"/><line x1="24" y1="26" x2="24" y2="12"/><line x1="36" y1="26" x2="36" y2="12"/><line x1="10" y1="12" x2="38" y2="12"/>',
  },
  {
    id: 'franz-balkon',
    label: 'Französischer Balkon',
    description: 'Vor bodentiefem Fenster – Befestigung an Fassade oder Leibung.',
    icon: '<rect x="14" y="8" width="20" height="32"/><line x1="10" y1="24" x2="10" y2="40"/><line x1="38" y1="24" x2="38" y2="40"/><line x1="10" y1="26" x2="38" y2="26"/>',
  },
  {
    id: 'garten',
    label: 'Garten / Stützmauer',
    description: 'Auf Mauer oder Böschung – Terrainverlauf und Fundament beachten.',
    icon: '<polyline points="6,40 20,40 20,30 42,30"/><line x1="24" y1="30" x2="24" y2="16"/><line x1="34" y1="30" x2="34" y2="16"/><line x1="22" y1="16" x2="36" y2="16"/>',
  },
  {
    id: 'podest',
    label: 'Podest / Galerie',
    description: 'Innenpodest, Galerie oder Laubengang.',
    icon: '<line x1="6" y1="38" x2="42" y2="38"/><rect x="14" y="30" width="20" height="8"/><line x1="16" y1="30" x2="16" y2="14"/><line x1="32" y1="30" x2="32" y2="14"/><line x1="14" y1="14" x2="34" y2="14"/>',
  },
];

// Sind Kinder da? Ja, nein, oder «weiss ich nicht» – im Zweifel planen
// wir immer so, dass Kinder sicher sind.
export const KINDERSCHUTZ_OPTIONEN: OptionDef<Kinderschutz>[] = [
  {
    id: 'ja',
    label: 'Ja',
    description: 'Kinder sind zu erwarten – BFU-Kinderschutz (12-cm-Regel, Kletterschutz) fliesst in die Prüfung ein.',
  },
  {
    id: 'nein',
    label: 'Nein',
    description: 'Keine Kinder zu erwarten (z. B. reiner Betriebsbereich).',
  },
  {
    id: 'unbekannt',
    label: 'Weiss ich nicht',
    description: 'Im Zweifel wird kindersicher geplant.',
  },
];

// Wie tief könnte man fallen? Mehr als 1 Meter ist so hoch wie ein
// Küchentisch plus noch ein bisschen – da muss ein richtiges Geländer hin.
export const ABSTURZ_OPTIONEN: OptionDef<Absturzhoehe>[] = [
  {
    id: 'ueber-1m',
    label: 'Mehr als 1 m',
    description: 'Absturzsicherung erforderlich (BFU-Richtwert: Geländerhöhe ≥ 1.00 m).',
  },
  {
    id: 'unter-1m',
    label: 'Weniger als 1 m',
    description: 'Geringe Höhe – Geländer dient primär als Abgrenzung.',
  },
  {
    id: 'unbekannt',
    label: 'Weiss ich nicht',
    description: 'Wird beim Aufmass gemessen.',
  },
];

// Die Grundformen von oben gesehen: gerade wie ein I, mit einer Ecke wie
// ein L oder mit zwei Ecken wie ein U. Die Bildchen zeigen genau das.
// 🤧 Schnupfspruch: I, L oder U – s Gländer hebt, und du?
//    Mit eme Schnupf i de Nase stahsch du wie en Pfoste im Rase.
export const VARIANTEN: OptionDef<GelaenderVariante>[] = [
  {
    id: 'i',
    label: 'Gerade (I)',
    description: 'Ein gerades Geländer ohne Ecken.',
    icon: '<line x1="6" y1="24" x2="42" y2="24"/>',
  },
  {
    id: 'l-innen',
    label: 'L-Form innen',
    description: 'Eine 90°-Ecke – Sie stehen im L (z. B. Balkon-Ecke).',
    icon: '<polyline points="6,10 6,38 42,38"/>',
  },
  {
    id: 'l-aussen',
    label: 'L-Form aussen',
    description:
      'Eine 90°-Ecke, Absturzseite innen (z. B. Kellerabgang, Podest).',
    icon: '<polyline points="6,10 6,38 42,38" transform="rotate(90 24 24)"/>',
  },
  {
    id: 'u-innen',
    label: 'U-Form innen',
    description: 'Zwei 90°-Ecken – Sie stehen im U (z. B. Balkon).',
    icon: '<polyline points="8,10 8,38 40,38 40,10"/>',
  },
  {
    id: 'u-aussen',
    label: 'U-Form aussen',
    description:
      'Zwei 90°-Ecken, Absturzseite innen (z. B. umlaufendes Podest).',
    icon: '<polyline points="8,38 8,10 40,10 40,38"/>',
  },
];

// Was kommt zwischen die Pfosten? Stäbe, Querstangen, Blech, Gitter, Glas
// oder kunstvoll geschmiedete Schnörkel – die grosse Auswahl der Füllungen.
export const FUELLUNGSARTEN: OptionDef<Fuellungsart>[] = [
  {
    id: 'staketen',
    label: 'Staketen (senkrecht)',
    description:
      'Senkrechte Füllstäbe – zeitlos, kindersicher und schwer erkletterbar.',
    icon: '<line x1="8" y1="10" x2="8" y2="38"/><line x1="16" y1="10" x2="16" y2="38"/><line x1="24" y1="10" x2="24" y2="38"/><line x1="32" y1="10" x2="32" y2="38"/><line x1="40" y1="10" x2="40" y2="38"/><line x1="4" y1="8" x2="44" y2="8"/>',
  },
  {
    id: 'querstab',
    label: 'Querstäbe (Reling)',
    description:
      'Waagrechte Stäbe – elegant und schlank. Hinweis: erkletterbar, Eignung wird geprüft.',
    icon: '<line x1="6" y1="12" x2="42" y2="12"/><line x1="6" y1="20" x2="42" y2="20"/><line x1="6" y1="28" x2="42" y2="28"/><line x1="6" y1="36" x2="42" y2="36"/><line x1="10" y1="8" x2="10" y2="40"/><line x1="38" y1="8" x2="38" y2="40"/>',
  },
  {
    id: 'blech',
    label: 'Blechfüllung',
    description:
      'Vollblech, Lochblech oder Laserschnitt – flächig, robust, gestaltbar.',
    icon: '<rect x="10" y="10" width="28" height="28"/><circle cx="18" cy="18" r="1.5"/><circle cx="26" cy="18" r="1.5"/><circle cx="34" cy="18" r="1.5"/><circle cx="18" cy="26" r="1.5"/><circle cx="26" cy="26" r="1.5"/><circle cx="34" cy="26" r="1.5"/><circle cx="18" cy="34" r="1.5"/><circle cx="26" cy="34" r="1.5"/>',
  },
  {
    id: 'gitter',
    label: 'Gitter / Streckmetall',
    description:
      'Transparente Flächenfüllung aus Streckmetall oder Drahtgitter.',
    icon: '<rect x="10" y="10" width="28" height="28"/><line x1="10" y1="20" x2="38" y2="10"/><line x1="10" y1="30" x2="38" y2="20"/><line x1="10" y1="38" x2="38" y2="30"/><line x1="20" y1="10" x2="10" y2="38"/><line x1="30" y1="10" x2="20" y2="38"/><line x1="38" y1="12" x2="30" y2="38"/>',
  },
  {
    id: 'glas',
    label: 'Glasfüllung',
    description:
      'Sicherheitsglas zwischen Metallpfosten – maximale Transparenz und Windschutz.',
    icon: '<rect x="10" y="10" width="28" height="28"/><line x1="14" y1="34" x2="34" y2="14"/>',
  },
  {
    id: 'geschmiedet',
    label: 'Charakter (geschmiedet)',
    description:
      'Manufaktur-Geländer mit Schmiedeornamenten – Grundauswahl hier, Feinausarbeitung persönlich.',
    icon: '<line x1="12" y1="10" x2="12" y2="38"/><line x1="36" y1="10" x2="36" y2="38"/><path d="M24 12 C18 16 18 22 24 24 C30 26 30 32 24 36"/><line x1="6" y1="8" x2="42" y2="8"/>',
  },
];

// Muster für das Laserblech: Schlitze, Kreise, Quadrate oder Blumen –
// wie Guetzli-Förmchen, aber aus Licht.
// 🤧 Schnupfspruch: De Laser schnidet Blüemli, de Schmied schlaat Funke –
//    und mir händ nach em Schnupf fröhlich gwunke.
export const LASER_MOTIVE: OptionDef<LaserMotiv>[] = [
  {
    id: 'schlitze',
    label: 'Linien / Schlitze',
    description: 'Vertikale Langlöcher, versetzt – ruhig und modern.',
    icon: '<rect x="12" y="10" width="4" height="12" rx="2"/><rect x="22" y="18" width="4" height="12" rx="2"/><rect x="32" y="10" width="4" height="12" rx="2"/><rect x="12" y="28" width="4" height="10" rx="2"/><rect x="32" y="28" width="4" height="10" rx="2"/>',
  },
  {
    id: 'kreise',
    label: 'Kreise',
    description: 'Unterschiedlich grosse Rundungen – verspielt und leicht.',
    icon: '<circle cx="16" cy="16" r="5"/><circle cx="32" cy="14" r="3"/><circle cx="24" cy="28" r="6"/><circle cx="36" cy="32" r="4"/><circle cx="12" cy="34" r="3"/>',
  },
  {
    id: 'quadrate',
    label: 'Quadrate',
    description: 'Versetztes Quadratraster – grafisch und klar.',
    icon: '<rect x="10" y="10" width="7" height="7"/><rect x="24" y="14" width="7" height="7"/><rect x="14" y="26" width="7" height="7"/><rect x="30" y="28" width="7" height="7"/>',
  },
  {
    id: 'floral',
    label: 'Floral',
    description: 'Blatt- und Rankenmotiv – die organische Handschrift.',
    icon: '<path d="M24 38 C24 26 18 22 12 20 C20 18 24 14 24 8 C24 14 28 18 36 20 C30 22 24 26 24 38"/>',
  },
];

// Die geschmiedeten Verzierungen: Ringe, Schnecken-Schnörkel oder Körbe
// (gedrehte Stäbe, die sich wie ein kleiner Käfig aufblähen).
export const ORNAMENT_TYPEN: OptionDef<OrnamentTyp>[] = [
  {
    id: 'ringe',
    label: 'Ringe',
    description: 'Geschmiedete Ringe zwischen den Staketen – klassisch schlicht.',
    icon: '<line x1="14" y1="8" x2="14" y2="40"/><line x1="34" y1="8" x2="34" y2="40"/><circle cx="24" cy="24" r="7"/>',
  },
  {
    id: 'voluten',
    label: 'Voluten (Schnörkel)',
    description: 'C- und S-Schnörkel – die barocke Handschrift der Schmiede.',
    icon: '<line x1="12" y1="8" x2="12" y2="40"/><line x1="36" y1="8" x2="36" y2="40"/><path d="M24 12 C17 15 17 21 24 23 C31 25 31 31 24 34"/>',
  },
  {
    id: 'koerbe',
    label: 'Körbe',
    description: 'Gedrehte Korb-Elemente in den Staketen – kunstvoll und markant.',
    icon: '<line x1="24" y1="6" x2="24" y2="14"/><path d="M24 14 C17 18 17 30 24 34 C31 30 31 18 24 14"/><line x1="24" y1="34" x2="24" y2="42"/>',
  },
];

// Wie gross, wo und wie oft kommen die Verzierungen ins Geländer?
export const ORNAMENT_GROESSEN: OptionDef<'klein' | 'mittel' | 'gross'>[] = [
  { id: 'klein', label: 'Dezent', description: 'Kleine Elemente – zurückhaltend.' },
  { id: 'mittel', label: 'Ausgewogen', description: 'Mittlere Grösse – der Klassiker.' },
  { id: 'gross', label: 'Markant', description: 'Grosse Elemente – kräftige Wirkung.' },
];

export const ORNAMENT_LAGEN: OptionDef<'oben' | 'mitte' | 'unten'>[] = [
  { id: 'oben', label: 'Oben (Fries)', description: 'Als Zierband unter dem Obergurt.' },
  { id: 'mitte', label: 'Mittig', description: 'Zentriert im Füllfeld.' },
  { id: 'unten', label: 'Unten (Sockel)', description: 'Als Band über dem Untergurt.' },
];

export const ORNAMENT_DICHTEN: OptionDef<'alle' | 'jedes-zweite'>[] = [
  { id: 'alle', label: 'Jedes Feld', description: 'Durchgehende Ornamentreihe.' },
  {
    id: 'jedes-zweite',
    label: 'Jedes zweite Feld',
    description: 'Rhythmischer Wechsel – luftiger und günstiger.',
  },
];

// Liegt der Handlauf OBEN auf den Pfosten (wie ein Deckel) oder
// DAZWISCHEN (wie eine Brücke von Pfosten zu Pfosten)?
export const HANDLAUF_POSITIONEN: OptionDef<HandlaufPosition>[] = [
  {
    id: 'aufgesetzt',
    label: 'Handlauf aufgesetzt',
    description: 'Handlauf liegt oben auf den Pfosten – klassisch, durchlaufend.',
    icon: '<line x1="6" y1="12" x2="42" y2="12"/><line x1="14" y1="12" x2="14" y2="40"/><line x1="34" y1="12" x2="34" y2="40"/>',
  },
  {
    id: 'zwischen',
    label: 'Gurt zwischen Pfosten',
    description: 'Obergurt bündig zwischen den Pfosten – Pfosten bleiben sichtbar.',
    icon: '<line x1="14" y1="8" x2="14" y2="40"/><line x1="34" y1="8" x2="34" y2="40"/><line x1="14" y1="14" x2="34" y2="14"/>',
  },
];

// Die drei Blech-Sorten: ganz zu, mit Löchern oder mit Laser-Muster.
export const BLECHTYPEN: OptionDef<BlechTyp>[] = [
  {
    id: 'voll',
    label: 'Vollblech',
    description: 'Geschlossene Fläche – maximaler Sicht- und Windschutz.',
  },
  {
    id: 'loch',
    label: 'Lochblech',
    description:
      'Rundlochung – halbtransparent. BFU-Richtwert: Öffnungen ≤ ca. 5 cm.',
  },
  {
    id: 'laser',
    label: 'Laserschnitt-Motiv',
    description:
      'Individuelle Ausschnitte – Kletterwirkung und Kanten werden fachlich geprüft.',
  },
];

// Die zwei Gitter-Sorten: Streckmetall (Rauten, wie ein Fischernetz aus
// Metall) oder geschweisstes Drahtgitter.
// 🤧 Schnupfspruch: Streckmetall und Drahtgitter, s Schweisse isch nöd bitter –
//    es zischt und es spritzt, und de Schnupf dä sitzt.
export const GITTERTYPEN: OptionDef<GitterTyp>[] = [
  {
    id: 'streckmetall',
    label: 'Streckmetall',
    description: 'Rautenstruktur – robust und industriell-elegant.',
  },
  {
    id: 'drahtgitter',
    label: 'Drahtgitter',
    description:
      'Geschweisstes Gitter – BFU-Richtwert: Maschenweite ≤ ca. 4 cm.',
  },
];

// Wie hört der Handlauf am Ende auf? Mit einem Kügeli, einer Kappe oder
// einem Bogen nach unten – damit niemand mit dem Ärmel hängen bleibt.
export const HANDLAUF_ABSCHLUESSE: OptionDef<HandlaufAbschluss>[] = [
  {
    id: 'kugel-drittel',
    label: '1/3-Kugel (Standard)',
    description: 'Gewölbte Endkappe – der klassische Schlosserei-Abschluss.',
    icon: '<line x1="8" y1="24" x2="38" y2="24"/><path d="M38 18 A7 7 0 0 1 38 30"/>',
  },
  {
    id: 'gerade',
    label: 'Gerade Kappe',
    description: 'Schlicht abgeschlossenes Handlaufende.',
    icon: '<line x1="8" y1="24" x2="40" y2="24"/><line x1="40" y1="18" x2="40" y2="30"/>',
  },
  {
    id: 'kugel',
    label: 'Endkugel',
    description: 'Klassische Kugel – die Handschrift der Kunstschlosserei.',
    icon: '<line x1="8" y1="24" x2="36" y2="24"/><circle cx="40" cy="24" r="4"/>',
  },
  {
    id: 'endbogen',
    label: 'Endbogen 90°',
    description: 'Nach unten gebogenes Ende – sicher, nichts bleibt hängen.',
    icon: '<path d="M8 22 H34 Q40 22 40 28 V38"/>',
  },
];

// Glas: ganz durchsichtig oder milchig wie ein Badezimmerfenster.
export const GLASTYPEN: OptionDef<GlasTyp>[] = [
  {
    id: 'klar',
    label: 'Klarglas',
    description: 'Volle Durchsicht – Sicherheitsglas (Aufbau wird fachlich bestimmt).',
  },
  {
    id: 'satiniert',
    label: 'Satiniert',
    description: 'Milchig-matt – Sichtschutz bei vollem Lichtdurchlass.',
  },
];

// Drinnen oder draussen? Draussen muss alles Regen und Schnee aushalten.
export const EINBAUORTE: OptionDef<Einbauort>[] = [
  {
    id: 'innen',
    label: 'Innenbereich',
    description: 'Treppenhaus, Galerie oder Wohnraum.',
  },
  {
    id: 'aussen',
    label: 'Aussenbereich',
    description: 'Balkon, Terrasse, Sitzplatz oder Aussentreppe.',
  },
];

// Wie wird das Geländer festgemacht? Auf den Boden gestellt, seitlich
// angeschraubt, von unten gehalten, einbetoniert oder an die Wand –
// wie man ein Bild auf den Tisch stellen oder an die Wand hängen kann.
// 🤧 Schnupfspruch: Obe, unde, siitlich, a de Wand –
//    es Gländer ohni Dübel isch e Schand. Schnupf!
export const MONTAGEARTEN: OptionDef<Montageart>[] = [
  {
    id: 'boden',
    label: 'Aufgesetzt (Fussplatte)',
    description:
      'Fussplatte steht auf Boden- oder Mauerkante – einfacher Kraftfluss, wirtschaftlich.',
    icon: '<line x1="8" y1="38" x2="40" y2="38"/><rect x="18" y="34" width="12" height="4"/><line x1="24" y1="34" x2="24" y2="10"/><line x1="14" y1="10" x2="34" y2="10"/>',
  },
  {
    id: 'seite',
    label: 'Seitlich (stirnseitig)',
    description:
      'Pfosten oder Schwert seitlich an Platte/Mauer – volle Nutzfläche, schlanke Optik.',
    icon: '<line x1="14" y1="42" x2="14" y2="20"/><rect x="14" y="26" width="6" height="12"/><line x1="24" y1="42" x2="24" y2="8"/><line x1="16" y1="8" x2="34" y2="8"/>',
  },
  {
    id: 'unten',
    label: 'Von unten (Kragarm)',
    description:
      'Konsolen an der Plattenunterseite – elegant, aber höhere Hebelarme (Fachprüfung).',
    icon: '<line x1="8" y1="24" x2="32" y2="24"/><line x1="30" y1="24" x2="30" y2="34"/><line x1="30" y1="34" x2="38" y2="34"/><line x1="38" y1="34" x2="38" y2="6"/><line x1="30" y1="6" x2="46" y2="6"/>',
  },
  {
    id: 'eingelassen',
    label: 'Eingelassen / einbetoniert',
    description:
      'Pfosten oder Einbauteile im Rohbau – statisch günstig, braucht Koordination mit dem Baumeister.',
    icon: '<line x1="8" y1="30" x2="40" y2="30"/><line x1="8" y1="38" x2="40" y2="38"/><line x1="24" y1="38" x2="24" y2="8"/><line x1="14" y1="8" x2="34" y2="8"/>',
  },
  {
    id: 'wand',
    label: 'An der Wand / Leibung',
    description:
      'Für französische Balkone und kurze Felder – Befestigung an Fassade oder Fensterleibung.',
    icon: '<line x1="10" y1="6" x2="10" y2="42"/><line x1="10" y1="14" x2="20" y2="14"/><line x1="10" y1="34" x2="20" y2="34"/><line x1="20" y1="8" x2="20" y2="40"/>',
  },
];

// Worauf wird geschraubt? Beton, Holz oder Stahl – jedes braucht andere
// Schrauben, so wie man Nägel nicht in Glas schlagen kann.
export const UNTERGRUENDE: OptionDef<Untergrund>[] = [
  { id: 'beton', label: 'Beton', description: 'Betondecke, Betonmauer oder Fundament.' },
  { id: 'holz', label: 'Holz', description: 'Holzbalken, Holzterrasse oder Holztreppe.' },
  { id: 'stahl', label: 'Stahl', description: 'Stahlträger oder bestehende Stahlkonstruktion.' },
  {
    id: 'unbekannt',
    label: 'Weiss ich nicht',
    description: 'Kein Problem – unser Meister prüft den Untergrund vor Ort.',
  },
];

// Wer baut es ein? Die Werkstatt oder der Kunde selbst?
export const MONTAGE_SERVICES: OptionDef<MontageService>[] = [
  {
    id: 'webforge',
    label: 'Montage durch unsere Werkstatt',
    description: 'Lieferung und fachgerechte Montage vor Ort, schweizweit.',
  },
  {
    id: 'selbst',
    label: 'Selbstmontage',
    description: 'Sie montieren selbst – mit Bohrplan und Montageanleitung.',
  },
];

// Kinder-Erklärung: Die Farbpalette – wie der Malkasten. Jede Farbe hat
// einen Namen und einen Farbcode (hex), damit der Bildschirm sie malen kann.
/**
 * Farbauswahl. Die Hex-Werte dienen nur der Bildschirmdarstellung
 * (TESTDATEN) – verbindliche Farbtöne nach RAL-Karte.
 * Das Standardfarben-Sortiment braucht die Gate-C-Freigabe.
 */
export interface FarbOption {
  id: string;
  label: string;
  hex: string | null;
}

export const FARBEN: FarbOption[] = [
  { id: 'verzinkt-natur', label: 'Feuerverzinkt natur (ohne Beschichtung)', hex: '#b9bec1' },
  { id: 'ral-9005', label: 'RAL 9005 Tiefschwarz', hex: '#0b0b0d' },
  { id: 'ral-7016', label: 'RAL 7016 Anthrazitgrau', hex: '#373f43' },
  { id: 'ral-9010', label: 'RAL 9010 Reinweiss', hex: '#f1efe6' },
  { id: 'ral-6005', label: 'RAL 6005 Moosgrün', hex: '#11412d' },
  { id: 'ral-3004', label: 'RAL 3004 Purpurrot', hex: '#701f29' },
  { id: 'individuell', label: 'Andere Farbe (individuelle Anfrage)', hex: null },
];

// Sucht zu einem Farbnamen den Farbcode. Findet sie keinen, nimmt sie ein
// neutrales Grau – wie wenn du im Malkasten nach Gold suchst und keines hast.
// 🤧 Schnupfspruch: Anthrazit, Schwarz oder Moosgrüen – Rost wott nieme gseh blüeh.
//    Drum pulverbeschichte und schnupfe, statt über de Rost z lupfe!
export function farbHex(farbId: string | null): string {
  const farbe = FARBEN.find((f) => f.id === farbId);
  return farbe?.hex ?? '#6b7178';
}
