// =============================================================================
//  FIREBASE CONFIGURATION  —  REPLACE THE PLACEHOLDER VALUES BELOW
// =============================================================================
//
//  1. Create a Firebase project at https://console.firebase.google.com
//  2. Add a Web App and enable the **Realtime Database**.
//  3. Copy your web app's config object into `firebaseConfig` below.
//  4. (Optional) Move these into VITE_ env vars — they are safe to expose to the
//     client (Realtime Database access is controlled by security rules, not by
//     hiding this config). The Anthropic key is the ONLY secret and it lives on
//     the server, never here.
//
//  Until real values are filled in, `isFirebaseConfigured` stays false and the
//  app runs in local/practice mode only (multiplayer create/join are disabled).
//
//  Suggested Realtime Database rules for a party game (open-ish, room-scoped):
//  {
//    "rules": {
//      "rooms": {
//        "$code": {
//          ".read": true,
//          ".write": true
//        }
//      }
//    }
//  }
// =============================================================================

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

export const firebaseConfig = {
  apiKey: 'AIzaSyAP-BobKZIPzd5yJdmDq3q9hLpD7_5Mod0',
  authDomain: 'yourbid-fa6fa.firebaseapp.com',
  databaseURL: 'https://yourbid-fa6fa-default-rtdb.firebaseio.com',
  projectId: 'yourbid-fa6fa',
  storageBucket: 'yourbid-fa6fa.firebasestorage.app',
  messagingSenderId: '104562530069',
  appId: '1:104562530069:web:d0d692da551f3217e0fb1c',
  measurementId: 'G-GMS567G2S5',
};

/** True once the placeholders above have been replaced with real values. */
export const isFirebaseConfigured =
  !firebaseConfig.apiKey.startsWith('REPLACE_ME') &&
  !firebaseConfig.databaseURL.includes('REPLACE_ME');

let app: FirebaseApp | null = null;
let db: Database | null = null;

/** Lazily initialize Firebase. Returns null if not configured. */
export function getDb(): Database | null {
  if (!isFirebaseConfigured) return null;
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}
