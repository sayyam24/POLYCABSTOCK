import type {
  AppNotification,
  AuthSession,
  BulkUploadBatch,
  CreateReturnInput,
  CreateShipmentInput,
  CreateUserInput,
  CreateUserResult,
  OpeningStockRow,
  Organization,
  Product,
  ProductAlias,
  Shipment,
  ShipmentItem,
  ShipmentTimeline,
  ShipmentShortage,
  ShortageReason,
  StockAdjustment,
  StockLedger,
  StockRecord,
  StockReturn,
  TransactionHistory,
  User,
  UserRole,
  StockActionType,
} from '@/lib/types'
import { canCreateRole, canShip } from '@/lib/permissions'
import { createSeedDatabase, id, loadDatabase, now, saveDatabase } from '@/lib/db/local-db'
import {
  applyProductCatalogToState,
  setInstalledCatalogVersion,
} from '@/lib/catalog/apply'
import { setLocalCredential } from '@/lib/db/local-credentials'
import { validateNewPassword } from '@/lib/firebase/validate-password'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { isCloudFirestoreActive } from '@/lib/firebase/runtime'
import { electroTrackFirebaseService } from '@/lib/services/electrotrack.firebase'
import { getDataStore, setDataStore } from '@/lib/store/data-store'
/** Reads from Firestore-backed cache when cloud sync is active */
function shouldUseFirebaseData(): boolean {
  return isFirebaseConfigured() && isCloudFirestoreActive()
}

function shouldUseFirebaseBackend(): boolean {
  return isFirebaseConfigured()
}

/** Local-only implementation (fallback when Firebase env is missing) */
class ElectroTrackLocalService {
  private getState() {
    // If data store is hydrated (MongoDB data loaded), use that
    const dataStore = getDataStore()
    if (dataStore.isHydrated) {
      return {
        users: dataStore.users,
        organizations: dataStore.organizations,
        products: dataStore.products,
        stock: dataStore.stock,
        shipments: dataStore.shipments,
        returns: dataStore.returns,
        notifications: dataStore.notifications,
        transactionHistory: dataStore.transactionHistory,
        retailerPurchases: dataStore.retailerPurchases || [],
        stockLedger: dataStore.stockLedger || [],
        productAliases: dataStore.productAliases || [],
        bulkUploadBatches: dataStore.bulkUploadBatches || [],
        stockAdjustments: dataStore.stockAdjustments || [],
        shipmentShortages: dataStore.shipmentShortages || [],
        subscriptions: dataStore.subscriptions || [],
        payments: dataStore.payments || [],
        auditLogs: dataStore.auditLogs || [],
      }
    }
    // If MongoDB backend is enabled but data store not hydrated, return empty state
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
      return {
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
      }
    }
    // Otherwise fall back to localStorage
    return loadDatabase()
  }

  private persist(state: ReturnType<typeof loadDatabase>) {
    saveDatabase(state)
  }

  getUsers(): User[] {
    return this.getState().users
  }

  getUsersByRole(role: UserRole): User[] {
    return this.getUsers().filter((u) => u.role === role && u.status === 'approved')
  }

  getChildUsers(parentUserId: string): User[] {
    return this.getUsers().filter((u) => u.parentId === parentUserId)
  }

  getOrganizations(type?: UserRole): Organization[] {
    const orgs = this.getState().organizations
    return type ? orgs.filter((o) => o.type === type) : orgs
  }

  getOrganization(orgId: string): Organization | undefined {
    return this.getState().organizations.find((o) => o.id === orgId)
  }

  createUser(creator: AuthSession, input: CreateUserInput): CreateUserResult {
    if (!canCreateRole(creator.role, input.role)) {
      throw new Error(`${creator.role} cannot create ${input.role}`)
    }

    const passwordError = validateNewPassword(input.password)
    if (passwordError) throw new Error(passwordError)

    const email = input.email.trim().toLowerCase()
    const state = this.getState()
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('A user with this email already exists')
    }

    const orgId = id('org')
    const userId = id('user')

    const org: Organization = {
      id: orgId,
      name: input.name,
      type: input.role,
      parentId: creator.orgId,
      location: input.location ?? '',
      contact: input.contact ?? '',
      ownerUserId: userId,
      createdAt: now(),
    }

    const user: User = {
      id: userId,
      email,
      name: input.name,
      role: input.role,
      status: 'approved',
      parentId: creator.userId,
      orgId,
      location: input.location,
      contact: input.contact,
      createdAt: now(),
      updatedAt: now(),
    }

    state.organizations.push(org)
    state.users.push(user)
    this.persist(state)
    setLocalCredential(email, input.password)

    return { user, loginEmail: email }
  }

  approveUser(userId: string, approve: boolean): User {
    const state = this.getState()
    const user = state.users.find((u) => u.id === userId)
    if (!user) throw new Error('User not found')
    user.status = approve ? 'approved' : 'rejected'
    user.updatedAt = now()
    this.persist(state)
    return user
  }

  getProducts(): Product[] {
    return this.getState().products
  }

  getStock(orgId: string): StockRecord[] {
    return this.getState().stock.filter((s) => s.orgId === orgId)
  }

  getAllStock(): StockRecord[] {
    return this.getState().stock
  }

  private createStockLedgerEntry(
    state: ReturnType<typeof loadDatabase>,
    session: AuthSession,
    productId: string,
    productName: string,
    productCode: string,
    actionType: StockActionType,
    referenceNumber: string,
    quantityIn: number,
    quantityOut: number,
    remarks?: string
  ): void {
    // Calculate closing balance
    const existingStock = state.stock.find(
      (s) => s.orgId === session.orgId && s.productId === productId
    )
    const closingBalance = existingStock ? existingStock.quantity : 0

    const ledgerEntry: StockLedger = {
      id: id('ledger'),
      dateTime: now(),
      productId,
      productName,
      productCode,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      orgId: session.orgId,
      actionType,
      referenceNumber,
      quantityIn,
      quantityOut,
      closingBalance,
      remarks,
    }

    state.stockLedger.push(ledgerEntry)
  }

  private upsertStock(
    state: ReturnType<typeof loadDatabase>,
    session: AuthSession,
    productId: string,
    productName: string,
    productCode: string,
    delta: number,
    actionType: StockActionType,
    referenceNumber: string,
    remarks?: string
  ) {
    const existing = state.stock.find(
      (s) => s.orgId === session.orgId && s.productId === productId,
    )
    if (existing) {
      existing.quantity = Math.max(0, existing.quantity + delta)
      existing.updatedAt = now()
    } else if (delta > 0) {
      state.stock.push({
        id: id('stk'),
        orgId: session.orgId,
        orgType: session.role,
        productId,
        productName,
        quantity: delta,
        updatedAt: now(),
      })
    }

    // Create ledger entry
    const quantityIn = delta > 0 ? delta : 0
    const quantityOut = delta < 0 ? Math.abs(delta) : 0
    this.createStockLedgerEntry(
      state,
      session,
      productId,
      productName,
      productCode,
      actionType,
      referenceNumber,
      quantityIn,
      quantityOut,
      remarks
    )
  }

  private resolveProduct(
    state: ReturnType<typeof loadDatabase>,
    productName: string,
  ): Product {
    let product = state.products.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase(),
    )
    if (!product) {
      product = {
        id: id('prod'),
        sku: productName.toUpperCase().slice(0, 8),
        name: productName,
        category: 'General',
        unitPrice: 0,
        mrp: 0,
        caseLot: 1,
      }
      state.products.push(product)
    }
    return product
  }

  private normalizeShipmentItems(
    state: ReturnType<typeof loadDatabase>,
    items: ShipmentItem[],
  ): ShipmentItem[] {
    return items.map((item) => {
      if (item.productId) return item
      const product = this.resolveProduct(state, item.productName)
      return { ...item, productId: product.id, productName: product.name }
    })
  }

  uploadOpeningStock(session: AuthSession, rows: OpeningStockRow[]): StockRecord[] {
    if (session.role !== 'distributor' && session.role !== 'sub_distributor') {
      throw new Error('Only Distributor and Sub Distributor can upload stock from bill/Excel')
    }

    const state = this.getState()
    const updated: StockRecord[] = []

    for (const row of rows) {
      if (!row.productName || row.quantity <= 0) continue
      const product = this.resolveProduct(state, row.productName)
      this.upsertStock(
        state,
        session,
        product.id,
        product.name,
        product.sku,
        row.quantity,
        'invoice_upload',
        `INV_${Date.now()}`,
        'Opening stock from invoice upload'
      )
      const rec = state.stock.find(
        (s) => s.orgId === session.orgId && s.productId === product.id,
      )
      if (rec) updated.push(rec)
    }

    this.persist(state)
    return updated
  }

  getShipments(filters?: {
    senderOrgId?: string
    receiverOrgId?: string
    status?: Shipment['status']
  }): Shipment[] {
    let list = this.getState().shipments
    if (filters?.senderOrgId) list = list.filter((s) => s.senderOrgId === filters.senderOrgId)
    if (filters?.receiverOrgId) list = list.filter((s) => s.receiverOrgId === filters.receiverOrgId)
    if (filters?.status) list = list.filter((s) => s.status === filters.status)
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getShipment(shipmentId: string): Shipment | undefined {
    return this.getState().shipments.find((s) => s.id === shipmentId)
  }

  createShipment(session: AuthSession, input: CreateShipmentInput): Shipment {
    const state = this.getState()
    const receiverOrg = state.organizations.find((o) => o.id === input.receiverOrgId)
    const receiverUser = state.users.find((u) => u.orgId === input.receiverOrgId)

    if (!receiverOrg || !receiverUser) {
      throw new Error('Receiver not found')
    }

    if (!canShip(session.role, receiverOrg.type)) {
      throw new Error(`Invalid shipment route: ${session.role} → ${receiverOrg.type}`)
    }

    const items = this.normalizeShipmentItems(state, input.items)
    if (items.length === 0) {
      throw new Error('Add at least one product to the shipment')
    }

    if (
      session.role === 'distributor' &&
      receiverOrg.type === 'retailer' &&
      !input.invoiceFileName &&
      !input.invoiceDataUrl
    ) {
      throw new Error('Bill copy is required when sending to a retailer')
    }

    for (const item of items) {
      if (!item.productId) {
        throw new Error(`Unknown product: ${item.productName}`)
      }
      const stock = state.stock.find(
        (s) => s.orgId === session.orgId && s.productId === item.productId,
      )
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName}`)
      }
    }

    const shipmentId = id('shp')
    const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}`

    const timeline: ShipmentTimeline[] = [
      {
        event: 'invoice_uploaded',
        timestamp: now(),
        userId: session.userId,
        userName: session.name,
        notes: 'Invoice uploaded for processing'
      },
      {
        event: 'parsed_successfully',
        timestamp: now(),
        userId: session.userId,
        userName: session.name,
        notes: 'Invoice parsed successfully'
      },
      {
        event: 'shipment_created',
        timestamp: now(),
        userId: session.userId,
        userName: session.name,
        notes: `Shipment created to ${receiverOrg.name}`
      }
    ]

    const shipment: Shipment = {
      id: shipmentId,
      shipmentNumber,
      invoiceNumber: input.invoiceNumber,
      invoiceFileName: input.invoiceFileName,
      invoiceDataUrl: input.invoiceDataUrl,
      senderId: session.userId,
      senderOrgId: session.orgId,
      senderName: session.name,
      senderRole: session.role,
      receiverId: receiverUser.id,
      receiverOrgId: receiverOrg.id,
      receiverName: receiverOrg.name,
      receiverRole: receiverOrg.type,
      items,
      notes: input.notes,
      status: 'sent',
      createdAt: now(),
      updatedAt: now(),
      timeline,
    }

    state.shipments.push(shipment)

    const itemsSummary = items
      .map((i) => `${i.quantity} ${i.productName}`)
      .join('\n')

    state.notifications.push({
      id: id('notif'),
      userId: receiverUser.id,
      orgId: receiverOrg.id,
      title: `New shipment ${input.invoiceNumber}`,
      message: `${session.name} sent shipment ${input.invoiceNumber}:\n${itemsSummary}`,
      shipmentId,
      read: false,
      type: 'shipment',
      createdAt: now(),
    })

    this.persist(state)
    return shipment
  }

  receiveShipment(session: AuthSession, shipmentId: string): Shipment {
    const state = this.getState()
    const shipment = state.shipments.find((s) => s.id === shipmentId)

    if (!shipment) throw new Error('Shipment not found')
    if (shipment.receiverOrgId !== session.orgId) {
      throw new Error('You are not the receiver of this shipment')
    }
    if (shipment.status === 'received') {
      throw new Error('Shipment already received')
    }

    for (const item of shipment.items) {
      this.upsertStock(
        state,
        { ...session, orgId: shipment.senderOrgId, role: shipment.senderRole },
        item.productId,
        item.productName,
        '',
        -item.quantity,
        'sent',
        shipment.invoiceNumber,
        'Shipment sent'
      )
      this.upsertStock(
        state,
        { ...session, orgId: shipment.receiverOrgId, role: shipment.receiverRole },
        item.productId,
        item.productName,
        '',
        item.quantity,
        'received',
        shipment.invoiceNumber,
        'Shipment received'
      )
    }

    shipment.status = 'received'
    shipment.receivedAt = now()
    shipment.updatedAt = now()
    
    // Add timeline event for shipment received
    if (!shipment.timeline) shipment.timeline = []
    shipment.timeline.push({
      event: 'shipment_received',
      timestamp: now(),
      userId: session.userId,
      userName: session.name,
      notes: `Shipment received by ${session.name}`
    })

    state.transactionHistory.push({
      id: id('tx'),
      shipmentId: shipment.id,
      invoiceNumber: shipment.invoiceNumber,
      senderOrgId: shipment.senderOrgId,
      senderName: shipment.senderName,
      senderRole: shipment.senderRole,
      receiverOrgId: shipment.receiverOrgId,
      receiverName: shipment.receiverName,
      receiverRole: shipment.receiverRole,
      items: shipment.items,
      status: 'received',
      createdAt: now(),
    })

    state.notifications.push({
      id: id('notif'),
      userId: shipment.senderId,
      orgId: shipment.senderOrgId,
      title: `Shipment ${shipment.invoiceNumber} received`,
      message: `${shipment.receiverName} confirmed receipt of ${shipment.invoiceNumber}`,
      shipmentId: shipment.id,
      read: false,
      type: 'success',
      createdAt: now(),
    })

    this.persist(state)
    return shipment
  }

  receiveShipmentPartial(
    session: AuthSession,
    shipmentId: string,
    receivedItems: { productId: string; productName: string; receivedQuantity: number }[],
    shortageReason: ShortageReason,
    remarks?: string
  ): Shipment {
    const state = this.getState()
    const shipment = state.shipments.find((s) => s.id === shipmentId)

    if (!shipment) throw new Error('Shipment not found')
    if (shipment.receiverOrgId !== session.orgId) {
      throw new Error('You are not the receiver of this shipment')
    }
    if (shipment.status === 'received' || shipment.status === 'partially_received') {
      throw new Error('Shipment already received')
    }

    const hasShortage = receivedItems.some(item => {
      const dispatchedItem = shipment.items.find(i => i.productId === item.productId)
      return dispatchedItem && item.receivedQuantity < dispatchedItem.quantity
    })

    for (const receivedItem of receivedItems) {
      const dispatchedItem = shipment.items.find(i => i.productId === receivedItem.productId)
      if (!dispatchedItem) continue

      this.upsertStock(
        state,
        { ...session, orgId: shipment.senderOrgId, role: shipment.senderRole },
        receivedItem.productId,
        receivedItem.productName,
        '',
        -dispatchedItem.quantity,
        'sent',
        shipment.invoiceNumber,
        'Shipment sent'
      )

      this.upsertStock(
        state,
        { ...session, orgId: shipment.receiverOrgId, role: shipment.receiverRole },
        receivedItem.productId,
        receivedItem.productName,
        '',
        receivedItem.receivedQuantity,
        'received',
        shipment.invoiceNumber,
        'Partial shipment received'
      )

      if (receivedItem.receivedQuantity < dispatchedItem.quantity) {
        const shortage: ShipmentShortage = {
          id: id('shortage'),
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          invoiceNumber: shipment.invoiceNumber,
          senderOrgId: shipment.senderOrgId,
          senderName: shipment.senderName,
          receiverOrgId: shipment.receiverOrgId,
          receiverName: shipment.receiverName,
          productId: receivedItem.productId,
          productName: receivedItem.productName,
          dispatchedQuantity: dispatchedItem.quantity,
          receivedQuantity: receivedItem.receivedQuantity,
          shortageQuantity: dispatchedItem.quantity - receivedItem.receivedQuantity,
          reason: shortageReason,
          remarks,
          status: 'pending',
          createdAt: now(),
          updatedAt: now(),
        }
        state.shipmentShortages.push(shortage)

        const shortageQuantity = dispatchedItem.quantity - receivedItem.receivedQuantity
        this.createStockLedgerEntry(
          state,
          session,
          receivedItem.productId,
          receivedItem.productName,
          '',
          'sent' as StockActionType,
          shipment.invoiceNumber,
          0,
          shortageQuantity,
          `Shortage: ${shortageReason}`
        )
      }
    }

    shipment.status = hasShortage ? 'partially_received' : 'received'
    shipment.receivedAt = now()
    shipment.updatedAt = now()
    
    if (!shipment.timeline) shipment.timeline = []
    shipment.timeline.push({
      event: 'shipment_received',
      timestamp: now(),
      userId: session.userId,
      userName: session.name,
      notes: hasShortage 
        ? `Shipment partially received by ${session.name}` 
        : `Shipment received by ${session.name}`
    })

    state.transactionHistory.push({
      id: id('tx'),
      shipmentId: shipment.id,
      invoiceNumber: shipment.invoiceNumber,
      senderOrgId: shipment.senderOrgId,
      senderName: shipment.senderName,
      senderRole: shipment.senderRole,
      receiverOrgId: shipment.receiverOrgId,
      receiverName: shipment.receiverName,
      receiverRole: shipment.receiverRole,
      items: shipment.items,
      status: shipment.status,
      createdAt: now(),
    })

    state.notifications.push({
      id: id('notif'),
      userId: shipment.senderId,
      orgId: shipment.senderOrgId,
      title: `Shipment ${shipment.invoiceNumber} ${hasShortage ? 'partially received' : 'received'}`,
      message: `${shipment.receiverName} ${hasShortage ? 'partially' : ''} confirmed receipt of ${shipment.invoiceNumber}`,
      shipmentId,
      read: false,
      type: 'shipment',
      createdAt: now(),
    })

    this.persist(state)
    return shipment
  }

  getShipmentShortages(orgId: string): ShipmentShortage[] {
    return this.getState().shipmentShortages
      .filter(shortage => shortage.senderOrgId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  resolveShortage(
    session: AuthSession,
    shortageId: string,
    remarks?: string
  ): ShipmentShortage {
    const state = this.getState()
    const shortage = state.shipmentShortages.find(s => s.id === shortageId)

    if (!shortage) throw new Error('Shortage not found')
    if (shortage.senderOrgId !== session.orgId) {
      throw new Error('You are not the sender of this shortage')
    }
    if (shortage.status === 'resolved' || shortage.status === 'closed') {
      throw new Error('Shortage already processed')
    }

    shortage.status = 'closed'
    shortage.resolvedBy = session.userId
    shortage.resolvedByName = session.name
    shortage.resolvedDate = now()
    shortage.remarks = remarks
    shortage.updatedAt = now()

    this.persist(state)
    return shortage
  }

  rejectShipment(session: AuthSession, shipmentId: string): Shipment {
    const state = this.getState()
    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (!shipment) throw new Error('Shipment not found')
    if (shipment.receiverOrgId !== session.orgId) {
      throw new Error('You are not the receiver')
    }
    if (shipment.status !== 'sent' && shipment.status !== 'in_transit') {
      throw new Error('Only pending inbound shipments can be rejected')
    }
    shipment.status = 'rejected'
    shipment.updatedAt = now()
    this.persist(state)
    return shipment
  }

  getReturns(orgId?: string): StockReturn[] {
    const list = this.getState().returns
    if (!orgId) return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return list
      .filter((r) => r.fromOrgId === orgId || r.toOrgId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  processReturn(session: AuthSession, input: CreateReturnInput): StockReturn {
    const state = this.getState()
    const shipment = state.shipments.find((s) => s.id === input.shipmentId)
    if (!shipment) throw new Error('Shipment not found')
    if (shipment.status !== 'received') {
      throw new Error('Only received shipments can be returned')
    }
    if (shipment.receiverOrgId !== session.orgId) {
      throw new Error('Only the party who received goods can process a return')
    }

    const items = this.normalizeShipmentItems(state, input.items)
    if (!items.length) throw new Error('Select items to return')

    for (const item of items) {
      const received = shipment.items.find((i) => i.productId === item.productId)
      if (!received) {
        throw new Error(`${item.productName} was not in this shipment`)
      }
      if (item.quantity > received.quantity) {
        throw new Error(`Return qty for ${item.productName} exceeds received (${received.quantity})`)
      }
      const stock = state.stock.find(
        (s) => s.orgId === session.orgId && s.productId === item.productId,
      )
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Not enough stock to return ${item.productName}`)
      }
    }

    for (const item of items) {
      this.upsertStock(
        state,
        { ...session, orgId: shipment.receiverOrgId, role: shipment.receiverRole },
        item.productId,
        item.productName,
        '',
        -item.quantity,
        'return',
        shipment.invoiceNumber,
        input.reason
      )
      this.upsertStock(
        state,
        { ...session, orgId: shipment.senderOrgId, role: shipment.senderRole },
        item.productId,
        item.productName,
        '',
        item.quantity,
        'return',
        shipment.invoiceNumber,
        input.reason
      )
    }

    shipment.status = 'returned'
    shipment.updatedAt = now()
    
    // Add timeline event for shipment returned
    if (!shipment.timeline) shipment.timeline = []
    shipment.timeline.push({
      event: 'shipment_returned',
      timestamp: now(),
      userId: session.userId,
      userName: session.name,
      notes: `Shipment returned: ${input.reason}`
    })

    const stockReturn: StockReturn = {
      id: id('ret'),
      shipmentId: shipment.id,
      invoiceNumber: shipment.invoiceNumber,
      fromOrgId: shipment.receiverOrgId,
      fromOrgName: shipment.receiverName,
      toOrgId: shipment.senderOrgId,
      toOrgName: shipment.senderName,
      items,
      reason: input.reason,
      createdByUserId: session.userId,
      createdAt: now(),
    }
    state.returns.push(stockReturn)

    state.transactionHistory.push({
      id: id('tx'),
      shipmentId: shipment.id,
      invoiceNumber: shipment.invoiceNumber,
      senderOrgId: shipment.receiverOrgId,
      senderName: shipment.receiverName,
      senderRole: shipment.receiverRole,
      receiverOrgId: shipment.senderOrgId,
      receiverName: shipment.senderName,
      receiverRole: shipment.senderRole,
      items,
      status: 'returned',
      createdAt: now(),
    })

    state.notifications.push({
      id: id('notif'),
      userId: shipment.senderId,
      orgId: shipment.senderOrgId,
      title: `Return: ${shipment.invoiceNumber}`,
      message: `${session.name} returned goods on invoice ${shipment.invoiceNumber}`,
      shipmentId: shipment.id,
      read: false,
      type: 'warning',
      createdAt: now(),
    })

    this.persist(state)
    return stockReturn
  }

  createManualReturn(session: AuthSession, input: { invoiceNumber: string; items: ShipmentItem[]; reason?: string }): StockReturn {
    const state = this.getState()
    const items = this.normalizeShipmentItems(state, input.items)
    if (!items.length) throw new Error('Add at least one product')

    // Increase stock for the current organization (receiving returned goods)
    for (const item of items) {
      this.upsertStock(
        state,
        session,
        item.productId,
        item.productName,
        '',
        item.quantity,
        'manual_return',
        input.invoiceNumber,
        input.reason
      )
    }

    const stockReturn: StockReturn = {
      id: id('ret'),
      shipmentId: '', // No original shipment for manual returns
      invoiceNumber: input.invoiceNumber,
      fromOrgId: '', // No specific sender for manual returns
      fromOrgName: 'Manual Entry',
      toOrgId: session.orgId,
      toOrgName: session.name,
      items,
      reason: input.reason,
      createdByUserId: session.userId,
      createdAt: now(),
    }
    state.returns.push(stockReturn)

    state.transactionHistory.push({
      id: id('tx'),
      shipmentId: '',
      invoiceNumber: input.invoiceNumber,
      senderOrgId: '',
      senderName: 'Manual Entry',
      senderRole: session.role,
      receiverOrgId: session.orgId,
      receiverName: session.name,
      receiverRole: session.role,
      items,
      status: 'received',
      createdAt: now(),
    })

    this.persist(state)
    return stockReturn
  }

  getNotifications(userId: string): AppNotification[] {
    return this.getState()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  markNotificationRead(notificationId: string): void {
    const state = this.getState()
    const n = state.notifications.find((x) => x.id === notificationId)
    if (n) {
      n.read = true
      this.persist(state)
    }
  }

  getTransactionHistory(): TransactionHistory[] {
    return this.getState().transactionHistory.sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
  }

  resetToSeed(): void {
    saveDatabase(createSeedDatabase())
  }

  replaceProductCatalog(): Product[] {
    const next = applyProductCatalogToState(this.getState())
    this.persist(next)
    setInstalledCatalogVersion()
    return next.products
  }

  // Product Alias CRUD Operations

  getProductAliases(): ProductAlias[] {
    return this.getState().productAliases.sort((a, b) => b.usageCount - a.usageCount)
  }

  createProductAlias(
    aliasName: string,
    productId: string,
    productName: string,
    createdBy: string
  ): ProductAlias {
    const state = this.getState()
    
    // Check if alias already exists
    const existingAlias = state.productAliases.find(
      (a) => a.aliasName.toLowerCase() === aliasName.trim().toLowerCase()
    )
    
    if (existingAlias) {
      throw new Error('Alias with this name already exists')
    }

    const newAlias: ProductAlias = {
      id: id('alias'),
      aliasName: aliasName.trim(),
      productId,
      productName,
      createdBy,
      createdDate: now(),
      lastUsedDate: now(),
      usageCount: 0,
    }

    state.productAliases.push(newAlias)
    this.persist(state)
    return newAlias
  }

  updateProductAlias(
    aliasId: string,
    updates: Partial<Pick<ProductAlias, 'aliasName' | 'productId' | 'productName'>>
  ): ProductAlias {
    const state = this.getState()
    const alias = state.productAliases.find((a) => a.id === aliasId)
    
    if (!alias) {
      throw new Error('Alias not found')
    }

    if (updates.aliasName) {
      // Check if new alias name conflicts with existing
      const existing = state.productAliases.find(
        (a) => a.aliasName.toLowerCase() === updates.aliasName!.toLowerCase() && a.id !== aliasId
      )
      if (existing) {
        throw new Error('Alias with this name already exists')
      }
      alias.aliasName = updates.aliasName.trim()
    }

    if (updates.productId) {
      const product = state.products.find((p) => p.id === updates.productId)
      if (!product) {
        throw new Error('Product not found')
      }
      alias.productId = updates.productId
      alias.productName = updates.productName || product.name
    }

    if (updates.productName) {
      alias.productName = updates.productName
    }

    this.persist(state)
    return alias
  }

  deleteProductAlias(aliasId: string): void {
    const state = this.getState()
    const index = state.productAliases.findIndex((a) => a.id === aliasId)
    
    if (index === -1) {
      throw new Error('Alias not found')
    }

    state.productAliases.splice(index, 1)
    this.persist(state)
  }

  mergeProductAliases(sourceAliasIds: string[], targetAliasId: string): void {
    const state = this.getState()
    const targetAlias = state.productAliases.find((a) => a.id === targetAliasId)
    
    if (!targetAlias) {
      throw new Error('Target alias not found')
    }

    let totalUsage = targetAlias.usageCount

    for (const sourceId of sourceAliasIds) {
      if (sourceId === targetAliasId) continue
      
      const sourceAlias = state.productAliases.find((a) => a.id === sourceId)
      if (sourceAlias) {
        totalUsage += sourceAlias.usageCount
        // Remove source alias
        const index = state.productAliases.findIndex((a) => a.id === sourceId)
        if (index !== -1) {
          state.productAliases.splice(index, 1)
        }
      }
    }

    targetAlias.usageCount = totalUsage
    this.persist(state)
  }

  incrementAliasUsage(aliasId: string): void {
    const state = this.getState()
    const alias = state.productAliases.find((a) => a.id === aliasId)
    
    if (alias) {
      alias.usageCount += 1
      alias.lastUsedDate = now()
      this.persist(state)
    }
  }

  // Bulk Upload History Methods

  getBulkUploadBatches(): BulkUploadBatch[] {
    return this.getState().bulkUploadBatches.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    )
  }

  getBulkUploadBatch(batchId: string): BulkUploadBatch | null {
    return this.getState().bulkUploadBatches.find(b => b.batchId === batchId) || null
  }

  createBulkUploadBatch(
    uploadedBy: string,
    uploadedByName: string,
    invoices: Array<{
      invoiceNumber: string
      fileName: string
      pdfData: string
    }>
  ): BulkUploadBatch {
    const state = this.getState()
    const batchId = `BATCH_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    
    const batchInvoices = invoices.map(inv => ({
      id: id('invoice'),
      batchId,
      invoiceNumber: inv.invoiceNumber,
      fileName: inv.fileName,
      pdfData: inv.pdfData,
      status: 'processing' as const,
      stockUpdated: false,
      retryCount: 0,
      createdAt: now(),
      updatedAt: now(),
    }))

    const batch: BulkUploadBatch = {
      id: id('batch'),
      batchId,
      uploadedBy,
      uploadedByName,
      uploadDate: now(),
      totalInvoices: invoices.length,
      successCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      pendingMappingCount: 0,
      stockUpdatedCount: 0,
      status: 'processing',
      invoices: batchInvoices,
      createdAt: now(),
      updatedAt: now(),
    }

    state.bulkUploadBatches.push(batch)
    this.persist(state)
    return batch
  }

  updateBulkUploadInvoice(
    invoiceId: string,
    updates: Partial<{
      status: BulkUploadBatch['invoices'][0]['status']
      failureReason: BulkUploadBatch['invoices'][0]['failureReason']
      failureDetails: string
      parsedData: BulkUploadBatch['invoices'][0]['parsedData']
      retailerOrgId: string
      retailerName: string
      stockUpdated: boolean
      stockUpdatedDate: string
    }>
  ): void {
    const state = this.getState()
    const batch = state.bulkUploadBatches.find(b => 
      b.invoices.some(inv => inv.id === invoiceId)
    )
    
    if (!batch) return

    const invoice = batch.invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    Object.assign(invoice, updates)
    invoice.updatedAt = now()

    // Recalculate batch statistics
    batch.successCount = batch.invoices.filter(i => i.status === 'success').length
    batch.failedCount = batch.invoices.filter(i => 
      ['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(i.status)
    ).length
    batch.duplicateCount = batch.invoices.filter(i => i.status === 'duplicate').length
    batch.pendingMappingCount = batch.invoices.filter(i => i.status === 'pending_mapping').length
    batch.stockUpdatedCount = batch.invoices.filter(i => i.stockUpdated).length

    // Update batch status
    if (batch.failedCount === 0 && batch.pendingMappingCount === 0) {
      batch.status = 'completed'
    } else if (batch.successCount > 0) {
      batch.status = 'partial_success'
    } else {
      batch.status = 'failed'
    }

    batch.updatedAt = now()
    this.persist(state)
  }

  retryBulkUploadInvoice(invoiceId: string): void {
    const state = this.getState()
    const batch = state.bulkUploadBatches.find(b => 
      b.invoices.some(inv => inv.id === invoiceId)
    )
    
    if (!batch) return

    const invoice = batch.invoices.find(inv => inv.id === invoiceId)
    if (!invoice) return

    invoice.status = 'processing'
    invoice.failureReason = undefined
    invoice.failureDetails = undefined
    invoice.retryCount += 1
    invoice.lastRetryDate = now()
    invoice.updatedAt = now()

    batch.status = 'processing'
    batch.updatedAt = now()
    this.persist(state)
  }

  deleteBulkUploadInvoice(invoiceId: string): void {
    const state = this.getState()
    const batchIndex = state.bulkUploadBatches.findIndex(b => 
      b.invoices.some(inv => inv.id === invoiceId)
    )
    
    if (batchIndex === -1) return

    const batch = state.bulkUploadBatches[batchIndex]
    const invoiceIndex = batch.invoices.findIndex(inv => inv.id === invoiceId)
    
    if (invoiceIndex === -1) return

    batch.invoices.splice(invoiceIndex, 1)
    batch.totalInvoices = batch.invoices.length

    // Recalculate statistics
    batch.successCount = batch.invoices.filter(i => i.status === 'success').length
    batch.failedCount = batch.invoices.filter(i => 
      ['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(i.status)
    ).length
    batch.duplicateCount = batch.invoices.filter(i => i.status === 'duplicate').length
    batch.pendingMappingCount = batch.invoices.filter(i => i.status === 'pending_mapping').length
    batch.stockUpdatedCount = batch.invoices.filter(i => i.stockUpdated).length

    batch.updatedAt = now()

    // If batch is empty, delete it
    if (batch.invoices.length === 0) {
      state.bulkUploadBatches.splice(batchIndex, 1)
    }

    this.persist(state)
  }

  deleteBulkUploadBatch(batchId: string): void {
    const state = this.getState()
    const index = state.bulkUploadBatches.findIndex(b => b.batchId === batchId)
    
    if (index !== -1) {
      state.bulkUploadBatches.splice(index, 1)
      this.persist(state)
    }
  }

  getBulkUploadSummary(): {
    totalUploaded: number
    successfullyUpdated: number
    failed: number
    pendingReview: number
    duplicateInvoices: number
  } {
    const batches = this.getBulkUploadBatches()
    
    return {
      totalUploaded: batches.reduce((sum, b) => sum + b.totalInvoices, 0),
      successfullyUpdated: batches.reduce((sum, b) => sum + b.stockUpdatedCount, 0),
      failed: batches.reduce((sum, b) => sum + b.failedCount, 0),
      pendingReview: batches.reduce((sum, b) => sum + b.pendingMappingCount, 0),
      duplicateInvoices: batches.reduce((sum, b) => sum + b.duplicateCount, 0),
    }
  }

  // Stock Adjustment Methods

  getStockAdjustments(orgId: string): StockAdjustment[] {
    return this.getState().stockAdjustments
      .filter(adj => adj.orgId === orgId)
      .sort((a, b) => new Date(b.adjustedDate).getTime() - new Date(a.adjustedDate).getTime())
  }

  createStockAdjustment(
    session: AuthSession,
    productId: string,
    productName: string,
    productCode: string,
    systemStock: number,
    physicalStock: number,
    reason: StockAdjustment['reason'],
    remarks?: string
  ): StockAdjustment {
    const state = this.getState()
    const difference = physicalStock - systemStock
    const adjustmentQuantity = difference

    // Update stock
    const existing = state.stock.find(
      (s) => s.orgId === session.orgId && s.productId === productId
    )
    
    if (existing) {
      existing.quantity = Math.max(0, physicalStock)
      existing.updatedAt = now()
    } else if (physicalStock > 0) {
      state.stock.push({
        id: id('stk'),
        orgId: session.orgId,
        orgType: session.role,
        productId,
        productName,
        quantity: physicalStock,
        updatedAt: now(),
      })
    }

    // Create stock ledger entry
    const quantityIn = adjustmentQuantity > 0 ? adjustmentQuantity : 0
    const quantityOut = adjustmentQuantity < 0 ? Math.abs(adjustmentQuantity) : 0
    
    this.createStockLedgerEntry(
      state,
      session,
      productId,
      productName,
      productCode,
      'adjustment',
      `ADJ_${Date.now()}`,
      quantityIn,
      quantityOut,
      remarks
    )

    // Create adjustment record
    const adjustment: StockAdjustment = {
      id: id('adj'),
      orgId: session.orgId,
      orgType: session.role,
      productId,
      productName,
      productCode,
      systemStock,
      physicalStock,
      difference,
      adjustmentQuantity,
      reason,
      remarks,
      adjustedBy: session.userId,
      adjustedByName: session.name,
      adjustedDate: now(),
      createdAt: now(),
    }

    state.stockAdjustments.push(adjustment)
    this.persist(state)
    return adjustment
  }

  getStockAdjustmentSummary(orgId: string): {
    lastVerificationDate: string | null
    totalAdjustmentsThisMonth: number
    totalDifferenceAdjusted: number
  } {
    const adjustments = this.getStockAdjustments(orgId)
    const nowDate = new Date()
    const thisMonth = nowDate.getMonth()
    const thisYear = nowDate.getFullYear()

    const thisMonthAdjustments = adjustments.filter(adj => {
      const adjDate = new Date(adj.adjustedDate)
      return adjDate.getMonth() === thisMonth && adjDate.getFullYear() === thisYear
    })

    return {
      lastVerificationDate: adjustments.length > 0 ? adjustments[0].adjustedDate : null,
      totalAdjustmentsThisMonth: thisMonthAdjustments.length,
      totalDifferenceAdjusted: thisMonthAdjustments.reduce((sum, adj) => sum + Math.abs(adj.adjustmentQuantity), 0),
    }
  }
}

const localService = new ElectroTrackLocalService()

export class ElectroTrackService {
  getUsers(): User[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getUsers()
      : localService.getUsers()
  }

  getUsersByRole(role: UserRole): User[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getUsersByRole(role)
      : localService.getUsersByRole(role)
  }

  getChildUsers(parentUserId: string): User[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getChildUsers(parentUserId)
      : localService.getChildUsers(parentUserId)
  }

  getOrganizations(type?: UserRole): Organization[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getOrganizations(type)
      : localService.getOrganizations(type)
  }

  getOrganization(orgId: string): Organization | undefined {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getOrganization(orgId)
      : localService.getOrganization(orgId)
  }

  async createUser(
    creator: AuthSession,
    input: CreateUserInput,
  ): Promise<CreateUserResult> {
    if (
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo'
    ) {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator, input }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user')
      }
      return { user: data.user, loginEmail: data.loginEmail }
    }
    if (shouldUseFirebaseBackend()) {
      return electroTrackFirebaseService.createUser(creator, input)
    }
    return localService.createUser(creator, input)
  }

  async approveUser(userId: string, approve: boolean): Promise<User> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.approveUser(userId, approve)
    }
    return localService.approveUser(userId, approve)
  }

  getProducts(): Product[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getProducts()
      : localService.getProducts()
  }

  getStock(orgId: string): StockRecord[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getStock(orgId)
      : localService.getStock(orgId)
  }

  getAllStock(): StockRecord[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getAllStock()
      : localService.getAllStock()
  }

  async uploadOpeningStock(
    session: AuthSession,
    rows: OpeningStockRow[],
  ): Promise<StockRecord[]> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.uploadOpeningStock(session, rows)
    }
    return localService.uploadOpeningStock(session, rows)
  }

  getShipments(filters?: {
    senderOrgId?: string
    receiverOrgId?: string
    status?: Shipment['status']
  }): Shipment[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getShipments(filters)
      : localService.getShipments(filters)
  }

  getShipment(shipmentId: string): Shipment | undefined {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getShipment(shipmentId)
      : localService.getShipment(shipmentId)
  }

  async createShipment(
    session: AuthSession,
    input: CreateShipmentInput,
  ): Promise<Shipment> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.createShipment(session, input)
    }
    return localService.createShipment(session, input)
  }

  async receiveShipment(session: AuthSession, shipmentId: string): Promise<Shipment> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.receiveShipment(session, shipmentId)
    }
    return localService.receiveShipment(session, shipmentId)
  }

  receiveShipmentPartial(
    session: AuthSession,
    shipmentId: string,
    receivedItems: { productId: string; productName: string; receivedQuantity: number }[],
    shortageReason: ShortageReason,
    remarks?: string
  ): Shipment {
    return localService.receiveShipmentPartial(session, shipmentId, receivedItems, shortageReason, remarks)
  }

  getShipmentShortages(orgId: string): ShipmentShortage[] {
    return localService.getShipmentShortages(orgId)
  }

  resolveShortage(
    session: AuthSession,
    shortageId: string,
    remarks?: string
  ): ShipmentShortage {
    return localService.resolveShortage(session, shortageId, remarks)
  }

  async rejectShipment(session: AuthSession, shipmentId: string): Promise<Shipment> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.rejectShipment(session, shipmentId)
    }
    return localService.rejectShipment(session, shipmentId)
  }

  getReturns(orgId?: string): StockReturn[] {
    return localService.getReturns(orgId)
  }

  async processReturn(
    session: AuthSession,
    input: CreateReturnInput,
  ): Promise<StockReturn> {
    return localService.processReturn(session, input)
  }

  async createManualReturn(session: AuthSession, input: { invoiceNumber: string; items: ShipmentItem[]; reason?: string }): Promise<StockReturn> {
    return localService.createManualReturn(session, input)
  }

  getNotifications(userId: string): AppNotification[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getNotifications(userId)
      : localService.getNotifications(userId)
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    if (shouldUseFirebaseData()) {
      return electroTrackFirebaseService.markNotificationRead(notificationId)
    }
    localService.markNotificationRead(notificationId)
  }

  getTransactionHistory(): TransactionHistory[] {
    return shouldUseFirebaseData()
      ? electroTrackFirebaseService.getTransactionHistory()
      : localService.getTransactionHistory()
  }

  async getUserByAuthUid(authUid: string): Promise<User | null> {
    if (shouldUseFirebaseBackend()) {
      return electroTrackFirebaseService.getUserByAuthUid(authUid)
    }
    return localService.getUsers().find((u) => u.id === authUid) ?? null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (shouldUseFirebaseBackend()) {
      return electroTrackFirebaseService.getUserByEmail(email)
    }
    return localService.getUsers().find((u) => u.email === email) ?? null
  }

  resetToSeed(): void {
    localService.resetToSeed()
  }

  replaceProductCatalog(): Product[] {
    return localService.replaceProductCatalog()
  }

  // Product Alias CRUD Operations

  getProductAliases(): ProductAlias[] {
    return localService.getProductAliases()
  }

  createProductAlias(
    aliasName: string,
    productId: string,
    productName: string,
    createdBy: string
  ): ProductAlias {
    return localService.createProductAlias(aliasName, productId, productName, createdBy)
  }

  updateProductAlias(
    aliasId: string,
    updates: Partial<Pick<ProductAlias, 'aliasName' | 'productId' | 'productName'>>
  ): ProductAlias {
    return localService.updateProductAlias(aliasId, updates)
  }

  deleteProductAlias(aliasId: string): void {
    localService.deleteProductAlias(aliasId)
  }

  mergeProductAliases(sourceAliasIds: string[], targetAliasId: string): void {
    localService.mergeProductAliases(sourceAliasIds, targetAliasId)
  }

  incrementAliasUsage(aliasId: string): void {
    localService.incrementAliasUsage(aliasId)
  }

  // Bulk Upload History Methods

  getBulkUploadBatches(): BulkUploadBatch[] {
    return localService.getBulkUploadBatches()
  }

  getBulkUploadBatch(batchId: string): BulkUploadBatch | null {
    return localService.getBulkUploadBatch(batchId)
  }

  createBulkUploadBatch(
    uploadedBy: string,
    uploadedByName: string,
    invoices: Array<{
      invoiceNumber: string
      fileName: string
      pdfData: string
    }>
  ): BulkUploadBatch {
    return localService.createBulkUploadBatch(uploadedBy, uploadedByName, invoices)
  }

  updateBulkUploadInvoice(
    invoiceId: string,
    updates: Partial<{
      status: BulkUploadBatch['invoices'][0]['status']
      failureReason: BulkUploadBatch['invoices'][0]['failureReason']
      failureDetails: string
      parsedData: BulkUploadBatch['invoices'][0]['parsedData']
      retailerOrgId: string
      retailerName: string
      stockUpdated: boolean
      stockUpdatedDate: string
    }>
  ): void {
    localService.updateBulkUploadInvoice(invoiceId, updates)
  }

  retryBulkUploadInvoice(invoiceId: string): void {
    localService.retryBulkUploadInvoice(invoiceId)
  }

  deleteBulkUploadInvoice(invoiceId: string): void {
    localService.deleteBulkUploadInvoice(invoiceId)
  }

  deleteBulkUploadBatch(batchId: string): void {
    localService.deleteBulkUploadBatch(batchId)
  }

  getBulkUploadSummary(): {
    totalUploaded: number
    successfullyUpdated: number
    failed: number
    pendingReview: number
    duplicateInvoices: number
  } {
    return localService.getBulkUploadSummary()
  }

  // Stock Adjustment Methods

  getStockAdjustments(orgId: string): StockAdjustment[] {
    return localService.getStockAdjustments(orgId)
  }

  createStockAdjustment(
    session: AuthSession,
    productId: string,
    productName: string,
    productCode: string,
    systemStock: number,
    physicalStock: number,
    reason: StockAdjustment['reason'],
    remarks?: string
  ): StockAdjustment {
    return localService.createStockAdjustment(session, productId, productName, productCode, systemStock, physicalStock, reason, remarks)
  }

  getStockAdjustmentSummary(orgId: string): {
    lastVerificationDate: string | null
    totalAdjustmentsThisMonth: number
    totalDifferenceAdjusted: number
  } {
    return localService.getStockAdjustmentSummary(orgId)
  }
}

export const electroTrackService = new ElectroTrackService()
