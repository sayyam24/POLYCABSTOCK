import type { DatabaseState } from '@/lib/db/local-db'
import { createSeedDatabase } from '@/lib/db/local-db'
import { getCatalogProducts } from '@/lib/catalog/products'
import { setInstalledCatalogVersion } from '@/lib/catalog/apply'

export function createEmptyDatabaseState(): DatabaseState {
  setInstalledCatalogVersion()
  return {
    users: [],
    organizations: [],
    products: getCatalogProducts(),
    stock: [],
    shipments: [],
    returns: [],
    notifications: [],
    transactionHistory: [],
    retailerPurchases: [],
    stockLedger: [],
    productAliases: [],
    bulkUploadBatches: [],
    stockAdjustments: [],
    shipmentShortages: [],
    subscriptions: [],
    payments: [],
    auditLogs: [],
  }
}

export function isMongoBackend(): boolean {
  return process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo' && !!process.env.MONGODB_URI
}

export async function loadServerState(): Promise<DatabaseState> {
  if (!isMongoBackend()) {
    throw new Error('NEXT_PUBLIC_DATA_BACKEND must be set to "mongo" and MONGODB_URI must be configured')
  }
  
  const { getMongoState } = await import('@/lib/db/mongo-state')
  return await getMongoState()
}

export async function saveServerState(state: DatabaseState): Promise<void> {
  if (!isMongoBackend()) {
    throw new Error('NEXT_PUBLIC_DATA_BACKEND must be set to "mongo" and MONGODB_URI must be configured')
  }
  
  const { saveMongoState } = await import('@/lib/db/mongo-state')
  await saveMongoState(state)
}

