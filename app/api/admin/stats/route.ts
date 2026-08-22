import { NextResponse } from 'next/server'
import { loadServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function GET(request: Request) {
  // Get session from headers (client-side auth)
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  // Check admin authorization
  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const state = await loadServerState()
    
    console.log('Admin stats - State loaded:', {
      usersCount: state.users.length,
      orgsCount: state.organizations.length,
      productsCount: state.products.length,
      stockCount: state.stock.length,
      shipmentsCount: state.shipments.length
    })

    const stats = {
      totalUsers: state.users.length,
      totalOrganizations: state.organizations.length,
      totalProducts: state.products.length,
      totalStock: state.stock.reduce((sum, s) => sum + s.quantity, 0),
      totalInvoices: state.bulkUploadBatches.reduce((sum, b) => sum + b.totalInvoices, 0),
      totalShipments: state.shipments.length,
      activeSubscriptions: state.subscriptions.filter(s => s.status === 'active').length,
      totalRevenue: state.payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
    }

    console.log('Admin stats - Returning:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
