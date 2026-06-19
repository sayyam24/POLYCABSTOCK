import { firebaseConfig } from '@/lib/firebase/config'

function getApiKey(): string {
  const apiKey = firebaseConfig.apiKey
  if (!apiKey) throw new Error('Firebase API key is not configured')
  return apiKey
}

/**
 * Create a Firebase Auth user via REST API without changing the current client session.
 */
export async function createAuthUserViaRest(
  email: string,
  password: string,
): Promise<{ localId: string }> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${getApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        returnSecureToken: false,
      }),
    },
  )

  const data = (await res.json()) as {
    localId?: string
    error?: { message: string }
  }

  if (!res.ok) {
    const msg = data.error?.message ?? 'Failed to create auth account'
    if (msg.includes('EMAIL_EXISTS')) {
      throw new Error('EMAIL_EXISTS')
    }
    throw new Error(msg)
  }

  if (!data.localId) {
    throw new Error('Auth user created but no user id returned')
  }

  return { localId: data.localId }
}

/** Sign in via REST without affecting the current browser Firebase session */
export async function signInViaRest(
  email: string,
  password: string,
): Promise<{ localId: string }> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        returnSecureToken: false,
      }),
    },
  )

  const data = (await res.json()) as {
    localId?: string
    error?: { message: string }
  }

  if (!res.ok) {
    const msg = data.error?.message ?? 'Invalid email or password'
    throw new Error(msg)
  }

  if (!data.localId) {
    throw new Error('Sign-in succeeded but no user id returned')
  }

  return { localId: data.localId }
}

export async function resolveAuthUidForNewUser(
  email: string,
  password: string,
): Promise<string> {
  const normalized = email.trim().toLowerCase()
  try {
    const { localId } = await createAuthUserViaRest(normalized, password)
    return localId
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      const { localId } = await signInViaRest(normalized, password)
      return localId
    }
    throw err
  }
}
