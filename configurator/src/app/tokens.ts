import tokens from '../../../design-tokens/tokens.json';

/**
 * Überträgt die gemeinsamen Design-Tokens (design-tokens/tokens.json)
 * als CSS-Variablen auf :root. Website (theme.json) und Konfigurator
 * nutzen damit dieselbe Quelle.
 */
export function applyDesignTokens(): void {
  const root = document.documentElement;
  for (const [name, token] of Object.entries(tokens.color)) {
    root.style.setProperty(`--webforge-color-${name}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.font)) {
    root.style.setProperty(`--webforge-font-${name}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.space)) {
    root.style.setProperty(`--webforge-space-${name}`, token.value);
  }
  for (const [name, token] of Object.entries(tokens.radius)) {
    root.style.setProperty(`--webforge-radius-${name}`, token.value);
  }
}
