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
      stockCount: state.stock.length,
      firstStock: state.stock[0],
      organizations: state.organizations.map(o => ({ id: o.id, name: o.name, type: o.type })),
      retailerStock: state.stock.filter(s => {
        const org = state.organizations.find(o => o.id === s.orgId)
        return org?.type === 'retailer'
      }).length
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mongo error' },
      { status: 503 }
    )
  }
}
