import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

export const FUNCTIONS_REGION = 'europe-west1';
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);

// In-memory cache on purpose. The IndexedDB cache (persistentLocalCache) made a page that was reloaded or navigated
// away from mid-load wait indefinitely for the previous page's lease: about half of such reloads hung for 40 s or more
// in a browser test. An operations tool must open fast every time; buttons are disabled offline anyway.
export const db = initializeFirestore(app, { localCache: memoryLocalCache() });

if (useEmulators) {
  const host = (typeof location !== 'undefined' && location.hostname) || '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}
