import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/config'
import { COLLECTIONS } from '@/lib/firebase/collections'
import {
  disableCloudFirestore,
  isPermissionDeniedError,
} from '@/lib/firebase/runtime'
import { setDataStore } from '@/lib/store/data-store'
import type {
  AppNotification,
  Organization,
  Product,
  Shipment,
  StockRecord,
  TransactionHistory,
  User,
} from '@/lib/types'

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function subscribeFirestoreData(): Unsubscribe {
  const auth = getFirebaseAuth()
  if (!auth?.currentUser) {
    disableCloudFirestore('No Firebase auth — using local demo data')
    setDataStore({ isHydrated: true })
    return () => {}
  }

  const db = getFirebaseDb()
  if (!db) {
    setDataStore({ isHydrated: true })
    return () => {}
  }

  const unsubs: Unsubscribe[] = []
  let pending = 7
  let hydrated = false

  const markReady = () => {
    pending -= 1
    if (pending <= 0 && !hydrated) {
      hydrated = true
      setDataStore({ isHydrated: true })
    }
  }

  const onError = (label: string, err: Error) => {
    console.error(`Firestore listener (${label}):`, err.message)
    if (isPermissionDeniedError(err)) {
      disableCloudFirestore()
    }
    markReady()
  }

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.users),
      (snap) => {
        setDataStore({
          users: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User),
        })
        markReady()
      },
      (err) => onError('users', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.organizations),
      (snap) => {
        setDataStore({
          organizations: snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Organization,
          ),
        })
        markReady()
      },
      (err) => onError('organizations', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.products),
      (snap) => {
        setDataStore({
          products: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
        })
        markReady()
      },
      (err) => onError('products', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.stock),
      (snap) => {
        setDataStore({
          stock: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StockRecord),
        })
        markReady()
      },
      (err) => onError('stock', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.shipments),
      (snap) => {
        setDataStore({
          shipments: sortByCreatedAtDesc(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Shipment),
          ),
        })
        markReady()
      },
      (err) => onError('shipments', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.notifications),
      (snap) => {
        setDataStore({
          notifications: sortByCreatedAtDesc(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification),
          ),
        })
        markReady()
      },
      (err) => onError('notifications', err),
    ),
  )

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.transactionHistory),
      (snap) => {
        setDataStore({
          transactionHistory: sortByCreatedAtDesc(
            snap.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as TransactionHistory,
            ),
          ),
        })
        markReady()
      },
      (err) => onError('transaction_history', err),
    ),
  )

  return () => unsubs.forEach((u) => u())
}
