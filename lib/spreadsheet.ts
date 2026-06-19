import type { OpeningStockRow, Product, ShipmentItem } from '@/lib/types'

function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((s) => s.trim())
  return line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
}

/** Parse CSV / Excel-exported text: Product, Quantity (header row optional) */
export function parseOpeningStockRows(text: string): OpeningStockRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []

  const start =
    lines[0].toLowerCase().includes('product') ||
    lines[0].toLowerCase().includes('item')
      ? 1
      : 0

  const rows: OpeningStockRow[] = []
  for (let i = start; i < lines.length; i++) {
    const parts = splitLine(lines[i])
    if (parts.length < 2) continue
    const productName = parts[0]
    const quantity = Number(parts[1]) || 0
    if (productName && quantity > 0) {
      rows.push({ productName, quantity })
    }
  }
  return rows
}

/** Parse bill/Excel lines into shipment items matched to catalog */
export function parseShipmentItemsFromSpreadsheet(
  text: string,
  products: Product[],
): ShipmentItem[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []

  const start =
    lines[0].toLowerCase().includes('product') ||
    lines[0].toLowerCase().includes('item')
      ? 1
      : 0

  const items: ShipmentItem[] = []
  for (let i = start; i < lines.length; i++) {
    const parts = splitLine(lines[i])
    if (parts.length < 2) continue
    const name = parts[0]
    const quantity = Number(parts[1]) || 0
    if (!name || quantity <= 0) continue

    const product = products.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    )
    items.push({
      productId: product?.id ?? '',
      productName: product?.name ?? name,
      quantity,
    })
  }
  return items.filter((i) => i.productName && i.quantity > 0)
}
