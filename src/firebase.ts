import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  setLogLevel,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress benign connection retry / offline transition warnings in console
try {
  setLogLevel('error');
} catch {}

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length
  ? initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    })
  : getApp();

// Initialize Firestore with robust auto-detect long polling for web sandboxes and iframes
function createFirestoreInstance(): Firestore {
  try {
    const dbSettings = {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    };

    if (firebaseConfig.firestoreDatabaseId) {
      return initializeFirestore(firebaseApp, dbSettings, firebaseConfig.firestoreDatabaseId);
    }
    return initializeFirestore(firebaseApp, dbSettings);
  } catch {
    // If already initialized, fallback to getFirestore
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(firebaseApp);
  }
}

export const db: Firestore = createFirestoreInstance();
