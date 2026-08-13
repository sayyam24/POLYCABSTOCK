import { NextResponse } from 'next/server'
import { loadServerState } from '@/lib/db/server-state'
import { requireSalesmanAuth, getSalesmanSessionFromHeaders } from '@/lib/auth/salesman-auth'

export async function GET(request: Request) {
  const session = getSalesmanSessionFromHeaders(request.headers)
  
  const authError = requireSalesmanAuth(session)
  if (authError) return authError

  try {
    const state = await loadServerState()
    
    // Get the salesman user to find their assigned distributor
    const salesman = state.users.find(u => u.id === session.userId)
    if (!salesman || !salesman.distributorId) {
      return NextResponse.json(
        { error: 'Salesman not assigned to any distributor' },
        { status: 403 }
      )
    }

    // Filter stock to only show the assigned distributor's stock
    const distributorStock = state.stock.filter(s => s.orgId === salesman.distributorId)
    
    return NextResponse.json(distributorStock)
  } catch (error) {
    console.error('Error fetching salesman stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}
