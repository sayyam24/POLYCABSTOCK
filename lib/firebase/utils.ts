export function firestoreId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function isoNow(): string {
  return new Date().toISOString()
}

/** Stock document id: one record per org + product */
export function stockDocId(orgId: string, productId: string): string {
  return `${orgId}__${productId}`
}
