import type { DatabaseState } from '@/lib/db/local-db'
import { createEmptyDatabaseState } from '@/lib/db/server-state'

type AppStateDoc = {
  _id: 'app_state'
  state: DatabaseState
  updatedAt: string
}

function nowIso() {
  return new Date().toISOString()
}

export async function getMongoState(): Promise<DatabaseState> {
  // Dynamic import to avoid client-side MongoDB import
  const { getMongoDb } = await import('@/lib/mongodb')
  const db = await getMongoDb()
  const col = db.collection<AppStateDoc>('app_state')

  const doc = await col.findOne({ _id: 'app_state' })
  if (doc?.state) return doc.state

  const seed = createEmptyDatabaseState()
  await col.updateOne(
    { _id: 'app_state' },
    { $set: { state: seed, updatedAt: nowIso() } },
    { upsert: true },
  )
  return seed
}

export async function saveMongoState(state: DatabaseState): Promise<void> {
  // Dynamic import to avoid client-side MongoDB import
  const { getMongoDb } = await import('@/lib/mongodb')
  const db = await getMongoDb()
  const col = db.collection<AppStateDoc>('app_state')
  await col.updateOne(
    { _id: 'app_state' },
    { $set: { state, updatedAt: nowIso() } },
    { upsert: true },
  )
}

