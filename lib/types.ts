export type UserRole =
  | 'admin'
  | 'distributor'
  | 'sub_distributor'
  | 'retailer'
  | 'salesman'

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'

export type ShipmentStatus =
  | 'pending'
  | 'sent'
  | 'in_transit'
  | 'received'
  | 'partially_received'
  | 'rejected'
  | 'returned'

export interface AuthSession {
  userId: string
  orgId: string
  role: UserRole
  email: string
  name: string
  distributorId?: string // For salesman: assigned distributor ID
}

export interface User {
  id: string
  authUid?: string // Firebase Auth user ID (optional for Firebase backend)
  email: string
  name: string
  role: UserRole
  status: UserStatus
  parentId: string | null
  orgId: string
  distributorId?: string // For salesman: assigned distributor ID
  location?: string
  contact?: string
  createdAt: string
  updatedAt: string
  password?: string // Optional password field for MongoDB auth
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
  timeline?: ShipmentTimeline[]
}

export type ShipmentTimelineEvent = 
  | 'invoice_uploaded'
  | 'parsed_successfully'
  | 'shipment_created'
  | 'shipment_received'
  | 'shipment_returned'
  | 'shipment_cancelled'

export interface ShipmentTimeline {
  event: ShipmentTimelineEvent
  timestamp: string
  userId?: string
  userName?: string
  notes?: string
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

export interface RetailerPurchase {
  id: string
  invoiceNumber: string
  invoiceDate: string
  retailerOrgId: string
  retailerName: string
  senderOrgId: string
  senderRole: UserRole
  productId: string
  productName: string
  quantity: number
  unit: string
  createdAt: string
}

export type StockActionType = 
  | 'opening_stock'
  | 'sent'
  | 'received'
  | 'return'
  | 'manual_entry'
  | 'adjustment'
  | 'invoice_upload'
  | 'manual_return'

export interface StockLedger {
  id: string
  dateTime: string
  productId: string
  productName: string
  productCode: string
  userId: string
  userName: string
  userRole: UserRole
  orgId: string
  actionType: StockActionType
  referenceNumber: string // Invoice/Shipment ID
  quantityIn: number
  quantityOut: number
  closingBalance: number
  remarks?: string
}

export interface ProductAlias {
  id: string
  aliasName: string // Extracted Product Name from invoice
  productId: string
  productName: string // Actual Product Name from Product Master
  createdBy: string // User ID
  createdDate: string
  lastUsedDate: string
  usageCount: number
}

export type BulkInvoiceStatus = 
  | 'processing'
  | 'success'
  | 'failed'
  | 'duplicate'
  | 'pending_mapping'
  | 'ocr_failed'
  | 'corrupted'
  | 'invalid_format'

export type BulkInvoiceFailureReason = 
  | 'ocr_failed'
  | 'product_not_matched'
  | 'duplicate_invoice'
  | 'corrupted_pdf'
  | 'invalid_format'
  | 'network_error'
  | 'validation_error'

export interface BulkUploadInvoice {
  id: string
  batchId: string
  invoiceNumber: string
  fileName: string
  pdfData: string // base64 encoded
  status: BulkInvoiceStatus
  failureReason?: BulkInvoiceFailureReason
  failureDetails?: string
  parsedData?: {
    invoiceNumber: string
    invoiceDate: string
    retailerName: string
    items: Array<{
      productName: string
      productCode?: string
      quantity: number
      unit: string
      matchedProductId?: string
      matchedProductName?: string
    }>
  }
  retailerOrgId?: string
  retailerName?: string
  stockUpdated: boolean
  stockUpdatedDate?: string
  retryCount: number
  lastRetryDate?: string
  createdAt: string
  updatedAt: string
}

export interface BulkUploadBatch {
  id: string
  batchId: string // Unique batch identifier
  uploadedBy: string // User ID
  uploadedByName: string
  uploadDate: string
  totalInvoices: number
  successCount: number
  failedCount: number
  duplicateCount: number
  pendingMappingCount: number
  stockUpdatedCount: number
  status: 'processing' | 'completed' | 'partial_success' | 'failed'
  invoices: BulkUploadInvoice[]
  createdAt: string
  updatedAt: string
}

export type AdjustmentReason = 
  | 'physical_count_correction'
  | 'damaged_stock'
  | 'missing_stock'
  | 'expired_stock'
  | 'manual_correction'
  | 'other'

export interface StockAdjustment {
  id: string
  orgId: string
  orgType: UserRole
  productId: string
  productName: string
  productCode: string
  systemStock: number
  physicalStock: number
  difference: number
  adjustmentQuantity: number
  reason: AdjustmentReason
  remarks?: string
  adjustedBy: string // User ID
  adjustedByName: string
  adjustedDate: string
  createdAt: string
}

export type ShortageReason = 
  | 'damaged_during_transport'
  | 'missing_items'
  | 'wrong_quantity_sent'
  | 'other'

export interface PartialReceiveItem {
  productId: string
  productName: string
  dispatchedQuantity: number
  receivedQuantity: number
  shortageQuantity: number
}

export interface ShipmentShortage {
  id: string
  shipmentId: string
  shipmentNumber: string
  invoiceNumber: string
  senderOrgId: string
  senderName: string
  receiverOrgId: string
  receiverName: string
  productId: string
  productName: string
  dispatchedQuantity: number
  receivedQuantity: number
  shortageQuantity: number
  reason: ShortageReason
  remarks?: string
  status: 'pending' | 'resolved' | 'closed'
  resolvedBy?: string
  resolvedByName?: string
  resolvedDate?: string
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  orgId: string
  orgName: string
  plan: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'trial' | 'expired'
  startDate: string
  endDate: string
  maxUsers: number
  maxProducts: number
  features: string[]
  paymentStatus: 'paid' | 'pending' | 'overdue'
  lastPaymentDate?: string
  amount: number
  currency: string
}

export interface Payment {
  id: string
  subscriptionId: string
  orgId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentDate: string
  paymentMethod: string
  transactionId?: string
  invoiceUrl?: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: string
  entityType: 'user' | 'organization' | 'product' | 'stock' | 'shipment' | 'invoice' | 'subscription' | 'payment'
  entityId: string
  entityName: string
  changes: Record<string, { old: any; new: any }>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}
