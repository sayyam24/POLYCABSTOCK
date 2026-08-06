import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'
import { setDataStore } from '@/lib/store/data-store'

export async function POST() {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json({ error: 'Mongo backend disabled' }, { status: 501 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const mongoState = await getMongoState()
    
    // Force hydrate the data store with MongoDB data
    setDataStore({
      users: mongoState.users,
      organizations: mongoState.organizations,
      products: mongoState.products,
      stock: mongoState.stock,
      shipments: mongoState.shipments,
      notifications: mongoState.notifications,
      transactionHistory: mongoState.transactionHistory,
      returns: mongoState.returns ?? [],
      isHydrated: true,
    })
    
    return NextResponse.json({ 
      success: true, 
      productCount: mongoState.products.length,
      stockCount: mongoState.stock.length,
      message: 'Data store hydrated with MongoDB data'
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
