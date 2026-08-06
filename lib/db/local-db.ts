import type {
  AppNotification,
  BulkUploadBatch,
  Organization,
  Product,
  ProductAlias,
  Shipment,
  ShipmentShortage,
  StockAdjustment,
  StockLedger,
  StockRecord,
  StockReturn,
  TransactionHistory,
  User,
  RetailerPurchase,
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
  retailerPurchases: RetailerPurchase[]
  stockLedger: StockLedger[]
  productAliases: ProductAlias[]
  bulkUploadBatches: BulkUploadBatch[]
  stockAdjustments: StockAdjustment[]
  shipmentShortages: ShipmentShortage[]
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
    { id: 'org_dist1', name: 'North Distributor', type: 'distributor', parentId: null, location: 'Delhi', contact: '+91 90000 00002', ownerUserId: 'user_dist1', createdAt: now() },
    { id: 'org_sub1', name: 'East Sub Distributor', type: 'sub_distributor', parentId: 'org_dist1', location: 'Kolkata', contact: '+91 90000 00003', ownerUserId: 'user_sub1', createdAt: now() },
    { id: 'org_retail1', name: 'TechMart Store', type: 'retailer', parentId: 'org_sub1', location: 'Pune', contact: '+91 90000 00004', ownerUserId: 'user_retail1', createdAt: now() },
  ]

  const users: User[] = [
    { id: 'user_dist1', email: 'distributor@electrotrack.com', name: 'North Distributor', role: 'distributor', status: 'approved', parentId: null, orgId: 'org_dist1', location: 'Delhi', contact: '', createdAt: now(), updatedAt: now() },
    { id: 'user_sub1', email: 'subdistributor@electrotrack.com', name: 'East Sub Distributor', role: 'sub_distributor', status: 'approved', parentId: 'user_dist1', orgId: 'org_sub1', location: 'Kolkata', contact: '+91 90000 00003', createdAt: now(), updatedAt: now() },
    { id: 'user_retail1', email: 'retailer@electrotrack.com', name: 'TechMart Store', role: 'retailer', status: 'approved', parentId: 'user_sub1', orgId: 'org_retail1', location: 'Pune', contact: '+91 90000 00004', createdAt: now(), updatedAt: now() },
  ]

  const stock: StockRecord[] = []
  const retailerPurchases: RetailerPurchase[] = []
  const stockLedger: StockLedger[] = []
  const productAliases: ProductAlias[] = []
  const bulkUploadBatches: BulkUploadBatch[] = []
  const stockAdjustments: StockAdjustment[] = []
  const shipmentShortages: ShipmentShortage[] = []

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
    retailerPurchases,
    stockLedger,
    productAliases,
    bulkUploadBatches,
    stockAdjustments,
    shipmentShortages,
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
    if (!parsed.retailerPurchases) parsed.retailerPurchases = []
    if (!parsed.stockLedger) parsed.stockLedger = []
    if (!parsed.productAliases) parsed.productAliases = []
    if (!parsed.bulkUploadBatches) parsed.bulkUploadBatches = []
    if (!parsed.stockAdjustments) parsed.stockAdjustments = []
    if (!parsed.shipmentShortages) parsed.shipmentShortages = []
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
