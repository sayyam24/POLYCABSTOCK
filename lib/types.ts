export type UserRole =
  | 'admin'
  | 'depo'
  | 'distributor'
  | 'sub_distributor'
  | 'retailer'

export type UserStatus = 'pending' | 'approved' | 'rejected'

export type ShipmentStatus =
  | 'pending'
  | 'sent'
  | 'in_transit'
  | 'received'
  | 'rejected'
  | 'returned'

export interface AuthSession {
  userId: string
  orgId: string
  role: UserRole
  email: string
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  parentId: string | null
  orgId: string
  location?: string
  contact?: string
  createdAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  type: UserRole
  parentId: string | null
  location: string
  contact: string
  ownerUserId: string
  createdAt: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  /** RDP (GST paid) — used for billing / reference */
  unitPrice: number
  mrp: number
  caseLot: number
}

export interface StockRecord {
  id: string
  orgId: string
  orgType: UserRole
  productId: string
  productName: string
  quantity: number
  updatedAt: string
}

export interface ShipmentItem {
  productId: string
  productName: string
  quantity: number
  notes?: string
}

export interface Shipment {
  id: string
  shipmentNumber: string
  invoiceNumber: string
  invoiceFileName?: string
  /** @deprecated Prefer invoiceStorageUrl — kept for local fallback previews */
  invoiceDataUrl?: string
  invoiceStorageUrl?: string
  invoiceStoragePath?: string
  senderId: string
  senderOrgId: string
  senderName: string
  senderRole: UserRole
  receiverId: string
  receiverOrgId: string
  receiverName: string
  receiverRole: UserRole
  items: ShipmentItem[]
  notes?: string
  status: ShipmentStatus
  createdAt: string
  updatedAt: string
  receivedAt?: string
}

export interface AppNotification {
  id: string
  userId: string
  orgId: string
  title: string
  message: string
  shipmentId?: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'shipment'
  createdAt: string
}

export interface TransactionHistory {
  id: string
  shipmentId: string
  invoiceNumber: string
  senderOrgId: string
  senderName: string
  senderRole: UserRole
  receiverOrgId: string
  receiverName: string
  receiverRole: UserRole
  items: ShipmentItem[]
  status: ShipmentStatus
  createdAt: string
}

export interface CreateShipmentInput {
  receiverOrgId: string
  invoiceNumber: string
  invoiceFileName?: string
  invoiceDataUrl?: string
  items: ShipmentItem[]
  notes?: string
}

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: UserRole
  location?: string
  contact?: string
}

export interface CreateUserResult {
  user: User
  /** Shown once to the creator so they can share login details */
  loginEmail: string
}

export interface OpeningStockRow {
  productName: string
  quantity: number
}

export interface StockReturn {
  id: string
  shipmentId: string
  invoiceNumber: string
  fromOrgId: string
  fromOrgName: string
  toOrgId: string
  toOrgName: string
  items: ShipmentItem[]
  reason?: string
  createdByUserId: string
  createdAt: string
}

export interface CreateReturnInput {
  shipmentId: string
  items: ShipmentItem[]
  reason?: string
}
