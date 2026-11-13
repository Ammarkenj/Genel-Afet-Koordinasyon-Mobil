import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // No source maps in dist: Hosting would publish them. The main chunk is Firebase + React + i18n (about 1 MB, 300 KB gzipped).
  build: { sourcemap: false, chunkSizeWarningLimit: 1100 },
  test: { include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'functions/src/**/*.test.ts'], environment: 'node' },
});
