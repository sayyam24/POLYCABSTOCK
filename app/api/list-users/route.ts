import { NextResponse } from 'next/server'
import { getMongoState } from '@/lib/db/mongo-state'

export async function GET() {
  try {
    const state = await getMongoState()
    
    const usersWithOrgs = state.users.map((user: any) => {
      const org = state.organizations.find((o: any) => o.id === user.orgId)
      return {
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        orgId: user.orgId,
        orgName: org?.name || 'Not found',
        orgType: org?.type || 'Not found',
        orgExists: !!org
      }
    })

    return NextResponse.json({
      totalUsers: usersWithOrgs.length,
      users: usersWithOrgs
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 503 }
    )
  }
}
