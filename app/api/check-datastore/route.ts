import { NextResponse } from 'next/server'
import { getDataStore } from '@/lib/store/data-store'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET() {
  try {
    const dataStore = getDataStore()
    const mongoState = await getMongoState()
    
    return NextResponse.json({
      dataStoreHydrated: dataStore.isHydrated,
      dataStoreProductCount: dataStore.products.length,
      dataStoreStockCount: dataStore.stock.length,
      mongoProductCount: mongoState.products.length,
      mongoStockCount: mongoState.stock.length,
      dataStoreFirstProduct: dataStore.products[0],
      mongoFirstProduct: mongoState.products[0]
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 503 }
    )
  }
}
