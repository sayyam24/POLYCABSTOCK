import type { DatabaseState } from '@/lib/db/local-db'

export interface DemoAnalytics {
  totalStockUnits: number
  pendingShipments: number
  lowStockAlerts: number
  totalUsers: number
  distributorCount: number
  retailerCount: number
  recentTransactions: number
  fastMovingProducts: { name: string; quantity: number }[]
  stockByRole: { role: string; units: number }[]
  weeklyTransfers: { name: string; transfers: number }[]
}

export function computeDemoAnalytics(state: DatabaseState): DemoAnalytics {
  const totalStockUnits = state.stock.reduce((s, r) => s + r.quantity, 0)

  const pendingShipments = state.shipments.filter(
    (s) => s.status === 'sent' || s.status === 'in_transit',
  ).length

  const lowStockAlerts = state.notifications.filter((n) => n.type === 'warning').length

  const distributorCount = state.users.filter((u) => u.role === 'distributor').length
  const retailerCount = state.users.filter((u) => u.role === 'retailer').length

  const weekAgo = Date.now() - 7 * 86400000
  const recentTransactions = state.transactionHistory.filter(
    (t) => new Date(t.createdAt).getTime() >= weekAgo,
  ).length

  const productMove = new Map<string, number>()
  for (const tx of state.transactionHistory) {
    for (const item of tx.items) {
      productMove.set(
        item.productName,
        (productMove.get(item.productName) ?? 0) + item.quantity,
      )
    }
  }
  const fastMovingProducts = [...productMove.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const roleUnits = new Map<string, number>()
  for (const s of state.stock) {
    roleUnits.set(s.orgType, (roleUnits.get(s.orgType) ?? 0) + s.quantity)
  }
  const stockByRole = [...roleUnits.entries()].map(([role, units]) => ({
    role,
    units,
  }))

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weeklyTransfers = dayNames.map((name, dayIndex) => {
    const transfers = state.shipments.filter((s) => {
      const d = new Date(s.createdAt).getDay()
      return d === dayIndex && new Date(s.createdAt).getTime() >= weekAgo
    }).length
    return { name, transfers }
  })

  return {
    totalStockUnits,
    pendingShipments,
    lowStockAlerts,
    totalUsers: state.users.length,
    distributorCount,
    retailerCount,
    recentTransactions,
    fastMovingProducts,
    stockByRole,
    weeklyTransfers,
  }
}
