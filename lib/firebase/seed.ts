import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase/config'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { createSeedDatabase } from '@/lib/db/local-db'
import { isCloudFirestoreActive, isPermissionDeniedError } from '@/lib/firebase/runtime'

/**
 * Seeds only the product catalog when empty.
 * Users (Depo, Distributor, etc.) must be created by Admin with email + password.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  if (!isFirebaseConfigured() || !isCloudFirestoreActive()) return false

  const db = getFirebaseDb()
  if (!db) return false

  const auth = getFirebaseAuth()
  if (!auth?.currentUser) return false

  let productsSnap
  try {
    productsSnap = await getDocs(collection(db, COLLECTIONS.products))
  } catch (err) {
    if (isPermissionDeniedError(err)) return false
    throw err
  }

  if (!productsSnap.empty) return false

  const seed = createSeedDatabase()
  const batch = writeBatch(db)

  for (const product of seed.products) {
    batch.set(doc(db, COLLECTIONS.products, product.id), product)
  }

  await batch.commit()
  return true
}
