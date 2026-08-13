import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { firestoreId, isoNow } from '@/lib/firebase/utils'

export async function GET(request: Request) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const state = await loadServerState()
    return NextResponse.json(state.users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, email, role, distributorId, location } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    if (role === 'salesman' && !distributorId) {
      return NextResponse.json(
        { error: 'Distributor ID is required for salesman role' },
        { status: 400 }
      )
    }

    const state = await loadServerState()

    // Check if email already exists
    const existingUser = state.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create organization for salesman if needed
    let orgId
    if (role === 'salesman') {
      // Salesman doesn't need their own organization, they use the distributor's
      orgId = distributorId
    } else {
      // For other roles, create an organization
      orgId = firestoreId('org')
      const userId = firestoreId('user')
      const newOrg = {
        id: orgId,
        name: `${name}'s Organization`,
        type: role,
        parentId: null,
        location: location || '',
        contact: email,
        ownerUserId: userId,
        createdAt: isoNow(),
      }
      state.organizations.push(newOrg)
    }

    // Create user
    const userId = firestoreId('user')
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      name: name.trim(),
      role: role,
      status: 'active' as const,
      parentId: null,
      orgId,
      distributorId: role === 'salesman' ? distributorId : undefined,
      location: location || '',
      contact: email,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    }

    state.users.push(newUser)
    await saveServerState(state)

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
