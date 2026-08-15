import { NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/lib/mongodb/collections'
import { loadServerState, saveServerState } from '@/lib/db/server-state'
import { canCreateRole } from '@/lib/permissions'
import type { AuthSession, CreateUserInput, UserRole } from '@/lib/types'

function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function nowIso() {
  return new Date().toISOString()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const creator = body.creator as AuthSession
    const input = body.input as CreateUserInput

    if (!creator?.userId || !input?.email || !input?.password || !input?.name || !input?.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!canCreateRole(creator.role, input.role)) {
      return NextResponse.json(
        { error: `${creator.role} cannot create ${input.role}` },
        { status: 403 },
      )
    }

    if (input.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      )
    }

    const email = input.email.trim().toLowerCase()
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }

    const state = await loadServerState()
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }

    const orgId = id('org')
    const userId = id('user')
    const ts = nowIso()

    const org = {
      id: orgId,
      name: input.name,
      type: input.role as UserRole,
      parentId: creator.orgId,
      location: input.location ?? '',
      contact: input.contact ?? '',
      ownerUserId: userId,
      createdAt: ts,
    }

    const user = {
      id: userId,
      email,
      name: input.name,
      role: input.role,
      status: 'approved' as const,
      parentId: creator.userId,
      orgId,
      location: input.location,
      contact: input.contact,
      createdAt: ts,
      updatedAt: ts,
    }

    await createUser({
      ...user,
      password: hashPassword(input.password),
    })

    state.organizations.push(org)
    state.users.push(user)
    await saveServerState(state)

    return NextResponse.json({
      success: true,
      user,
      loginEmail: email,
    })
  } catch (error) {
    console.error('Create user API error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
