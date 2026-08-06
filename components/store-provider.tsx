'use client'

import * as React from 'react'
import type {
  AppNotification,
  Shipment,
  StockRecord,
  TransactionHistory,
  User,
} from '@/lib/types'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { subscribeFirestoreData } from '@/lib/firebase/listeners'
import { seedFirestoreIfEmpty } from '@/lib/firebase/seed'
import { isCloudFirestoreActive } from '@/lib/firebase/runtime'
import {
  getDataStore,
  resetDataStore,
  setDataStore,
  subscribeDataStore,
} from '@/lib/store/data-store'
import { loadDatabase } from '@/lib/db/local-db'
import { ensureDemoOnStartup } from '@/lib/demo/persist'
import { isDemoEmail } from '@/lib/auth'
import { useAuth } from '@/components/auth-provider'
import type { DatabaseState } from '@/lib/db/local-db'
import { DB_KEY } from '@/lib/db/local-db'

interface StoreContextValue {
  version: number
  isReady: boolean
  refresh: () => void
  users: User[]
  stock: StockRecord[]
  shipments: Shipment[]
  notifications: AppNotification[]
  transactions: TransactionHistory[]
  getOrgStock: (orgId: string) => StockRecord[]
  getIncomingShipments: (orgId: string) => Shipment[]
  getOutgoingShipments: (orgId: string) => Shipment[]
  getProducts: () => any[]
}

const StoreContext = React.createContext<StoreContextValue | null>(null)

function hydrateLocalStore() {
  const local = loadDatabase()
  setDataStore({
    users: local.users,
    organizations: local.organizations,
    products: local.products,
    stock: local.stock,
    shipments: local.shipments,
    notifications: local.notifications,
    transactionHistory: local.transactionHistory,
    returns: local.returns ?? [],
    isHydrated: true,
  })
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth()
  const [version, setVersion] = React.useState(0)
  const [isReady, setIsReady] = React.useState(false)

  const refresh = React.useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  React.useEffect(() => {
    const bump = () => setVersion((v) => v + 1)

    if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
      let cancelled = false

      const hydrateFromMongo = async () => {
        try {
          const res = await fetch('/api/state', { cache: 'no-store' })
          if (!res.ok) throw new Error(`Failed to load DB (${res.status})`)
          const db = (await res.json()) as DatabaseState
          if (cancelled) return
          localStorage.setItem(DB_KEY, JSON.stringify(db))
          setDataStore({
            users: db.users,
            organizations: db.organizations,
            products: db.products,
            stock: db.stock,
            shipments: db.shipments,
            notifications: db.notifications,
            transactionHistory: db.transactionHistory,
            returns: db.returns ?? [],
            isHydrated: true,
          })
          setIsReady(true)
          bump()
        } catch (err) {
          console.error('Mongo hydrate failed:', err)
          if (!cancelled) {
            setIsReady(true)
            bump()
          }
        }
      }

      void hydrateFromMongo()
      const interval = setInterval(() => void hydrateFromMongo(), 5000)

      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }

    if (!isFirebaseConfigured()) {
      void ensureDemoOnStartup().then(() => {
        hydrateLocalStore()
        setIsReady(true)
        bump()
      })
      return subscribeDataStore(bump)
    }

    if (authLoading) return

    if (!session) {
      resetDataStore()
      queueMicrotask(() => setIsReady(true))
      return
    }

    if (isDemoEmail(session.email) || !isCloudFirestoreActive()) {
      void ensureDemoOnStartup().then(() => {
        hydrateLocalStore()
        setIsReady(true)
        bump()
      })
      return subscribeDataStore(bump)
    }

    let unsubFirestore: (() => void) | undefined
    let cancelled = false

    void (async () => {
      try {
        if (session.role === 'admin') {
          await seedFirestoreIfEmpty()
        }
      } catch (err) {
        console.error('Firestore seed failed:', err)
      }
      if (cancelled || !isCloudFirestoreActive()) return
      unsubFirestore = subscribeFirestoreData()
    })()

    const unsubStore = subscribeDataStore(() => {
      bump()
      if (getDataStore().isHydrated) setIsReady(true)
    })

    return () => {
      cancelled = true
      unsubFirestore?.()
      unsubStore()
    }
  }, [session, authLoading])

  const data = getDataStore()

  const value = React.useMemo<StoreContextValue>(() => {
    void version
    // When MongoDB is enabled and data store is hydrated, use data store directly
    if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo' && data.isHydrated) {
      return {
        version,
        isReady,
        refresh,
        users: data.users,
        stock: data.stock,
        shipments: data.shipments,
        notifications: data.notifications,
        transactions: data.transactionHistory,
        getOrgStock: (orgId) => data.stock.filter(s => s.orgId === orgId),
        getIncomingShipments: (orgId) => data.shipments.filter(s => s.receiverOrgId === orgId),
        getOutgoingShipments: (orgId) => data.shipments.filter(s => s.senderOrgId === orgId),
        getProducts: () => data.products,
      }
    }
    // Otherwise fall back to service
    return {
      version,
      isReady,
      refresh,
      users: data.users.length ? data.users : electroTrackService.getUsers(),
      stock: data.stock.length ? data.stock : electroTrackService.getAllStock(),
      shipments: data.shipments.length
        ? data.shipments
        : electroTrackService.getShipments(),
      notifications: data.notifications,
      transactions: data.transactionHistory.length
        ? data.transactionHistory
        : electroTrackService.getTransactionHistory(),
      getOrgStock: (orgId) => electroTrackService.getStock(orgId),
      getIncomingShipments: (orgId) =>
        electroTrackService.getShipments({ receiverOrgId: orgId }),
      getOutgoingShipments: (orgId) =>
        electroTrackService.getShipments({ senderOrgId: orgId }),
      getProducts: () => data.products.length ? data.products : electroTrackService.getProducts(),
    }
  }, [version, refresh, isReady, data])

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useUserNotifications(userId: string | undefined) {
  const { version } = useStore()
  void version
  return userId ? electroTrackService.getNotifications(userId) : []
}
