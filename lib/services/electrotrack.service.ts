import type {
  AppNotification,
  AuthSession,
  CreateReturnInput,
  CreateShipmentInput,
  CreateUserInput,
  CreateUserResult,
  OpeningStockRow,
  Organization,
  Product,
  Shipment,
  ShipmentItem,
  StockRecord,
  StockReturn,
  TransactionHistory,
  User,
  UserRole,
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

  private upsertStock(
    state: ReturnType<typeof loadDatabase>,
    orgId: string,
    orgType: UserRole,
    productId: string,
    productName: string,
    delta: number,
  ) {
    const existing = state.stock.find(
      (s) => s.orgId === orgId && s.productId === productId,
    )
    if (existing) {
      existing.quantity = Math.max(0, existing.quantity + delta)
      existing.updatedAt = now()
    } else if (delta > 0) {
      state.stock.push({
        id: id('stk'),
        orgId,
        orgType,
        productId,
        productName,
        quantity: delta,
        updatedAt: now(),
      })
    }
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
    if (session.role !== 'admin' && session.role !== 'depo') {
      throw new Error('Only Factory or Depo can upload stock from bill/Excel')
    }

    const state = this.getState()
    const updated: StockRecord[] = []

    for (const row of rows) {
      if (!row.productName || row.quantity <= 0) continue
      const product = this.resolveProduct(state, row.productName)
      this.upsertStock(
        state,
        session.orgId,
        session.role,
        product.id,
        product.name,
        row.quantity,
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
        shipment.senderOrgId,
        shipment.senderRole,
        item.productId,
        item.productName,
        -item.quantity,
      )
      this.upsertStock(
        state,
        shipment.receiverOrgId,
        shipment.receiverRole,
        item.productId,
        item.productName,
        item.quantity,
      )
    }

    shipment.status = 'received'
    shipment.receivedAt = now()
    shipment.updatedAt = now()

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
        shipment.receiverOrgId,
        shipment.receiverRole,
        item.productId,
        item.productName,
        -item.quantity,
      )
      this.upsertStock(
        state,
        shipment.senderOrgId,
        shipment.senderRole,
        item.productId,
        item.productName,
        item.quantity,
      )
    }

    shipment.status = 'returned'
    shipment.updatedAt = now()

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
}

export const electroTrackService = new ElectroTrackService()
