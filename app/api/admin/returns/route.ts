import { NextResponse } from 'next/server'
import { loadServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function GET(request: Request) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const state = await loadServerState()
    return NextResponse.json(state.returns || [])
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    )
  }
}
