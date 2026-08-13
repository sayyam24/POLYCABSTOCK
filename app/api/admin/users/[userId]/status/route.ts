import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const { status } = await request.json()
    const state = await loadServerState()

    const userIndex = state.users.findIndex(u => u.id === params.userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow deactivating admin users
    if (state.users[userIndex].role === 'admin') {
      return NextResponse.json({ error: 'Cannot modify admin user status' }, { status: 403 })
    }

    state.users[userIndex].status = status
    state.users[userIndex].updatedAt = new Date().toISOString()

    await saveServerState(state)

    return NextResponse.json({ success: true, user: state.users[userIndex] })
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    )
  }
}
