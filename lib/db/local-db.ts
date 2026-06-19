import type {
  AppNotification,
  Organization,
  Product,
  Shipment,
  StockRecord,
  StockReturn,
  TransactionHistory,
  User,
} from '@/lib/types'
import { getCatalogProducts } from '@/lib/catalog/products'
import {
  migrateLocalDatabaseIfNeeded,
  setInstalledCatalogVersion,
} from '@/lib/catalog/apply'

export interface DatabaseState {
  users: User[]
  organizations: Organization[]
  products: Product[]
  stock: StockRecord[]
  shipments: Shipment[]
  returns: StockReturn[]
  notifications: AppNotification[]
  transactionHistory: TransactionHistory[]
}

export const DB_KEY = 'electrotrack_db_v2'

function now() {
  return new Date().toISOString()
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function createSeedDatabase(): DatabaseState {
  const products = getCatalogProducts()

  const orgs: Organization[] = [
    { id: 'org_admin', name: 'Factory HQ', type: 'admin', parentId: null, location: 'Factory', contact: '', ownerUserId: 'user_admin', createdAt: now() },
    { id: 'org_depo1', name: 'Central Depo', type: 'depo', parentId: 'org_admin', location: 'Mumbai', contact: '+91 90000 00001', ownerUserId: 'user_depo1', createdAt: now() },
    { id: 'org_sub1', name: 'East Sub Distributor', type: 'sub_distributor', parentId: 'org_depo1', location: 'Kolkata', contact: '+91 90000 00003', ownerUserId: 'user_sub1', createdAt: now() },
    { id: 'org_dist1', name: 'North Distributor', type: 'distributor', parentId: 'org_sub1', location: 'Delhi', contact: '+91 90000 00002', ownerUserId: 'user_dist1', createdAt: now() },
    { id: 'org_retail1', name: 'TechMart Store', type: 'retailer', parentId: 'org_dist1', location: 'Pune', contact: '+91 90000 00004', ownerUserId: 'user_retail1', createdAt: now() },
  ]

  const users: User[] = [
    { id: 'user_admin', email: 'admin@electrotrack.com', name: 'Factory Admin', role: 'admin', status: 'approved', parentId: null, orgId: 'org_admin', location: 'Factory', contact: '', createdAt: now(), updatedAt: now() },
    { id: 'user_depo1', email: 'depo@electrotrack.com', name: 'Central Depo', role: 'depo', status: 'approved', parentId: 'user_admin', orgId: 'org_depo1', location: 'Mumbai', contact: '+91 90000 00001', createdAt: now(), updatedAt: now() },
    { id: 'user_sub1', email: 'subdistributor@electrotrack.com', name: 'East Sub Distributor', role: 'sub_distributor', status: 'approved', parentId: 'user_depo1', orgId: 'org_sub1', location: 'Kolkata', contact: '+91 90000 00003', createdAt: now(), updatedAt: now() },
    { id: 'user_dist1', email: 'distributor@electrotrack.com', name: 'North Distributor', role: 'distributor', status: 'approved', parentId: 'user_sub1', orgId: 'org_dist1', location: 'Delhi', contact: '+91 90000 00002', createdAt: now(), updatedAt: now() },
    { id: 'user_retail1', email: 'retailer@electrotrack.com', name: 'TechMart Store', role: 'retailer', status: 'approved', parentId: 'user_dist1', orgId: 'org_retail1', location: 'Pune', contact: '+91 90000 00004', createdAt: now(), updatedAt: now() },
  ]

  const stock: StockRecord[] = []

  setInstalledCatalogVersion()

  return {
    users,
    organizations: orgs,
    products,
    stock,
    shipments: [],
    returns: [],
    notifications: [],
    transactionHistory: [],
  }
}

export function loadDatabase(): DatabaseState {
  if (typeof window === 'undefined') return createSeedDatabase()
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const seed = createSeedDatabase()
      localStorage.setItem(DB_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed = JSON.parse(raw) as DatabaseState
    if (!parsed.returns) parsed.returns = []
    const migrated = migrateLocalDatabaseIfNeeded(parsed)
    if (migrated !== parsed) {
      localStorage.setItem(DB_KEY, JSON.stringify(migrated))
    }
    return migrated
  } catch {
    return createSeedDatabase()
  }
}

export function saveDatabase(state: DatabaseState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DB_KEY, JSON.stringify(state))

  // If Mongo backend is enabled, also persist to server (fire-and-forget).
  // This keeps the existing client-side business logic working while MongoDB
  // becomes the durable storage.
  if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
    try {
      void fetch('/api/state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(state),
      })
    } catch {
      // ignore (offline/dev)
    }
  }
}

export { id, now }
