import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import type { AuthSession, UserRole } from '@/lib/types'
import { roleToPath } from '@/lib/permissions'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { loadDatabase } from '@/lib/db/local-db'
import {
  ensureDemoCredentials,
  verifyLocalCredential,
} from '@/lib/db/local-credentials'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase/config'
import { createAuthUserViaRest } from '@/lib/firebase/auth-users'
import { ensureFirestoreProfile } from '@/lib/firebase/bootstrap'
import { seedFirestoreIfEmpty } from '@/lib/firebase/seed'
import {
  disableCloudFirestore,
  isPermissionDeniedError,
  resetCloudFirestoreState,
} from '@/lib/firebase/runtime'

const SESSION_KEY = 'electrotrack_session_v2'

export const DEMO_CREDENTIALS: Record<
  UserRole,
  { email: string; password: string }
> = {
  admin: { email: 'admin@electrotrack.com', password: 'admin123' },
  depo: { email: 'depo@electrotrack.com', password: 'depo123' },
  distributor: { email: 'distributor@electrotrack.com', password: 'dist123' },
  sub_distributor: { email: 'subdistributor@electrotrack.com', password: 'sub123' },
  retailer: { email: 'retailer@electrotrack.com', password: 'retail123' },
}

const DEMO_EMAILS = new Set(
  Object.values(DEMO_CREDENTIALS).map((c) => c.email.toLowerCase()),
)

export function isDemoEmail(email: string): boolean {
  return DEMO_EMAILS.has(email.trim().toLowerCase())
}

export function isDemoLogin(email: string, password: string): boolean {
  const normalized = email.trim().toLowerCase()
  return Object.values(DEMO_CREDENTIALS).some(
    (c) =>
      c.email.toLowerCase() === normalized && c.password === password,
  )
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function userToSession(user: {
  id: string
  orgId: string
  role: UserRole
  email: string
  name: string
}): AuthSession {
  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
  }
}

function findLocalUserByEmail(
  email: string,
  expectedRole?: UserRole,
): AuthSession | null {
  const user = loadDatabase().users.find(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.status === 'approved' &&
      (!expectedRole || u.role === expectedRole),
  )
  return user ? userToSession(user) : null
}

async function resolveSessionFromFirebaseUser(
  firebaseUser: FirebaseUser,
  expectedRole?: UserRole,
): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
  const email = (firebaseUser.email ?? '').trim().toLowerCase()

  try {
    if (isFirebaseConfigured()) {
      let profile =
        (await electroTrackService.getUserByAuthUid(firebaseUser.uid)) ??
        (await electroTrackService.getUserByEmail(email))

      if (!profile && expectedRole === 'admin') {
        profile = await ensureFirestoreProfile(firebaseUser, 'admin')
      }

      if (profile) {
        if (profile.status !== 'approved') {
          return { success: false, error: 'Account is not approved yet' }
        }

        if (expectedRole && profile.role !== expectedRole) {
          return {
            success: false,
            error: `This email is a ${profile.role.replace('_', ' ')} account. Select "${profile.role.replace('_', ' ')}" on the login screen, or leave role auto-detected.`,
          }
        }

        if (profile.role === 'admin') {
          try {
            await seedFirestoreIfEmpty()
          } catch {
            // catalog may exist
          }
        }

        const session = userToSession(profile)
        setSession(session)
        return { success: true, session }
      }
    }

    const localSession = findLocalUserByEmail(email, expectedRole)
    if (localSession) {
      setSession(localSession)
      return { success: true, session: localSession }
    }

    return {
      success: false,
      error:
        'Login succeeded but no user profile was found. Ask your admin to create your account again under User Management.',
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      disableCloudFirestore()
      const localSession = findLocalUserByEmail(email, expectedRole)
      if (localSession) {
        setSession(localSession)
        return { success: true, session: localSession }
      }
      return {
        success: false,
        error:
          'Firestore access denied. Publish firestore.rules from this project, then try again.',
      }
    }
    throw err
  }
}

function loginWithLocalDemo(
  normalizedEmail: string,
  password: string,
  expectedRole?: UserRole,
): { success: boolean; error?: string; session?: AuthSession } {
  ensureDemoCredentials()
  disableCloudFirestore('Demo login — using local data')

  if (!verifyLocalCredential(normalizedEmail, password)) {
    return { success: false, error: 'Invalid email or password' }
  }

  const user = electroTrackService.getUsers().find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      u.status === 'approved' &&
      (!expectedRole || u.role === expectedRole),
  )
  if (!user) {
    return {
      success: false,
      error: expectedRole
        ? `No approved ${expectedRole} account for this email.`
        : 'No account for this email. Ask your admin to create one.',
    }
  }

  const session = userToSession(user)
  setSession(session)
  return { success: true, session }
}

export async function login(
  email: string,
  password: string,
  expectedRole?: UserRole,
): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (isDemoLogin(normalizedEmail, password)) {
    return loginWithLocalDemo(normalizedEmail, password, expectedRole)
  }

  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuth()
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not available' }
    }

    resetCloudFirestoreState()

    try {
      if (auth.currentUser) {
        await signOut(auth)
      }

      let credential
      try {
        credential = await signInWithEmailAndPassword(
          auth,
          normalizedEmail,
          password,
        )
      } catch (signInErr) {
        const signInMsg =
          signInErr instanceof Error ? signInErr.message : ''
        const isDemoAdmin =
          normalizedEmail === DEMO_CREDENTIALS.admin.email.toLowerCase()
        if (
          isDemoAdmin &&
          (signInMsg.includes('user-not-found') ||
            signInMsg.includes('invalid-credential'))
        ) {
          await createAuthUserViaRest(normalizedEmail, password)
          credential = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password,
          )
        } else {
          throw signInErr
        }
      }

      return resolveSessionFromFirebaseUser(credential.user, expectedRole)
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        disableCloudFirestore()
        const localSession = findLocalUserByEmail(normalizedEmail, expectedRole)
        if (localSession && verifyLocalCredential(normalizedEmail, password)) {
          setSession(localSession)
          return { success: true, session: localSession }
        }
      }

      const message =
        err instanceof Error ? err.message : 'Invalid email or password'
      if (
        message.includes('invalid-credential') ||
        message.includes('wrong-password')
      ) {
        return {
          success: false,
          error:
            'Invalid email or password. Use the exact email and password your admin gave you.',
        }
      }
      if (message.includes('user-not-found')) {
        return {
          success: false,
          error:
            'No account for this email. Admin must create your account first (Admin → User Management).',
        }
      }
      return { success: false, error: message }
    }
  }

  return loginWithLocalDemo(normalizedEmail, password, expectedRole)
}

export async function logout(): Promise<void> {
  clearSession()
  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuth()
    if (auth) await signOut(auth)
  }
}

export function subscribeAuthState(
  callback: (session: AuthSession | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    callback(getSession())
    return () => {}
  }

  const auth = getFirebaseAuth()
  if (!auth) {
    callback(getSession())
    return () => {}
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    void (async () => {
      try {
        if (!firebaseUser) {
          const cached = getSession()
          if (cached && isDemoEmail(cached.email)) {
            callback(cached)
            return
          }
          clearSession()
          callback(null)
          return
        }

        const cached = getSession()
        if (
          cached &&
          (cached.userId === firebaseUser.uid ||
            cached.email.toLowerCase() ===
              (firebaseUser.email ?? '').toLowerCase())
        ) {
          callback(cached)
          return
        }

        const result = await resolveSessionFromFirebaseUser(firebaseUser)
        callback(result.success ? result.session! : null)
      } catch (err) {
        if (isPermissionDeniedError(err)) {
          disableCloudFirestore()
          const local = findLocalUserByEmail(firebaseUser?.email ?? '')
          if (local) {
            setSession(local)
            callback(local)
            return
          }
        }
        console.error('Auth state error:', err)
        clearSession()
        callback(null)
      }
    })()
  })
}

export function getDashboardPath(role: UserRole): string {
  return roleToPath(role)
}
