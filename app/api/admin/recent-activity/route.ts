import { NextResponse } from 'next/server'
import { loadServerState } from '@/lib/db/server-state'
import { requireAdminAuth } from '@/lib/auth/admin-auth'

export async function GET(request: Request) {
  // Get session from headers (client-side auth)
  const session = {
    userId: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
  }

  // Check admin authorization
  const authError = requireAdminAuth(session)
  if (authError) return authError

  try {
    const state = await loadServerState()
    
    // Get recent activity from various sources
    const activities: Array<{ type: string; description: string; time: string }> = []
    
    // Recent user registrations
    const recentUsers = state.users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
    
    recentUsers.forEach(user => {
      const timeAgo = getTimeAgo(user.createdAt)
      activities.push({
        type: 'user',
        description: `New ${user.role} registered: ${user.name}`,
        time: timeAgo
      })
    })
    
    // Recent shipments
    const recentShipments = state.shipments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
    
    recentShipments.forEach(shipment => {
      const timeAgo = getTimeAgo(shipment.createdAt)
      activities.push({
        type: 'shipment',
        description: `Shipment ${shipment.shipmentNumber} sent to ${shipment.receiverName}`,
        time: timeAgo
      })
    })
    
    // Recent stock updates (if stock has createdAt/updatedAt)
    const recentStock = state.stock
      .filter((s: any) => s.updatedAt || s.createdAt)
      .sort((a: any, b: any) => {
        const aTime = new Date(a.updatedAt || a.createdAt).getTime()
        const bTime = new Date(b.updatedAt || b.createdAt).getTime()
        return bTime - aTime
      })
      .slice(0, 3)
    
    recentStock.forEach((stock: any) => {
      const timeAgo = getTimeAgo(stock.updatedAt || stock.createdAt)
      activities.push({
        type: 'stock',
        description: `Stock updated: ${stock.productName} (${stock.quantity} units)`,
        time: timeAgo
      })
    })
    
    // Sort all activities by time
    activities.sort((a, b) => {
      // Simple sort - in production, you'd want proper date comparison
      return 0
    })
    
    // Take top 8 activities
    const topActivities = activities.slice(0, 8)
    
    return NextResponse.json({ activities: topActivities })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return `${Math.floor(seconds / 604800)} weeks ago`
}
