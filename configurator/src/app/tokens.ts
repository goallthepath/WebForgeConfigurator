// ============================================================================
// tokens.ts – der Farbkasten
// ----------------------------------------------------------------------------
// Stell dir einen Malkasten vor, den die Website UND der Konfigurator teilen.
// Darin liegen alle Farben, Schriften, Abstände und Rundungen. Diese Datei nimmt
// jede Farbe aus dem Kasten und hängt sie als «CSS-Variable» an die Webseite,
// damit alles im gleichen Look erscheint – wie Uniformen für eine Fussballmannschaft.
// ============================================================================
import tokens from '../../../design-tokens/tokens.json';

// Die Funktion geht den Malkasten Fach für Fach durch und klebt jedem Wert
// ein Namensschild an, z. B. «--webforge-color-primary».
/**
 * Überträgt die gemeinsamen Design-Tokens (design-tokens/tokens.json)
 * als CSS-Variablen auf :root. Website (theme.json) und Konfigurator
 * nutzen damit dieselbe Quelle.
 */
export function applyDesignTokens(): void {
  // «root» ist das oberste Element der Seite – dort hängen wir alle Schilder auf.
  const root = document.documentElement;
  // Fach 1: Farben
  for (const [name, token] of Object.entries(tokens.color)) {
    root.style.setProperty(`--webforge-color-${name}`, token.value);
  }
  // Fach 2: Schriften
  for (const [name, token] of Object.entries(tokens.font)) {
    root.style.setProperty(`--webforge-font-${name}`, token.value);
  }
  // Fach 3: Abstände (wie viel Luft zwischen den Dingen ist)
  for (const [name, token] of Object.entries(tokens.space)) {
    root.style.setProperty(`--webforge-space-${name}`, token.value);
  }
  // Fach 4: Rundungen (wie rund die Ecken sind)
  for (const [name, token] of Object.entries(tokens.radius)) {
    root.style.setProperty(`--webforge-radius-${name}`, token.value);
  }
}
// 🤧 Schnupfspruch: Farb und Schrift und Rand im Takt –
//    e Prise Schnupf, und's isch perfäkt.
