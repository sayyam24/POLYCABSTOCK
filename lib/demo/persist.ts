import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase/config'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { saveDatabase, type DatabaseState } from '@/lib/db/local-db'
import { setLocalCredential, ensureDemoCredentials } from '@/lib/db/local-credentials'
import { resolveAuthUidForNewUser } from '@/lib/firebase/auth-users'
import { DEMO_PASSWORD } from '@/lib/demo/constants'
import type { GeneratedDemoData } from '@/lib/demo/generator'
import { isPermissionDeniedError } from '@/lib/firebase/runtime'

const DEMO_SEEDED_KEY = 'electrotrack_demo_full_seeded'
const DEMO_META_KEY = 'electrotrack_demo_meta'

export function isDemoSeededLocally(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_SEEDED_KEY) === 'true'
}

export function markDemoSeeded(meta: GeneratedDemoData['meta']): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_SEEDED_KEY, 'true')
  localStorage.setItem(DEMO_META_KEY, JSON.stringify(meta))
}

export function clearDemoSeededFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DEMO_SEEDED_KEY)
  localStorage.removeItem(DEMO_META_KEY)
}

export function applyDemoToLocal(data: GeneratedDemoData): void {
  const { credentials, meta, ...state } = data
  saveDatabase(state)
  ensureDemoCredentials()
  for (const c of credentials) {
    setLocalCredential(c.email, DEMO_PASSWORD)
  }
  setLocalCredential('admin@electrotrack.com', 'admin123')
  markDemoSeeded(meta)
}

async function commitBatches(
  db: Firestore,
  writes: Array<{ col: string; id: string; data: Record<string, unknown> }>,
): Promise<void> {
  const CHUNK = 400
  for (let i = 0; i < writes.length; i += CHUNK) {
    const batch = writeBatch(db)
    const slice = writes.slice(i, i + CHUNK)
    for (const w of slice) {
      batch.set(doc(db, w.col, w.id), w.data)
    }
    await batch.commit()
  }
}

async function deleteDemoCollection(db: Firestore, col: string): Promise<void> {
  const snap = await getDocs(collection(db, col))
  if (snap.empty) return
  const CHUNK = 400
  const docs = snap.docs.filter((d) => d.id.startsWith('demo_'))
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db)
    docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

export async function persistDemoToFirestore(
  data: GeneratedDemoData,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore not configured')

  onProgress?.('Creating login accounts…')
  const uidMap = new Map<string, string>()

  uidMap.set(data.users.find((u) => u.role === 'admin')!.id, data.users.find((u) => u.role === 'admin')!.id)

  const nonAdmin = data.users.filter((u) => u.role !== 'admin')
  const BATCH = 8
  for (let i = 0; i < nonAdmin.length; i += BATCH) {
    const chunk = nonAdmin.slice(i, i + BATCH)
    await Promise.all(
      chunk.map(async (user) => {
        try {
          const uid = await resolveAuthUidForNewUser(user.email, DEMO_PASSWORD)
          uidMap.set(user.id, uid)
        } catch (err) {
          console.warn(`Auth skip ${user.email}:`, err)
          uidMap.set(user.id, user.id)
        }
      }),
    )
    onProgress?.(`Accounts ${Math.min(i + BATCH, nonAdmin.length)} / ${nonAdmin.length}`)
  }

  onProgress?.('Writing organizations & catalog…')
  const writes: Array<{ col: string; id: string; data: Record<string, unknown> }> = []

  for (const p of data.products) {
    writes.push({ col: COLLECTIONS.products, id: p.id, data: { ...p } })
  }

  for (const o of data.organizations.filter((x) => x.type !== 'admin')) {
    const ownerUserId = uidMap.get(
      data.users.find((u) => u.orgId === o.id)?.id ?? o.ownerUserId,
    ) ?? o.ownerUserId
    writes.push({
      col: COLLECTIONS.organizations,
      id: o.id,
      data: { ...o, ownerUserId, isDemo: true },
    })
  }

  for (const u of data.users.filter((x) => x.role !== 'admin')) {
    const id = uidMap.get(u.id) ?? u.id
    const parentId = u.parentId ? uidMap.get(u.parentId) ?? u.parentId : null
    writes.push({
      col: COLLECTIONS.users,
      id,
      data: {
        ...u,
        id,
        authUid: id,
        parentId,
        orgId: u.orgId,
        isDemo: true,
      },
    })
  }

  for (const s of data.stock) {
    writes.push({ col: COLLECTIONS.stock, id: s.id, data: { ...s, isDemo: true } })
  }

  for (const s of data.shipments) {
    writes.push({
      col: COLLECTIONS.shipments,
      id: s.id,
      data: {
        ...s,
        senderId: uidMap.get(s.senderId) ?? s.senderId,
        receiverId: uidMap.get(s.receiverId) ?? s.receiverId,
        isDemo: true,
      },
    })
  }

  for (const n of data.notifications) {
    writes.push({
      col: COLLECTIONS.notifications,
      id: n.id,
      data: {
        ...n,
        userId: uidMap.get(n.userId) ?? n.userId,
        isDemo: true,
      },
    })
  }

  for (const t of data.transactionHistory) {
    writes.push({ col: COLLECTIONS.transactionHistory, id: t.id, data: { ...t, isDemo: true } })
  }

  writes.push({
    col: 'system',
    id: 'demo_meta',
    data: { ...data.meta, password: DEMO_PASSWORD },
  })

  await commitBatches(db, writes)

  for (const c of data.credentials) {
    setLocalCredential(c.email, DEMO_PASSWORD)
  }
  setLocalCredential('admin@electrotrack.com', 'admin123')
}

export async function resetDemoFirestore(onProgress?: (msg: string) => void): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return

  const cols = [
    COLLECTIONS.users,
    COLLECTIONS.organizations,
    COLLECTIONS.products,
    COLLECTIONS.stock,
    COLLECTIONS.shipments,
    COLLECTIONS.notifications,
    COLLECTIONS.transactionHistory,
  ]

  for (const col of cols) {
    onProgress?.(`Clearing ${col}…`)
    try {
      await deleteDemoCollection(db, col)
    } catch (err) {
      if (!isPermissionDeniedError(err)) throw err
    }
  }

  try {
    const metaRef = doc(db, 'system', 'demo_meta')
    const batch = writeBatch(db)
    batch.delete(metaRef)
    await batch.commit()
  } catch {
    // ignore
  }
}

export async function generateAndApplyDemoData(options?: {
  firebase?: boolean
  onProgress?: (msg: string) => void,
}): Promise<GeneratedDemoData> {
  const { generateDemoDataset } = await import('@/lib/demo/generator')
  const data = generateDemoDataset()
  data.credentials.forEach((c) => {
    c.password = DEMO_PASSWORD
  })

  applyDemoToLocal(data)

  if (options?.firebase && isFirebaseConfigured()) {
    try {
      await resetDemoFirestore(options.onProgress)
      await persistDemoToFirestore(data, options.onProgress)
    } catch (err) {
      console.error('Firestore demo persist failed, local demo applied:', err)
      throw err
    }
  }

  return data
}

export async function resetAllDemoData(options?: {
  firebase?: boolean
  onProgress?: (msg: string) => void,
}): Promise<void> {
  clearDemoSeededFlag()

  const minimal: DatabaseState = {
    users: [
      {
        id: 'user_admin',
        email: 'admin@electrotrack.com',
        name: 'Admin User',
        role: 'admin',
        status: 'approved',
        parentId: null,
        orgId: 'org_admin',
        location: 'HQ',
        contact: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    organizations: [
      {
        id: 'org_admin',
        name: 'HQ Admin',
        type: 'admin',
        parentId: null,
        location: 'HQ',
        contact: '',
        ownerUserId: 'user_admin',
        createdAt: new Date().toISOString(),
      },
    ],
    products: [],
    stock: [],
    shipments: [],
    returns: [],
    notifications: [],
    transactionHistory: [],
  }
  saveDatabase(minimal)

  if (options?.firebase && isFirebaseConfigured()) {
    await resetDemoFirestore(options.onProgress)
  }
}

export function shouldAutoSeedDemo(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_AUTO_DEMO === 'false') return false
  return !isDemoSeededLocally()
}

export async function ensureDemoOnStartup(): Promise<boolean> {
  if (!shouldAutoSeedDemo()) return false
  const { getDataStore } = await import('@/lib/store/data-store')
  const store = getDataStore()
  if (store.organizations.length > 10) {
    markDemoSeeded({
      version: 'existing',
      generatedAt: new Date().toISOString(),
      counts: { depos: 3, distributors: 10, subDistributors: 20, retailers: 50 },
    })
    return false
  }
  await generateAndApplyDemoData({ firebase: false })
  return true
}
