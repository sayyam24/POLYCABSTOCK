import type { DatabaseState } from '@/lib/db/local-db'
import { createSeedDatabase } from '@/lib/db/local-db'
import { getMongoDb } from '@/lib/mongodb'

type AppStateDoc = {
  _id: 'app_state'
  state: DatabaseState
  updatedAt: string
}

function nowIso() {
  return new Date().toISOString()
}

export async function getMongoState(): Promise<DatabaseState> {
  const db = await getMongoDb()
  const col = db.collection<AppStateDoc>('app_state')

  const doc = await col.findOne({ _id: 'app_state' })
  if (doc?.state) return doc.state

  const seed = createSeedDatabase()
  await col.updateOne(
    { _id: 'app_state' },
    { $set: { state: seed, updatedAt: nowIso() } },
    { upsert: true },
  )
  return seed
}

export async function saveMongoState(state: DatabaseState): Promise<void> {
  const db = await getMongoDb()
  const col = db.collection<AppStateDoc>('app_state')
  await col.updateOne(
    { _id: 'app_state' },
    { $set: { state, updatedAt: nowIso() } },
    { upsert: true },
  )
}

