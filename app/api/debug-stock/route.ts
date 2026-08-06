import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET(req: Request) {
  try {
    const state = await getMongoState()
    
    const stockByOrg = state.stock.reduce((acc: any, s: any) => {
      if (!acc[s.orgId]) {
        acc[s.orgId] = []
      }
      acc[s.orgId].push(s)
      return acc
    }, {})
    
    return NextResponse.json({
      totalStock: state.stock.length,
      totalProducts: state.products.length,
      totalOrganizations: state.organizations.length,
      stockByOrg: Object.keys(stockByOrg).map(orgId => ({
        orgId,
        orgName: state.organizations.find((o: any) => o.id === orgId)?.name || 'Unknown',
        stockCount: stockByOrg[orgId].length,
        stockItems: stockByOrg[orgId].map((s: any) => ({
          productName: s.productName,
          quantity: s.quantity
        }))
      }))
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to debug stock' },
      { status: 503 }
    )
  }
}
