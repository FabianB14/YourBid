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
  apiKey: 'REPLACE_ME_apiKey',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  databaseURL: 'https://REPLACE_ME-default-rtdb.firebaseio.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
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
