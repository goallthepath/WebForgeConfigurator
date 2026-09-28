// ============================================================================
// vite.config.ts – die Einstellungen der Werkzeugmaschine
// ----------------------------------------------------------------------------
// Vite ist die Maschine, die aus unserem Code eine fertige Webseite baut –
// wie eine Presse, die aus vielen Einzelteilen ein fertiges Werkstück macht.
// Hier steht, wohin das Ergebnis kommt und wie die Tests laufen.
// ============================================================================
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Eigenständig wird der Konfigurator unter https://<domain>/konfigurator/
// ausgeliefert (ADR-001). Für das WordPress-Plugin (`npm run build:wp`)
// entsteht ein Build mit relativen Pfaden direkt im Plugin-Verzeichnis.
export default defineConfig(({ mode }) => {
  // Bauen wir die Version für WordPress (eingebettet)?
  const embed = mode === 'embed';
  return {
    // Die Grundadresse: relativ (./) für WordPress, sonst /konfigurator/.
    base: embed ? './' : '/konfigurator/',
    // Für WordPress landet das Ergebnis direkt im Plugin-Ordner.
    build: embed
      ? {
          outDir: '../wordpress/wp-content/plugins/webforge-core/configurator',
          emptyOutDir: true,
        }
      : undefined,
    // Das React-Werkzeug, damit Vite JSX (HTML im Code) versteht.
    plugins: [react()],
    // Einstellungen für die Tests: ohne Browser (node) und nur Dateien in src/tests.
    // 🤧 Schnupfspruch: Semikolon, Chlammere, Punkt –
    //    e Prise Schnupf, und scho funkt's.
    test: {
      environment: 'node',
      include: ['src/tests/**/*.test.ts'],
    },
  };
});
// 🤧 Schnupfspruch: Vite isch schnäll, dr Build isch gschwind,
//    schnäller isch nur d'Prise im Wind.
