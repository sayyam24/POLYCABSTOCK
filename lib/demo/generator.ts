import type { DatabaseState } from '@/lib/db/local-db'
import type {
  AppNotification,
  Organization,
  Product,
  Shipment,
  ShipmentItem,
  ShipmentStatus,
  StockRecord,
  TransactionHistory,
  User,
  UserRole,
} from '@/lib/types'
import {
  BUSINESS_PREFIXES,
  DEMO_COUNTS,
  DEMO_EMAIL_DOMAIN,
  DEMO_DATA_VERSION,
  DEMO_ID_PREFIX,
  DEMO_PRODUCT_CATALOG,
  INDIAN_CITIES,
  ROLE_SUFFIX,
} from '@/lib/demo/constants'
import { createRng, daysAgoIso, intBetween, pick } from '@/lib/demo/random'
import { stockDocId } from '@/lib/firebase/utils'

export interface DemoCredential {
  email: string
  password: string
  role: UserRole
  name: string
}

export interface GeneratedDemoData extends DatabaseState {
  credentials: DemoCredential[]
  meta: {
    version: string
    generatedAt: string
    counts: typeof DEMO_COUNTS
  }
}

interface OrgNode {
  org: Organization
  user: User
}

function demoId(kind: string, index: number): string {
  return `${DEMO_ID_PREFIX}_${kind}_${index}`
}

function tsAt(rng: () => number, offset = 0): string {
  const base = daysAgoIso(rng, 45 + offset)
  return base
}

export function generateDemoDataset(seed = 20260424): GeneratedDemoData {
  const rng = createRng(seed)
  const generatedAt = new Date().toISOString()
  const credentials: DemoCredential[] = []

  const products: Product[] = DEMO_PRODUCT_CATALOG.map((p, i) => ({
    ...p,
    id: demoId('prod', i + 1),
  }))

  const users: User[] = []
  const organizations: Organization[] = []

  const adminUser: User = {
    id: demoId('user', 0),
    email: 'admin@electrotrack.com',
    name: 'System Administrator',
    role: 'admin',
    status: 'approved',
    parentId: null,
    orgId: demoId('org', 0),
    location: 'Head Office',
    contact: '+91 98000 00000',
    createdAt: tsAt(rng),
    updatedAt: tsAt(rng),
  }
  users.push(adminUser)
  organizations.push({
    id: demoId('org', 0),
    name: 'ElectroTrack HQ',
    type: 'admin',
    parentId: null,
    location: 'Mumbai',
    contact: '+91 98000 00000',
    ownerUserId: adminUser.id,
    createdAt: tsAt(rng),
  })

  const depos: OrgNode[] = []
  for (let i = 1; i <= DEMO_COUNTS.depos; i++) {
    const city = INDIAN_CITIES[(i - 1) % INDIAN_CITIES.length]
    const prefix = pick(rng, BUSINESS_PREFIXES)
    const name = `${prefix} ${city} Depo`
    const email = `depo${i}@${DEMO_EMAIL_DOMAIN}`
    const orgId = demoId('org_depo', i)
    const userId = demoId('user_depo', i)

    const user: User = {
      id: userId,
      email,
      name,
      role: 'depo',
      status: 'approved',
      parentId: adminUser.id,
      orgId,
      location: city,
      contact: `+91 98${String(10000000 + i).slice(0, 8)}`,
      createdAt: tsAt(rng, i),
      updatedAt: tsAt(rng, i),
    }
    const org: Organization = {
      id: orgId,
      name,
      type: 'depo',
      parentId: null,
      location: `${city}, India`,
      contact: user.contact ?? '',
      ownerUserId: userId,
      createdAt: tsAt(rng, i),
    }
    users.push(user)
    organizations.push(org)
    depos.push({ org, user })
    credentials.push({ email, password: '', role: 'depo', name })
  }

  const distributors: OrgNode[] = []
  for (let i = 1; i <= DEMO_COUNTS.distributors; i++) {
    const parentDepo = depos[(i - 1) % depos.length]
    const city = pick(rng, INDIAN_CITIES)
    const prefix = pick(rng, BUSINESS_PREFIXES)
    const name = `${prefix} ${city} Distributors`
    const email = `distributor${i}@${DEMO_EMAIL_DOMAIN}`
    const orgId = demoId('org_dist', i)
    const userId = demoId('user_dist', i)

    const user: User = {
      id: userId,
      email,
      name,
      role: 'distributor',
      status: 'approved',
      parentId: parentDepo.user.id,
      orgId,
      location: city,
      contact: `+91 97${String(10000000 + i).slice(0, 8)}`,
      createdAt: tsAt(rng, i),
      updatedAt: tsAt(rng, i),
    }
    const org: Organization = {
      id: orgId,
      name,
      type: 'distributor',
      parentId: parentDepo.org.id,
      location: `${city}, India`,
      contact: user.contact ?? '',
      ownerUserId: userId,
      createdAt: tsAt(rng, i),
    }
    users.push(user)
    organizations.push(org)
    distributors.push({ org, user })
    credentials.push({ email, password: '', role: 'distributor', name })
  }

  const subDistributors: OrgNode[] = []
  for (let i = 1; i <= DEMO_COUNTS.subDistributors; i++) {
    const parentDist = distributors[(i - 1) % distributors.length]
    const city = pick(rng, INDIAN_CITIES)
    const prefix = pick(rng, BUSINESS_PREFIXES)
    const name = `${prefix} ${city} ${ROLE_SUFFIX.sub_distributor}`
    const email = `sub${i}@${DEMO_EMAIL_DOMAIN}`
    const orgId = demoId('org_sub', i)
    const userId = demoId('user_sub', i)

    const user: User = {
      id: userId,
      email,
      name,
      role: 'sub_distributor',
      status: 'approved',
      parentId: parentDist.user.id,
      orgId,
      location: city,
      contact: `+91 96${String(10000000 + i).slice(0, 8)}`,
      createdAt: tsAt(rng, i),
      updatedAt: tsAt(rng, i),
    }
    const org: Organization = {
      id: orgId,
      name,
      type: 'sub_distributor',
      parentId: parentDist.org.id,
      location: `${city}, India`,
      contact: user.contact ?? '',
      ownerUserId: userId,
      createdAt: tsAt(rng, i),
    }
    users.push(user)
    organizations.push(org)
    subDistributors.push({ org, user })
    credentials.push({ email, password: '', role: 'sub_distributor', name })
  }

  const retailers: OrgNode[] = []
  for (let i = 1; i <= DEMO_COUNTS.retailers; i++) {
    const parentSub = subDistributors[(i - 1) % subDistributors.length]
    const city = pick(rng, INDIAN_CITIES)
    const prefix = pick(rng, BUSINESS_PREFIXES)
    const name = `${prefix} ${city} Retail`
    const email = `retail${i}@${DEMO_EMAIL_DOMAIN}`
    const orgId = demoId('org_retail', i)
    const userId = demoId('user_retail', i)

    const user: User = {
      id: userId,
      email,
      name,
      role: 'retailer',
      status: 'approved',
      parentId: parentSub.user.id,
      orgId,
      location: city,
      contact: `+91 95${String(10000000 + i).slice(0, 8)}`,
      createdAt: tsAt(rng, i),
      updatedAt: tsAt(rng, i),
    }
    const org: Organization = {
      id: orgId,
      name,
      type: 'retailer',
      parentId: parentSub.org.id,
      location: `${city}, India`,
      contact: user.contact ?? '',
      ownerUserId: userId,
      createdAt: tsAt(rng, i),
    }
    users.push(user)
    organizations.push(org)
    retailers.push({ org, user })
    credentials.push({ email, password: '', role: 'retailer', name })
  }

  const stockMap = new Map<string, Map<string, number>>()

  function ensureOrg(orgId: string) {
    if (!stockMap.has(orgId)) stockMap.set(orgId, new Map())
    return stockMap.get(orgId)!
  }

  function addStock(orgId: string, productId: string, qty: number) {
    const m = ensureOrg(orgId)
    m.set(productId, (m.get(productId) ?? 0) + qty)
  }

  function transferStock(
    fromOrgId: string,
    toOrgId: string,
    items: ShipmentItem[],
  ) {
    for (const item of items) {
      const from = ensureOrg(fromOrgId)
      const to = ensureOrg(toOrgId)
      from.set(item.productId, Math.max(0, (from.get(item.productId) ?? 0) - item.quantity))
      to.set(item.productId, (to.get(item.productId) ?? 0) + item.quantity)
    }
  }

  for (const depo of depos) {
    for (const product of products) {
      let qty = intBetween(rng, 80, 200)
      if (product.category === 'Fans') qty = intBetween(rng, 400, 600)
      if (product.name.includes('LED Bulb')) qty = intBetween(rng, 300, 500)
      if (product.category === 'Lighting') qty = intBetween(rng, 200, 400)
      addStock(depo.org.id, product.id, qty)
    }
  }

  const shipments: Shipment[] = []
  const notifications: AppNotification[] = []
  const transactionHistory: TransactionHistory[] = []
  let invoiceSeq = 1
  let notifSeq = 1
  let txSeq = 1
  let shpSeq = 1

  function randomItems(): ShipmentItem[] {
    const count = intBetween(rng, 2, 5)
    const picked = new Set<number>()
    const items: ShipmentItem[] = []
    while (items.length < count) {
      const idx = intBetween(rng, 0, products.length - 1)
      if (picked.has(idx)) continue
      picked.add(idx)
      const p = products[idx]
      items.push({
        productId: p.id,
        productName: p.name,
        quantity: intBetween(rng, 10, 120),
      })
    }
    return items
  }

  function createShipment(
    sender: OrgNode,
    receiver: OrgNode,
    status: ShipmentStatus,
  ): Shipment {
    const items = randomItems()
    const createdAt = daysAgoIso(rng, 30)
    const updatedAt =
      status === 'received'
        ? new Date(new Date(createdAt).getTime() + intBetween(rng, 1, 5) * 86400000).toISOString()
        : createdAt

    const shipment: Shipment = {
      id: demoId('shp', shpSeq++),
      shipmentNumber: `SHP-DEMO-${String(shpSeq).padStart(4, '0')}`,
      invoiceNumber: `INV-${String(invoiceSeq++).padStart(5, '0')}`,
      invoiceFileName: `invoice_${invoiceSeq}.pdf`,
      senderId: sender.user.id,
      senderOrgId: sender.org.id,
      senderName: sender.org.name,
      senderRole: sender.org.type,
      receiverId: receiver.user.id,
      receiverOrgId: receiver.org.id,
      receiverName: receiver.org.name,
      receiverRole: receiver.org.type,
      items,
      notes: rng() > 0.7 ? 'Handle with care — fragile items' : undefined,
      status,
      createdAt,
      updatedAt,
      receivedAt: status === 'received' ? updatedAt : undefined,
    }
    shipments.push(shipment)

    notifications.push({
      id: demoId('notif', notifSeq++),
      userId: receiver.user.id,
      orgId: receiver.org.id,
      title: `New shipment ${shipment.invoiceNumber}`,
      message: `${sender.org.name} sent:\n${items.map((i) => `${i.quantity} × ${i.productName}`).join('\n')}`,
      shipmentId: shipment.id,
      read: status === 'received',
      type: 'shipment',
      createdAt,
    })

    if (status === 'received') {
      transferStock(sender.org.id, receiver.org.id, items)
      transactionHistory.push({
        id: demoId('tx', txSeq++),
        shipmentId: shipment.id,
        invoiceNumber: shipment.invoiceNumber,
        senderOrgId: sender.org.id,
        senderName: sender.org.name,
        senderRole: sender.org.type,
        receiverOrgId: receiver.org.id,
        receiverName: receiver.org.name,
        receiverRole: receiver.org.type,
        items,
        status: 'received',
        createdAt: updatedAt,
      })
      notifications.push({
        id: demoId('notif', notifSeq++),
        userId: sender.user.id,
        orgId: sender.org.id,
        title: `Shipment ${shipment.invoiceNumber} received`,
        message: `${receiver.org.name} confirmed receipt.`,
        shipmentId: shipment.id,
        read: true,
        type: 'success',
        createdAt: updatedAt,
      })
    } else {
      notifications.push({
        id: demoId('notif', notifSeq++),
        userId: receiver.user.id,
        orgId: receiver.org.id,
        title: `Pending: ${shipment.invoiceNumber}`,
        message: `Please confirm receipt from ${sender.org.name}.`,
        shipmentId: shipment.id,
        read: false,
        type: 'info',
        createdAt,
      })
    }

    return shipment
  }

  for (const depo of depos) {
    const childDists = distributors.filter((d) => d.org.parentId === depo.org.id)
    for (const dist of childDists) {
      const n = intBetween(rng, 2, 3)
      for (let j = 0; j < n; j++) {
        createShipment(depo, dist, rng() > 0.25 ? 'received' : 'sent')
      }
    }
  }

  for (const dist of distributors) {
    const childSubs = subDistributors.filter((s) => s.org.parentId === dist.org.id)
    for (const sub of childSubs) {
      const n = intBetween(rng, 1, 2)
      for (let j = 0; j < n; j++) {
        createShipment(dist, sub, rng() > 0.3 ? 'received' : 'sent')
      }
    }
  }

  for (const sub of subDistributors) {
    const childRetail = retailers.filter((r) => r.org.parentId === sub.org.id)
    for (const retail of childRetail.slice(0, intBetween(rng, 2, 3))) {
      createShipment(sub, retail, rng() > 0.35 ? 'received' : 'sent')
    }
  }

  const allOrgs = [...depos, ...distributors, ...subDistributors, ...retailers]
  for (const node of allOrgs) {
    const orgStock = stockMap.get(node.org.id)
    if (!orgStock) continue
    for (const [productId, qty] of orgStock) {
      if (qty > 0 && qty < 25 && rng() > 0.5) {
        const product = products.find((p) => p.id === productId)!
        notifications.push({
          id: demoId('notif', notifSeq++),
          userId: node.user.id,
          orgId: node.org.id,
          title: `Low stock: ${product.name}`,
          message: `Only ${qty} units left. Consider reordering.`,
          read: false,
          type: 'warning',
          createdAt: daysAgoIso(rng, 3),
        })
      }
    }
  }

  const stock: StockRecord[] = []
  const updatedAt = generatedAt
  for (const [orgId, productQty] of stockMap) {
    const org = organizations.find((o) => o.id === orgId)
    if (!org) continue
    for (const [productId, quantity] of productQty) {
      if (quantity <= 0) continue
      const product = products.find((p) => p.id === productId)!
      stock.push({
        id: stockDocId(orgId, productId),
        orgId,
        orgType: org.type,
        productId,
        productName: product.name,
        quantity,
        updatedAt,
      })
    }
  }

  shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  transactionHistory.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    users,
    organizations,
    products,
    stock,
    shipments,
    returns: [],
    notifications,
    transactionHistory,
    credentials,
    meta: {
      version: DEMO_DATA_VERSION,
      generatedAt,
      counts: DEMO_COUNTS,
    },
  }
}
