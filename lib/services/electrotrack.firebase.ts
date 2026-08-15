import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase/config'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { resolveAuthUidForNewUser } from '@/lib/firebase/auth-users'
import { validateNewPassword } from '@/lib/firebase/validate-password'
import { uploadInvoiceFromDataUrl } from '@/lib/firebase/invoices'
import { firestoreId, isoNow, stockDocId } from '@/lib/firebase/utils'
import { getDataStore } from '@/lib/store/data-store'
import type {
  AppNotification,
  AuthSession,
  CreateShipmentInput,
  CreateUserInput,
  CreateUserResult,
  OpeningStockRow,
  Organization,
  Product,
  Shipment,
  StockRecord,
  TransactionHistory,
  User,
  UserRole,
} from '@/lib/types'
import { canCreateRole, canShip } from '@/lib/permissions'

function db() {
  const firestore = getFirebaseDb()
  if (!firestore) throw new Error('Firestore is not configured')
  return firestore
}

function state() {
  return getDataStore()
}

export class ElectroTrackFirebaseService {
  getUsers(): User[] {
    return state().users
  }

  getUsersByRole(role: UserRole): User[] {
    return this.getUsers().filter((u) => u.role === role && u.status === 'approved')
  }

  getChildUsers(parentUserId: string): User[] {
    return this.getUsers().filter((u) => u.parentId === parentUserId)
  }

  getOrganizations(type?: UserRole): Organization[] {
    const orgs = state().organizations
    return type ? orgs.filter((o) => o.type === type) : orgs
  }

  getOrganization(orgId: string): Organization | undefined {
    return state().organizations.find((o) => o.id === orgId)
  }

  async createUser(
    creator: AuthSession,
    input: CreateUserInput,
  ): Promise<CreateUserResult> {
    if (!canCreateRole(creator.role, input.role)) {
      throw new Error(`${creator.role} cannot create ${input.role}`)
    }

    const passwordError = validateNewPassword(input.password)
    if (passwordError) throw new Error(passwordError)

    const email = input.email.trim().toLowerCase()

    const existing = await this.getUserByEmail(email)
    if (existing) {
      throw new Error(
        'This email is already registered. Use a different email or the same password if you are re-adding an existing login.',
      )
    }

    const authUid = await resolveAuthUidForNewUser(email, input.password)

    const orgId = firestoreId('org')
    const userId = authUid
    const ts = isoNow()

    const org: Organization = {
      id: orgId,
      name: input.name,
      type: input.role,
      parentId: creator.orgId,
      location: input.location ?? '',
      contact: input.contact ?? '',
      ownerUserId: userId,
      createdAt: ts,
    }

    const user: User = {
      id: userId,
      authUid,
      email,
      name: input.name,
      role: input.role,
      status: 'approved',
      parentId: creator.userId,
      orgId,
      location: input.location,
      contact: input.contact,
      createdAt: ts,
      updatedAt: ts,
    }

    const batch = writeBatch(db())
    batch.set(doc(db(), COLLECTIONS.organizations, orgId), org)
    batch.set(doc(db(), COLLECTIONS.users, userId), user)
    await batch.commit()

    const { setLocalCredential } = await import('@/lib/db/local-credentials')
    setLocalCredential(email, input.password)

    return { user, loginEmail: email }
  }

  async approveUser(userId: string, approve: boolean): Promise<User> {
    const ref = doc(db(), COLLECTIONS.users, userId)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('User not found')

    const ts = isoNow()
    await updateDoc(ref, {
      status: approve ? 'approved' : 'rejected',
      updatedAt: ts,
    })

    return { id: snap.id, ...snap.data(), status: approve ? 'approved' : 'rejected', updatedAt: ts } as User
  }

  getProducts(): Product[] {
    return state().products
  }

  getStock(orgId: string): StockRecord[] {
    return state().stock.filter((s) => s.orgId === orgId)
  }

  getAllStock(): StockRecord[] {
    return state().stock
  }

  async uploadOpeningStock(
    session: AuthSession,
    rows: OpeningStockRow[],
  ): Promise<StockRecord[]> {
    if (session.role !== 'admin' && session.role !== 'distributor') {
      throw new Error('Only Factory or Distributor can upload stock from bill/Excel')
    }

    const updated: StockRecord[] = []
    const batch = writeBatch(db())
    const products = [...state().products]

    for (const row of rows) {
      if (!row.productName || row.quantity <= 0) continue

      let product = products.find(
        (p) => p.name.toLowerCase() === row.productName.toLowerCase(),
      )

      if (!product) {
        product = {
          id: firestoreId('prod'),
          sku: row.productName.toUpperCase().slice(0, 8),
          name: row.productName,
          category: 'General',
          unitPrice: 0,
          mrp: 0,
          caseLot: 1,
        }
        products.push(product)
        batch.set(doc(db(), COLLECTIONS.products, product.id), product)
      }

      const stkId = stockDocId(session.orgId, product.id)
      const existing = state().stock.find((s) => s.id === stkId)
      const quantity = (existing?.quantity ?? 0) + row.quantity
      const ts = isoNow()

      const record: StockRecord = {
        id: stkId,
        orgId: session.orgId,
        orgType: session.role,
        productId: product.id,
        productName: product.name,
        quantity,
        updatedAt: ts,
      }

      batch.set(doc(db(), COLLECTIONS.stock, stkId), record)
      updated.push(record)
    }

    await batch.commit()
    return updated
  }

  getShipments(filters?: {
    senderOrgId?: string
    receiverOrgId?: string
    status?: Shipment['status']
  }): Shipment[] {
    let list = [...state().shipments]
    if (filters?.senderOrgId) {
      list = list.filter((s) => s.senderOrgId === filters.senderOrgId)
    }
    if (filters?.receiverOrgId) {
      list = list.filter((s) => s.receiverOrgId === filters.receiverOrgId)
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status)
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  getShipment(shipmentId: string): Shipment | undefined {
    return state().shipments.find((s) => s.id === shipmentId)
  }

  async createShipment(
    session: AuthSession,
    input: CreateShipmentInput,
  ): Promise<Shipment> {
    const store = state()
    const receiverOrg = store.organizations.find((o) => o.id === input.receiverOrgId)
    const receiverUser = store.users.find((u) => u.orgId === input.receiverOrgId)

    if (!receiverOrg || !receiverUser) {
      throw new Error('Receiver not found')
    }

    if (!canShip(session.role, receiverOrg.type)) {
      throw new Error(`Invalid shipment route: ${session.role} → ${receiverOrg.type}`)
    }

    if (input.items.length === 0) {
      throw new Error('Add at least one product to the shipment')
    }

    for (const item of input.items) {
      const stock = store.stock.find(
        (s) => s.orgId === session.orgId && s.productId === item.productId,
      )
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productName}`)
      }
    }

    const shipmentId = firestoreId('shp')
    const shipmentNumber = `SHP-${Date.now().toString().slice(-6)}`
    const ts = isoNow()

    let invoiceStorageUrl: string | undefined
    let invoiceStoragePath: string | undefined

    if (input.invoiceDataUrl && input.invoiceFileName) {
      const uploaded = await uploadInvoiceFromDataUrl(
        shipmentId,
        input.invoiceFileName,
        input.invoiceDataUrl,
      )
      invoiceStorageUrl = uploaded.downloadUrl
      invoiceStoragePath = uploaded.storagePath
    }

    const shipment: Shipment = {
      id: shipmentId,
      shipmentNumber,
      invoiceNumber: input.invoiceNumber,
      invoiceFileName: input.invoiceFileName,
      invoiceStorageUrl,
      invoiceStoragePath,
      senderId: session.userId,
      senderOrgId: session.orgId,
      senderName: session.name,
      senderRole: session.role,
      receiverId: receiverUser.id,
      receiverOrgId: receiverOrg.id,
      receiverName: receiverOrg.name,
      receiverRole: receiverOrg.type,
      items: input.items,
      notes: input.notes,
      status: 'sent',
      createdAt: ts,
      updatedAt: ts,
    }

    const itemsSummary = input.items
      .map((i) => `${i.quantity} ${i.productName}`)
      .join('\n')

    const notification: AppNotification = {
      id: firestoreId('notif'),
      userId: receiverUser.id,
      orgId: receiverOrg.id,
      title: `New shipment ${input.invoiceNumber}`,
      message: `${session.name} sent shipment ${input.invoiceNumber}:\n${itemsSummary}`,
      shipmentId,
      read: false,
      type: 'shipment',
      createdAt: ts,
    }

    const batch = writeBatch(db())
    batch.set(doc(db(), COLLECTIONS.shipments, shipmentId), shipment)
    batch.set(doc(db(), COLLECTIONS.notifications, notification.id), notification)
    await batch.commit()

    return shipment
  }

  async receiveShipment(session: AuthSession, shipmentId: string): Promise<Shipment> {
    const firestore = db()

    return runTransaction(firestore, async (tx) => {
      const shipmentRef = doc(firestore, COLLECTIONS.shipments, shipmentId)
      const shipmentSnap = await tx.get(shipmentRef)

      if (!shipmentSnap.exists()) throw new Error('Shipment not found')

      const shipment = { id: shipmentSnap.id, ...shipmentSnap.data() } as Shipment

      if (shipment.receiverOrgId !== session.orgId) {
        throw new Error('You are not the receiver of this shipment')
      }
      if (shipment.status === 'received') {
        throw new Error('Shipment already received')
      }

      const ts = isoNow()

      for (const item of shipment.items) {
        const senderStockId = stockDocId(shipment.senderOrgId, item.productId)
        const receiverStockId = stockDocId(shipment.receiverOrgId, item.productId)

        const senderRef = doc(firestore, COLLECTIONS.stock, senderStockId)
        const receiverRef = doc(firestore, COLLECTIONS.stock, receiverStockId)

        const senderSnap = await tx.get(senderRef)
        const senderQty = senderSnap.exists()
          ? (senderSnap.data() as StockRecord).quantity
          : 0

        tx.set(
          senderRef,
          {
            id: senderStockId,
            orgId: shipment.senderOrgId,
            orgType: shipment.senderRole,
            productId: item.productId,
            productName: item.productName,
            quantity: Math.max(0, senderQty - item.quantity),
            updatedAt: ts,
          },
          { merge: true },
        )

        const receiverSnap = await tx.get(receiverRef)
        const receiverQty = receiverSnap.exists()
          ? (receiverSnap.data() as StockRecord).quantity
          : 0

        tx.set(
          receiverRef,
          {
            id: receiverStockId,
            orgId: shipment.receiverOrgId,
            orgType: shipment.receiverRole,
            productId: item.productId,
            productName: item.productName,
            quantity: receiverQty + item.quantity,
            updatedAt: ts,
          },
          { merge: true },
        )
      }

      const updatedShipment: Shipment = {
        ...shipment,
        status: 'received',
        receivedAt: ts,
        updatedAt: ts,
      }
      tx.update(shipmentRef, {
        status: 'received',
        receivedAt: ts,
        updatedAt: ts,
      })

      const txRecord: TransactionHistory = {
        id: firestoreId('tx'),
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
        createdAt: ts,
      }
      tx.set(doc(firestore, COLLECTIONS.transactionHistory, txRecord.id), txRecord)

      const notif: AppNotification = {
        id: firestoreId('notif'),
        userId: shipment.senderId,
        orgId: shipment.senderOrgId,
        title: `Shipment ${shipment.invoiceNumber} received`,
        message: `${shipment.receiverName} confirmed receipt of ${shipment.invoiceNumber}`,
        shipmentId: shipment.id,
        read: false,
        type: 'success',
        createdAt: ts,
      }
      tx.set(doc(firestore, COLLECTIONS.notifications, notif.id), notif)

      return updatedShipment
    })
  }

  async rejectShipment(session: AuthSession, shipmentId: string): Promise<Shipment> {
    const shipmentRef = doc(db(), COLLECTIONS.shipments, shipmentId)
    const snap = await getDoc(shipmentRef)
    if (!snap.exists()) throw new Error('Shipment not found')

    const shipment = { id: snap.id, ...snap.data() } as Shipment
    if (shipment.receiverOrgId !== session.orgId) {
      throw new Error('You are not the receiver')
    }

    const ts = isoNow()
    await updateDoc(shipmentRef, { status: 'rejected', updatedAt: ts })
    return { ...shipment, status: 'rejected', updatedAt: ts }
  }

  getNotifications(userId: string): AppNotification[] {
    return state()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db(), COLLECTIONS.notifications, notificationId), {
      read: true,
    })
  }

  getTransactionHistory(): TransactionHistory[] {
    return [...state().transactionHistory].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
  }

  async getUserByAuthUid(authUid: string): Promise<User | null> {
    const direct = await getDoc(doc(db(), COLLECTIONS.users, authUid))
    if (direct.exists()) {
      return { id: direct.id, ...direct.data() } as User
    }

    const q = query(
      collection(db(), COLLECTIONS.users),
      where('authUid', '==', authUid),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as User
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase()
    const q = query(
      collection(db(), COLLECTIONS.users),
      where('email', '==', normalized),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as User
  }
}

export const electroTrackFirebaseService = new ElectroTrackFirebaseService()
