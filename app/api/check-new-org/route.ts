import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orgId = url.searchParams.get('orgId') || 'org_1782635820575_ddm0vbo'
  
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
      lastStock: orgStock[orgStock.length - 1] || null
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 503 }
    )
  }
}
