import { NextResponse } from 'next/server'
import { getMongoState, saveMongoState } from '@/lib/db/mongo-state'
import { getCatalogProducts } from '@/lib/catalog/products'

export async function POST() {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json(
      { error: 'Mongo backend disabled' },
      { status: 501 }
    )
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const state = await getMongoState()
    const newProducts = getCatalogProducts()
    
    // Update products and clear stock tied to old SKUs
    const updatedState = {
      ...state,
      products: newProducts,
      stock: [] // Clear stock as products have changed
    }
    
    await saveMongoState(updatedState)
    
    return NextResponse.json({ 
      success: true, 
      productCount: newProducts.length,
      message: `Updated ${newProducts.length} products in MongoDB`
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
