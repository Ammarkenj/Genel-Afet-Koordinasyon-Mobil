import { defineConfig } from 'vitest/config';

// End-to-end tests run against the Auth + Firestore + Functions emulators: `npm run test:e2e`.
export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo-yasamhatti.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-yasamhatti',
      VITE_FIREBASE_APP_ID: 'demo-app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '0',
    },
  },
});
