import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'

export async function POST(req: Request) {
  const body = await req.json()
  const { invoiceNumber, senderOrgId, senderName, senderRole, receiverName, receiverRole, items, status } = body

  if (!invoiceNumber || !senderOrgId) {
    return NextResponse.json(
      { error: 'Missing required fields: invoiceNumber and senderOrgId' },
      { status: 400 },
    )
  }

  try {
    const state = await loadServerState()
    
    state.transactionHistory.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      shipmentId: '',
      invoiceNumber,
      senderOrgId,
      senderName,
      senderRole,
      receiverOrgId: '',
      receiverName,
      receiverRole,
      items: items || [],
      status: status || 'pending',
      createdAt: new Date().toISOString()
    })
    
    await saveServerState(state)

    return NextResponse.json({
      success: true,
      message: 'Transaction history entry added',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add transaction history' },
      { status: 500 },
    )
  }
}
