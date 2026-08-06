import { NextResponse } from 'next/server'
import { getMongoState, saveMongoState } from '@/lib/db/mongo-state'
import type { UserRole } from '@/lib/types'

export async function POST() {
  try {
    const state = await getMongoState()
    
    const orgId = 'org_1782635820575_ddm0vbo'
    const orgName = "vsdvsfvsd's Organization"
    const orgType: UserRole = 'retailer'
    
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
      parentId: 'org_dist1', // Set as child of North Distributor
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
      message: `Added organization ${orgName} and created ${newStockRecords.length} stock records`
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 }
    )
  }
}

export async function GET() {
  return POST()
}
