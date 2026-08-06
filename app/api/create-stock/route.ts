import { NextResponse } from 'next/server'
import { getMongoState, saveMongoState } from '@/lib/db/mongo-state'

export async function POST() {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json({ error: 'Mongo backend disabled' }, { status: 501 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const state = await getMongoState()
    
    // Create stock records for all products for each organization
    const stockRecords: any[] = []
    
    state.organizations.forEach(org => {
      state.products.forEach(product => {
        stockRecords.push({
          id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          orgId: org.id,
          productId: product.id,
          sku: product.sku,
          quantity: 0, // Start with 0 stock
          updatedAt: new Date().toISOString()
        })
      })
    })
    
    const updatedState = {
      ...state,
      stock: stockRecords
    }
    
    await saveMongoState(updatedState)
    
    return NextResponse.json({ 
      success: true, 
      stockCount: stockRecords.length,
      message: `Created ${stockRecords.length} stock records for ${state.products.length} products across ${state.organizations.length} organizations`
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
