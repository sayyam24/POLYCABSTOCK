import { loadDatabase } from '@/lib/db/local-db'
import { setDataStore } from '@/lib/store/data-store'

let cloudFirestoreActive = true
let warned = false

export function isCloudFirestoreActive(): boolean {
  return cloudFirestoreActive
}

export function isPermissionDeniedError(error: unknown): boolean {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : ''
  const message = error instanceof Error ? error.message : String(error)
  return (
    code === 'permission-denied' ||
    message.includes('permission-denied') ||
    message.includes('Missing or insufficient permissions')
  )
}

/** Switch to local DB when Firestore rules block the client (e.g. rules not deployed). */
export function disableCloudFirestore(reason?: string): void {
  if (!cloudFirestoreActive) return
  cloudFirestoreActive = false

  if (!warned) {
    warned = true
    console.warn(
      '[ElectroTrack] Firestore unavailable — using local demo data.',
      reason ?? 'Deploy firestore.rules in Firebase Console to enable cloud sync.',
    )
  }

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

export function resetCloudFirestoreState(): void {
  cloudFirestoreActive = true
  warned = false
}
