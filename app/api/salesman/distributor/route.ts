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

    // Get the assigned distributor organization
    const distributor = state.organizations.find(o => o.id === salesman.distributorId)
    if (!distributor) {
      return NextResponse.json(
        { error: 'Assigned distributor not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(distributor)
  } catch (error) {
    console.error('Error fetching salesman distributor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch distributor' },
      { status: 500 }
    )
  }
}
