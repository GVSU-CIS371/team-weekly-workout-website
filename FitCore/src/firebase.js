// Replace all placeholder values with your Firebase project credentials.
// Do NOT commit real credentials to a public repo — use a .env file instead.

import { initializeApp } from 'firebase/app'
import { getAuth }       from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'REPLACE_WITH_YOUR_API_KEY',
  authDomain:        'REPLACE_WITH_YOUR_AUTH_DOMAIN',       // e.g. myapp.firebaseapp.com
  projectId:         'REPLACE_WITH_YOUR_PROJECT_ID',        // e.g. fitcore-abc12
  storageBucket:     'REPLACE_WITH_YOUR_STORAGE_BUCKET',    // e.g. fitcore-abc12.appspot.com
  messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',         // numeric string
  appId:             'REPLACE_WITH_YOUR_APP_ID'             // starts with "1:"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)

enableIndexedDbPersistence(db).catch(() => {})

export const COL = {
  users:     'users',
  stats:     'stats',
  meals:     'meals',
  workouts:  'workouts',
  community: 'community'
}
