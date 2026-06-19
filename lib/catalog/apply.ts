import type { DatabaseState } from '@/lib/db/local-db'
import {
  getCatalogProducts,
  PRODUCT_CATALOG_VERSION,
} from '@/lib/catalog/products'

const VERSION_KEY = 'electrotrack_catalog_version'

export function getInstalledCatalogVersion(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(VERSION_KEY)
}

export function setInstalledCatalogVersion(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(VERSION_KEY, PRODUCT_CATALOG_VERSION)
}

/** Replace all products; clear stock tied to old SKUs (shipments unchanged). */
export function applyProductCatalogToState(state: DatabaseState): DatabaseState {
  return {
    ...state,
    products: getCatalogProducts(),
    stock: [],
  }
}

export function needsCatalogMigration(): boolean {
  return getInstalledCatalogVersion() !== PRODUCT_CATALOG_VERSION
}

export function migrateLocalDatabaseIfNeeded(state: DatabaseState): DatabaseState {
  if (!needsCatalogMigration()) return state
  const next = applyProductCatalogToState(state)
  setInstalledCatalogVersion()
  return next
}
