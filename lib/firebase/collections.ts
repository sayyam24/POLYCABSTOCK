/** Firestore collection names — single source of truth */
export const COLLECTIONS = {
  users: 'users',
  depos: 'depos',
  distributors: 'distributors',
  subDistributors: 'sub_distributors',
  retailers: 'retailers',
  products: 'products',
  stock: 'stock',
  shipments: 'shipments',
  shipmentItems: 'shipment_items',
  invoices: 'invoices',
  notifications: 'notifications',
  transactionHistory: 'transaction_history',
  organizations: 'organizations',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

/**
 * Database schema reference (Firestore)
 *
 * users: User profile + role + approval status
 * organizations: Branch entity (depo, distributor, sub_distributor, retailer)
 * products: Global product catalog
 * stock: Composite key orgId + productId → quantity
 * shipments: Header with sender/receiver/invoice/status; items embedded as array
 * notifications: Per-user alerts linked to shipments
 * transaction_history: Immutable audit log after receive/reject
 */
