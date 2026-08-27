import { NextResponse } from 'next/server'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'
import { firestoreId, isoNow } from '@/lib/firebase/utils'
import { createUser as createMongoUser } from '@/lib/mongodb/collections'

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
    const { name, email, password, role, distributorId, location } = body

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
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

    // Create user with password
    const userId = firestoreId('user')
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      password: password, // In production, this should be hashed
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

    // Save to MongoDB if backend is configured
    if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
      try {
        await createMongoUser(newUser)
        console.log('User created in MongoDB:', newUser.email)
      } catch (mongoError) {
        console.error('Failed to create user in MongoDB:', mongoError)
        // Fallback to server state if MongoDB fails
        state.users.push(newUser)
        await saveServerState(state)
      }
    } else {
      // Save to server state for local database mode
      state.users.push(newUser)
      await saveServerState(state)
    }

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
