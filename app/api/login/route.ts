import { NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/mongodb/collections'
import type { UserRole } from '@/lib/types'

// Simple password verification (for demo purposes - use bcrypt in production)
function verifyPassword(password: string, hashedPassword: string): boolean {
  return Buffer.from(password).toString('base64') === hashedPassword
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, expectedRole } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Get user from separate users collection
    const user = await getUserByEmail(normalizedEmail)
    console.log('Login API: User found:', !!user)

    if (!user) {
      return NextResponse.json(
        { error: expectedRole ? `No approved ${expectedRole} account for this email.` : 'No account for this email. Please sign up first.' },
        { status: 401 }
      )
    }

    // Check user status and role
    if (user.status !== 'approved') {
      return NextResponse.json(
        { error: 'Account is not approved. Please contact admin.' },
        { status: 401 }
      )
    }

    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        { error: `No approved ${expectedRole} account for this email.` },
        { status: 401 }
      )
    }

    // Verify password using stored password in users collection
    const passwordValid = user.password && verifyPassword(password, user.password)
    console.log('Login API: Password valid:', passwordValid)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const session = {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
      name: user.name,
    }

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
