import { NextResponse } from 'next/server'
import { getMongoState, saveMongoState } from '@/lib/db/mongo-state'

export async function POST(req: Request) {
  const body = await req.json()
  const { orgId, orgName, orgType } = body

  if (!orgId || !orgName || !orgType) {
    return NextResponse.json({ error: 'Missing orgId, orgName, or orgType' }, { status: 400 })
  }

  try {
    const state = await getMongoState()
    
    // Check if organization already exists
    const existingOrg = state.organizations.find((o: any) => o.id === orgId)
    if (existingOrg) {
      return NextResponse.json({ error: 'Organization already exists' }, { status: 400 })
    }

    // Add organization
    const newOrg = {
      id: orgId,
      name: orgName,
      type: orgType,
      parentId: null, // Will need to be set based on hierarchy
      location: '',
      contact: '',
      ownerUserId: '',
      createdAt: new Date().toISOString()
    }
    state.organizations.push(newOrg)

    // Create stock records for all products for this organization
    const newStockRecords = state.products.map((product: any) => ({
      id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orgId: orgId,
      orgType: orgType,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 0,
      updatedAt: new Date().toISOString()
    }))

    state.stock.push(...newStockRecords)

    await saveMongoState(state)

    return NextResponse.json({ 
      success: true, 
      organization: newOrg,
      stockRecordsCreated: newStockRecords.length,
      message: `Added organization and created ${newStockRecords.length} stock records`
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 }
    )
  }
}
