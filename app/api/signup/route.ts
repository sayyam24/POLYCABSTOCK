import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Signup is disabled - only 2 specific admin accounts are allowed
  return NextResponse.json(
    { error: 'Public signup is disabled. Only authorized admin accounts can access this system.' },
    { status: 403 }
  )
}

export async function GET() {
  return NextResponse.json(
    { error: 'Public signup is disabled. Only authorized admin accounts can access this system.' },
    { status: 403 }
  )
}
