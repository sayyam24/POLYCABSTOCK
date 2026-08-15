import type {
  AppNotification,
  AuditLog,
  BulkUploadBatch,
  Organization,
  Payment,
  Product,
  ProductAlias,
  RetailerPurchase,
  Shipment,
  ShipmentShortage,
  StockAdjustment,
  StockLedger,
  StockRecord,
  StockReturn,
  Subscription,
  TransactionHistory,
  User,
} from '@/lib/types'

export interface AppDataState {
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
  subscriptions: Subscription[]
  payments: Payment[]
  auditLogs: AuditLog[]
  isHydrated: boolean
}

const emptyState: AppDataState = {
  users: [],
  organizations: [],
  products: [],
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
  isHydrated: false,
}

let state: AppDataState = { ...emptyState }
const listeners = new Set<() => void>()

export function getDataStore(): AppDataState {
  return state
}

export function setDataStore(partial: Partial<AppDataState>): void {
  state = { ...state, ...partial }
  listeners.forEach((l) => l())
}

export function resetDataStore(): void {
  state = { ...emptyState }
  listeners.forEach((l) => l())
}

export function subscribeDataStore(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
