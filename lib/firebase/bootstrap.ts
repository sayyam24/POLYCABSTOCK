import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/config'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { runFirestoreOrNull } from '@/lib/firebase/safe-firestore'
import { DEMO_CREDENTIALS } from '@/lib/auth'
import { isoNow } from '@/lib/firebase/utils'
import type { User, UserRole } from '@/lib/types'

const BOOTSTRAP_ORG_ID = 'org_admin'

/** Ensures the signed-in Firebase user has a Firestore profile (required by security rules). */
export async function ensureFirestoreProfile(
  firebaseUser: FirebaseUser,
  expectedRole?: UserRole,
): Promise<User | null> {
  const db = getFirebaseDb()
  if (!db) return null

  const userRef = doc(db, COLLECTIONS.users, firebaseUser.uid)
  const existing = await runFirestoreOrNull(() => getDoc(userRef))
  if (existing?.exists()) {
    return { id: existing.id, ...existing.data() } as User
  }

  const email = firebaseUser.email ?? ''
  const role =
    expectedRole ??
    (Object.entries(DEMO_CREDENTIALS).find(([, c]) => c.email === email)?.[0] as
      | UserRole
      | undefined)

  if (!role || role !== 'admin') return null

  const ts = isoNow()
  const profile: User = {
    id: firebaseUser.uid,
    email,
    name: firebaseUser.displayName ?? 'Admin User',
    role: 'admin',
    status: 'approved',
    parentId: null,
    orgId: BOOTSTRAP_ORG_ID,
    createdAt: ts,
    updatedAt: ts,
  }

  try {
    await setDoc(userRef, profile)
    return profile
  } catch {
    return null
  }
}

export function requireAuthenticatedUser(): FirebaseUser {
  const auth = getFirebaseAuth()
  const user = auth?.currentUser
  if (!user) {
    throw new Error('You must be signed in to perform this action')
  }
  return user
}
