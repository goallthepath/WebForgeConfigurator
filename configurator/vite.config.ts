import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Eigenständig wird der Konfigurator unter https://<domain>/konfigurator/
// ausgeliefert (ADR-001). Für das WordPress-Plugin (`npm run build:wp`)
// entsteht ein Build mit relativen Pfaden direkt im Plugin-Verzeichnis.
export default defineConfig(({ mode }) => {
  const embed = mode === 'embed';
  return {
    base: embed ? './' : '/konfigurator/',
    build: embed
      ? {
          outDir: '../wordpress/wp-content/plugins/webforge-core/configurator',
          emptyOutDir: true,
        }
      : undefined,
    plugins: [react()],
    test: {
      environment: 'node',
      include: ['src/tests/**/*.test.ts'],
    },
  };
});
