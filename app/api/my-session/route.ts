import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 })
  }

  try {
    const state = await getMongoState()
    const user = state.users.find((u: any) => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const org = state.organizations.find((o: any) => o.id === user.orgId)
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId
      },
      organization: org ? {
        id: org.id,
        name: org.name,
        type: org.type,
        location: org.location,
        contact: org.contact
      } : null,
      orgExistsInMongo: !!org
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 503 }
    )
  }
}
