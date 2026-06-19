import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { 
  getFirestore, 
  type Firestore 
} from 'firebase/firestore'

import { 
  getStorage, 
  type FirebaseStorage 
} from 'firebase/storage'

import { 
  getAuth, 
  type Auth 
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}

let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage
let auth: Auth

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null

  if (!app) {
    app = !getApps().length
      ? initializeApp(firebaseConfig)
      : getApp()
  }

  return app
}

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null

  if (!db) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) return null

    db = getFirestore(firebaseApp)
  }

  return db
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isFirebaseConfigured()) return null

  if (!storage) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) return null

    storage = getStorage(firebaseApp)
  }

  return storage
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null

  if (!auth) {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) return null

    auth = getAuth(firebaseApp)
  }

  return auth
}

export { firebaseConfig }