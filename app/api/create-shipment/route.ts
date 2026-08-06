import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    senderOrgId,
    senderRole,
    senderName,
    receiverOrgId,
    receiverRole,
    receiverName,
    items,
    invoiceNumber,
    invoiceFileName,
    invoiceDataUrl,
  } = body

  if (!senderOrgId || !receiverOrgId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Allow empty items array for PDF-only shipments (historical tracking)
  const shipmentItems = items || []

  try {
    const state = await loadServerState()

    const receiverOrg = state.organizations.find((o) => o.id === receiverOrgId)
    if (!receiverOrg) {
      return NextResponse.json(
        { error: 'Receiver organization not found' },
        { status: 404 },
      )
    }

    const shipment = {
      id: `ship_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      shipmentNumber: invoiceNumber || `INV-${Date.now()}`,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      senderOrgId,
      senderRole,
      senderName,
      senderId: body.senderId || null,
      receiverOrgId,
      receiverRole,
      receiverName,
      receiverId: body.receiverId || null,
      items: shipmentItems.map((item: { productId: string; productName: string; quantity: number }) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
      })),
      invoiceFileName,
      invoiceDataUrl,
      status: 'sent' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Only deduct stock if there are items (skip for PDF-only historical shipments)
    for (const item of shipment.items) {
      const existingStock = state.stock.find(
        (s) => s.orgId === senderOrgId && s.productId === item.productId,
      )
      if (existingStock) {
        existingStock.quantity -= item.quantity
        existingStock.updatedAt = new Date().toISOString()
      } else {
        state.stock.push({
          id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          orgId: senderOrgId,
          orgType: senderRole,
          productId: item.productId,
          productName: item.productName,
          quantity: -item.quantity,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    state.shipments.push(shipment)
    await saveServerState(state)

    return NextResponse.json({
      success: true,
      shipment,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create shipment' },
      { status: 503 },
    )
  }
}
