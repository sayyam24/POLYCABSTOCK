import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getFirebaseStorage } from '@/lib/firebase/config'

const INVOICE_PREFIX = 'invoices'

export async function uploadInvoiceFile(
  shipmentId: string,
  fileName: string,
  file: Blob | File,
): Promise<{ storagePath: string; downloadUrl: string }> {
  const storage = getFirebaseStorage()
  if (!storage) {
    throw new Error('Firebase Storage is not configured')
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${INVOICE_PREFIX}/${shipmentId}/${Date.now()}_${safeName}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file instanceof File ? file.type : undefined,
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { storagePath, downloadUrl }
}

/** Upload from a data URL produced by FileReader in the shipment form */
export async function uploadInvoiceFromDataUrl(
  shipmentId: string,
  fileName: string,
  dataUrl: string,
): Promise<{ storagePath: string; downloadUrl: string }> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return uploadInvoiceFile(shipmentId, fileName, blob)
}

export async function deleteInvoiceFile(storagePath: string): Promise<void> {
  const storage = getFirebaseStorage()
  if (!storage || !storagePath) return
  try {
    await deleteObject(ref(storage, storagePath))
  } catch {
    // File may already be removed
  }
}
