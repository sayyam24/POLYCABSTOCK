import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import type { ShipmentStatus } from '@/lib/types'

export async function POST(req: Request) {
  const body = await req.json()
  const { shipmentId, receiverOrgId, parsedItems } = body

  if (!shipmentId || !receiverOrgId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const state = await loadServerState()

    const shipment = state.shipments.find((s) => s.id === shipmentId)
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    if (shipment.receiverOrgId !== receiverOrgId) {
      return NextResponse.json(
        { error: 'You are not the receiver of this shipment' },
        { status: 403 },
      )
    }

    if (shipment.status === 'received') {
      return NextResponse.json(
        { error: 'Shipment already received' },
        { status: 400 },
      )
    }

    // Use parsed items if provided, otherwise use shipment items
    const itemsToProcess = parsedItems || shipment.items

    for (const item of itemsToProcess) {
      const existingStock = state.stock.find(
        (s) => s.orgId === receiverOrgId && s.productId === item.productId,
      )
      if (existingStock) {
        existingStock.quantity += item.quantity
        existingStock.updatedAt = new Date().toISOString()
      } else {
        const receiverOrg = state.organizations.find((o) => o.id === receiverOrgId)
        state.stock.push({
          id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          orgId: receiverOrgId,
          orgType: receiverOrg?.type || 'distributor',
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    shipment.status = 'received' as ShipmentStatus
    shipment.receivedAt = new Date().toISOString()
    shipment.updatedAt = new Date().toISOString()

    await saveServerState(state)

    return NextResponse.json({
      success: true,
      message: 'Shipment received and stock updated',
      shipment,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to receive shipment' },
      { status: 503 },
    )
  }
}
