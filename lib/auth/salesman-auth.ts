import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types'

/**
 * Check if the user has salesman role
 */
export function isSalesmanRole(role: UserRole): boolean {
  return role === 'salesman'
}

/**
 * Middleware to protect salesman API routes
 * Returns error response if user is not salesman
 */
export function requireSalesmanAuth(session: any) {
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - No session' },
      { status: 401 }
    )
  }

  if (!isSalesmanRole(session.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Salesman access required' },
      { status: 403 }
    )
  }

  return null // No error, proceed
}

/**
 * Get salesman session from request headers
 */
export function getSalesmanSessionFromHeaders(headers: Headers): any {
  const userId = headers.get('x-user-id')
  const orgId = headers.get('x-org-id')
  const distributorId = headers.get('x-distributor-id')
  const role = headers.get('x-user-role')
  const email = headers.get('x-user-email')
  const name = headers.get('x-user-name')

  if (!userId || !role) {
    return null
  }

  return {
    userId,
    orgId: orgId || '',
    distributorId: distributorId || '',
    role,
    email: email || '',
    name: name || '',
  }
}

/**
 * Ensure salesman can only access their assigned distributor's data
 */
export function requireDistributorAccess(session: any, distributorId: string) {
  if (!session.distributorId || session.distributorId !== distributorId) {
    return NextResponse.json(
      { error: 'Forbidden - You can only access your assigned distributor\'s data' },
      { status: 403 }
    )
  }
  return null
}
