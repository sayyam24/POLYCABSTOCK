import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orgId = url.searchParams.get('orgId')
  
  if (!orgId) {
    return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 })
  }

  try {
    const state = await getMongoState()
    const orgStock = state.stock.filter((s: any) => s.orgId === orgId)
    const orgExists = state.organizations.find((o: any) => o.id === orgId)
    
    return NextResponse.json({
      orgId,
      orgExists: !!orgExists,
      orgName: orgExists?.name || 'Not found',
      orgType: orgExists?.type || 'Not found',
      stockCount: orgStock.length,
      firstStock: orgStock[0] || null,
      allOrgIds: state.organizations.map((o: any) => ({ id: o.id, name: o.name, type: o.type }))
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 503 }
    )
  }
}
