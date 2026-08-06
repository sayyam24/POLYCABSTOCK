import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'

export async function POST(req: Request) {
  const body = await req.json()
  const { orgId, productId, quantity } = body

  if (!orgId || !productId || quantity == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const state = await loadServerState()

    const existingStock = state.stock.find(
      (s) => s.orgId === orgId && s.productId === productId,
    )

    if (existingStock) {
      existingStock.quantity = quantity
      existingStock.updatedAt = new Date().toISOString()
    } else {
      const product = state.products.find((p) => p.id === productId)
      const organization = state.organizations.find((o) => o.id === orgId)

      if (!product || !organization) {
        return NextResponse.json(
          { error: 'Product or organization not found' },
          { status: 404 },
        )
      }

      state.stock.push({
        id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orgId,
        orgType: organization.type,
        productId,
        productName: product.name,
        quantity,
        updatedAt: new Date().toISOString(),
      })
    }

    await saveServerState(state)

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update stock' },
      { status: 503 },
    )
  }
}
