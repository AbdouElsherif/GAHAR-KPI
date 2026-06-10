import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

const globalForFirebase = globalThis as typeof globalThis & {
  firestoreDb?: Firestore;
};

// Keep one instance during development reloads and avoid IndexedDB lease
// contention when the application is open in multiple tabs.
export const db = globalForFirebase.firestoreDb ?? initializeFirestore(app, {
  localCache: memoryLocalCache()
});

if (process.env.NODE_ENV !== 'production') {
  globalForFirebase.firestoreDb = db;
}

export default app;
