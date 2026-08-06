import { NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/lib/mongodb/collections'
import { firestoreId, isoNow } from '@/lib/firebase/utils'
import type { UserStatus, UserRole } from '@/lib/types'

// Simple password hashing (for demo purposes - use bcrypt in production)
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, role = 'retailer' } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists in users collection
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Create new user
    const userId = firestoreId('user')
    const orgId = firestoreId('org')
    const ts = isoNow()

    const newUser = {
      id: userId,
      authUid: userId,
      email: email.toLowerCase(),
      name,
      role: role as UserRole,
      status: 'approved' as UserStatus,
      parentId: null,
      orgId,
      location: '',
      contact: email,
      createdAt: ts,
      updatedAt: ts,
      password: hashPassword(password), // Store hashed password in users collection
    }

    // Save user to separate users collection
    await createUser(newUser)

    // Sync user + org into MongoDB app state for stock/shipments UI
    const { getMongoState, saveMongoState } = await import('@/lib/db/mongo-state')
    const state = await getMongoState()

    state.organizations.push({
      id: orgId,
      name,
      type: role as UserRole,
      parentId: null,
      location: '',
      contact: email,
      ownerUserId: userId,
      createdAt: ts,
    })

    state.users.push({
      id: userId,
      authUid: userId,
      email: email.toLowerCase(),
      name,
      role: role as UserRole,
      status: 'approved',
      parentId: null,
      orgId,
      location: '',
      contact: email,
      createdAt: ts,
      updatedAt: ts,
    })

    await saveMongoState(state)

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Account created successfully'
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
