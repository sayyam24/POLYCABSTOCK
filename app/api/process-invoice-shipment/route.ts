import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      invoiceData, 
      matchedItems, 
      senderOrgId, 
      senderRole,
      receiverOrgId,
      receiverRole 
    } = body

    // Check for duplicate invoice
    const checkRes = await fetch('/api/check-duplicate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceNumber: invoiceData.invoice_number })
    })
    const checkData = await checkRes.json()
    
    if (checkData.isDuplicate) {
      return NextResponse.json(
        { error: 'Duplicate invoice number', existingShipment: checkData.existingShipment },
        { status: 409 }
      )
    }

    // Get current state
    const { getMongoState, saveMongoState } = await import('@/lib/db/mongo-state')
    const state = await getMongoState()

    // Verify sender has enough stock
    for (const item of matchedItems) {
      const senderStock = state.stock.find(
        (s: any) => s.orgId === senderOrgId && s.productId === item.matched_product_id
      )
      
      if (!senderStock || senderStock.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${item.product_name}` },
          { status: 400 }
        )
      }
    }

    // Deduct stock from sender
    for (const item of matchedItems) {
      const senderStockIndex = state.stock.findIndex(
        (s: any) => s.orgId === senderOrgId && s.productId === item.matched_product_id
      )
      
      if (senderStockIndex !== -1) {
        state.stock[senderStockIndex].quantity -= item.quantity
        state.stock[senderStockIndex].updatedAt = new Date().toISOString()
      }
    }

    // Add stock to receiver (if not retailer - retailers don't hold stock in this system)
    if (receiverRole !== 'retailer') {
      for (const item of matchedItems) {
        const receiverStockIndex = state.stock.findIndex(
          (s: any) => s.orgId === receiverOrgId && s.productId === item.matched_product_id
        )
        
        if (receiverStockIndex !== -1) {
          state.stock[receiverStockIndex].quantity += item.quantity
          state.stock[receiverStockIndex].updatedAt = new Date().toISOString()
        } else {
          state.stock.push({
            id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            orgId: receiverOrgId,
            orgType: receiverRole,
            productId: item.matched_product_id,
            productName: item.product_name,
            quantity: item.quantity,
            updatedAt: new Date().toISOString()
          })
        }
      }
    }

    // Create retailer purchase records if receiver is retailer
    if (receiverRole === 'retailer') {
      const purchaseRecords = state.retailerPurchases || []
      
      for (const item of matchedItems) {
        purchaseRecords.push({
          id: `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          invoiceNumber: invoiceData.invoice_number,
          invoiceDate: invoiceData.invoice_date,
          retailerOrgId: receiverOrgId,
          retailerName: invoiceData.retailer_name,
          senderOrgId: senderOrgId,
          senderRole: senderRole,
          productId: item.matched_product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          createdAt: new Date().toISOString()
        })
      }
      
      state.retailerPurchases = purchaseRecords
    }

    // Create shipment record
    const shipment = {
      id: `shipment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      shipmentNumber: `SHP-${Date.now()}`,
      invoiceNumber: invoiceData.invoice_number,
      invoiceFileName: `${invoiceData.invoice_number}.pdf`,
      senderId: state.users.find((u: any) => u.orgId === senderOrgId)?.id || '',
      senderOrgId,
      senderName: state.organizations.find((o: any) => o.id === senderOrgId)?.name || '',
      senderRole,
      receiverId: state.users.find((u: any) => u.orgId === receiverOrgId)?.id || '',
      receiverOrgId,
      receiverName: state.organizations.find((o: any) => o.id === receiverOrgId)?.name || '',
      receiverRole,
      items: matchedItems.map((item: any) => ({
        productId: item.matched_product_id,
        productName: item.product_name,
        quantity: item.quantity
      })),
      status: receiverRole === 'retailer' ? 'received' : 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    state.shipments.push(shipment)

    // Add to transaction history
    state.transactionHistory.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      shipmentId: shipment.id,
      invoiceNumber: invoiceData.invoice_number,
      senderOrgId,
      senderName: shipment.senderName,
      senderRole,
      receiverOrgId,
      receiverName: shipment.receiverName,
      receiverRole,
      items: shipment.items,
      status: shipment.status,
      createdAt: new Date().toISOString()
    })

    // Save state
    await saveMongoState(state)

    return NextResponse.json({
      success: true,
      shipment,
      message: receiverRole === 'retailer' 
        ? 'Invoice processed and retailer purchase records created' 
        : 'Invoice processed and stock transferred'
    })

  } catch (error) {
    console.error('Invoice shipment processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process invoice shipment' },
      { status: 500 }
    )
  }
}
