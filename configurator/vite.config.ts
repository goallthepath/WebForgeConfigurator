import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Der Konfigurator wird unter https://<domain>/konfigurator/ ausgeliefert
// (ADR-001). Der Basis-Pfad ist deshalb fest Bestandteil des Builds.
export default defineConfig({
  base: '/konfigurator/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
