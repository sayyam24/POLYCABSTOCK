import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { invoiceNumber } = body

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: 'Invoice number is required' },
        { status: 400 }
      )
    }

    // Check against existing shipments in MongoDB
    const { getMongoState } = await import('@/lib/db/mongo-state')
    const state = await getMongoState()

    const existingShipment = state.shipments.find(
      (s: any) => s.invoiceNumber === invoiceNumber
    )

    if (existingShipment) {
      return NextResponse.json({
        isDuplicate: true,
        existingShipment: {
          id: existingShipment.id,
          invoiceNumber: existingShipment.invoiceNumber,
          senderName: existingShipment.senderName,
          receiverName: existingShipment.receiverName,
          status: existingShipment.status,
          createdAt: existingShipment.createdAt
        }
      })
    }

    return NextResponse.json({
      isDuplicate: false
    })

  } catch (error) {
    console.error('Duplicate invoice check error:', error)
    return NextResponse.json(
      { error: 'Failed to check duplicate invoice' },
      { status: 500 }
    )
  }
}
