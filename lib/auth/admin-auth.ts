import { NextResponse } from 'next/server'
import type { UserRole } from '@/lib/types'

/**
 * Check if the user has admin role
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Middleware to protect admin API routes
 * Returns error response if user is not admin
 */
export function requireAdminAuth(session: any) {
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - No session' },
      { status: 401 }
    )
  }

  if (!isAdminRole(session.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  return null // No error, proceed
}

/**
 * Get admin session from request headers
 */
export function getAdminSessionFromHeaders(headers: Headers): any {
  const userId = headers.get('x-user-id')
  const orgId = headers.get('x-org-id')
  const role = headers.get('x-user-role')
  const email = headers.get('x-user-email')
  const name = headers.get('x-user-name')

  if (!userId || !role) {
    return null
  }

  return {
    userId,
    orgId: orgId || '',
    role,
    email: email || '',
    name: name || '',
  }
}
