import type {
  Einbauort,
  GelaenderVariante,
  Montageart,
  MontageService,
  Untergrund,
} from './types';

/** Optionslisten des Geländer-Assistenten (Texte, keine Fachlogik). */

export interface OptionDef<T extends string> {
  id: T;
  label: string;
  description: string;
  /** Inline-SVG-Piktogramm (viewBox 0 0 48 48), optional. */
  icon?: string;
}

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
];

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

export const MONTAGEARTEN: OptionDef<Montageart>[] = [
  {
    id: 'boden',
    label: 'Auf dem Boden',
    description: 'Pfosten werden von oben auf Beton, Holz oder Stahl montiert.',
    icon: '<line x1="8" y1="38" x2="40" y2="38"/><line x1="24" y1="38" x2="24" y2="10"/><line x1="14" y1="10" x2="34" y2="10"/>',
  },
  {
    id: 'seite',
    label: 'Seitlich (stirnseitig)',
    description:
      'Pfosten werden seitlich an der Betonkante oder Balkonplatte befestigt.',
    icon: '<line x1="14" y1="42" x2="14" y2="20"/><line x1="14" y1="20" x2="24" y2="20"/><line x1="24" y1="42" x2="24" y2="8"/><line x1="16" y1="8" x2="34" y2="8"/>',
  },
];

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

export const MONTAGE_SERVICES: OptionDef<MontageService>[] = [
  {
    id: 'webforge',
    label: 'Montage durch WebForge',
    description: 'Lieferung und fachgerechte Montage vor Ort, schweizweit.',
  },
  {
    id: 'selbst',
    label: 'Selbstmontage',
    description: 'Sie montieren selbst – mit Bohrplan und Montageanleitung.',
  },
];

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
  { id: 'ral-9005', label: 'RAL 9005 Tiefschwarz', hex: '#0b0b0d' },
  { id: 'ral-7016', label: 'RAL 7016 Anthrazitgrau', hex: '#373f43' },
  { id: 'ral-9010', label: 'RAL 9010 Reinweiss', hex: '#f1efe6' },
  { id: 'ral-6005', label: 'RAL 6005 Moosgrün', hex: '#11412d' },
  { id: 'ral-3004', label: 'RAL 3004 Purpurrot', hex: '#701f29' },
  { id: 'individuell', label: 'Andere Farbe (individuelle Anfrage)', hex: null },
];

export function farbHex(farbId: string | null): string {
  const farbe = FARBEN.find((f) => f.id === farbId);
  return farbe?.hex ?? '#6b7178';
}
