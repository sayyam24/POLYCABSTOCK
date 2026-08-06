import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'

export async function POST(req: Request) {
  const body = await req.json()
  const { orgId, quantity, orgName, orgType, items, actionType, referenceNumber, remarks } = body

  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing required field: orgId' },
      { status: 400 },
    )
  }

  try {
    const state = await loadServerState()
    
    // Handle bulk item-based stock update (for bulk invoice upload)
    if (items && Array.isArray(items)) {
      let organization = state.organizations.find((o) => o.id === orgId)
      
      for (const item of items) {
        const existingStock = state.stock.find(
          (s) => s.orgId === orgId && s.productId === item.productId
        )
        
        if (existingStock) {
          existingStock.quantity = Math.max(0, existingStock.quantity + item.quantity)
          existingStock.updatedAt = new Date().toISOString()
        } else if (item.quantity > 0) {
          // Only create new stock record if adding positive quantity
          const org = state.organizations.find((o) => o.id === orgId)
          state.stock.push({
            id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            orgId,
            orgType: org?.type || 'distributor',
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            updatedAt: new Date().toISOString(),
          })
        }
      }
      
      await saveServerState(state)
      return NextResponse.json({
        success: true,
        message: `Updated ${items.length} items`,
        updatedCount: items.length,
      })
    }
    
    // Handle legacy single quantity update
    if (quantity == null) {
      return NextResponse.json(
        { error: 'Missing quantity or items' },
        { status: 400 },
      )
    }
    
    const products = state.products || []

    let organization = state.organizations.find((o) => o.id === orgId)
    const organizationExisted = !!organization

    if (!organization) {
      const newOrg = {
        id: orgId,
        name: orgName || 'Factory',
        type: orgType || 'admin',
        location: 'Unknown',
        contact: 'Unknown',
        parentId: '',
        ownerUserId: '',
        createdAt: new Date().toISOString(),
      }
      state.organizations.push(newOrg as any)
      organization = newOrg
    }

    state.stock = state.stock.filter((s) => s.orgId !== orgId)

    const newStockRecords = products.map((product) => ({
      id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${product.id}`,
      orgId,
      orgType: organization?.type || 'admin',
      productId: product.id,
      productName: product.name,
      quantity,
      updatedAt: new Date().toISOString(),
    }))

    state.stock.push(...newStockRecords)
    await saveServerState(state)

    return NextResponse.json({
      success: true,
      message: `Updated ${newStockRecords.length} products to ${quantity} units each`,
      updatedCount: newStockRecords.length,
      organizationCreated: !organizationExisted,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to bulk update stock' },
      { status: 503 },
    )
  }
}
