import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET() {
  if (process.env.NEXT_PUBLIC_DATA_BACKEND !== 'mongo') {
    return NextResponse.json({ error: 'Mongo backend disabled' }, { status: 501 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Missing MONGODB_URI' }, { status: 500 })
  }

  try {
    const state = await getMongoState()
    return NextResponse.json({
      productCount: state.products.length,
      firstProduct: state.products[0],
      lastProduct: state.products[state.products.length - 1],
      stockCount: state.stock.length
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 }
    )
  }
}
