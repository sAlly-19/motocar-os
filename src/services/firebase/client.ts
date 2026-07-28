import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

declare const process: { env: Record<string, string | undefined> };

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

function readEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variavel de ambiente ${key} nao configurada.`);
  }
  return value;
}

function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;
  appInstance = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  return appInstance;
}

export function getFirebaseDb(): Firestore {
  if (dbInstance) return dbInstance;
  const app = getFirebaseApp();
  try {
    dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}
