'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { Package, Send, Users, Bell } from 'lucide-react'

export default function DepoDashboard() {
  const { session } = useAuth()
  const { getOrgStock, getOutgoingShipments, getIncomingShipments } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []
  const totalUnits = stock.reduce((s, r) => s + r.quantity, 0)
  const outgoing = session ? getOutgoingShipments(session.orgId).length : 0
  const pendingIn = session
    ? getIncomingShipments(session.orgId).filter((s) => s.status === 'sent').length
    : 0

  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Depo Dashboard" notificationsHref="/depo/notifications" />
      <main className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Depo Stock" value={totalUnits.toLocaleString()} change={`${stock.length} SKUs`} icon={Package} />
          <StatsCard title="Outgoing" value={outgoing} change="Shipments sent" icon={Send} />
          <StatsCard title="Pending In" value={pendingIn} change="Awaiting receive" icon={Bell} />
          <StatsCard title="Distributors" value="—" change="Manage network" icon={Users} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button asChild size="lg" className="h-14"><Link href="/depo/stock">Upload Stock</Link></Button>
          <Button asChild size="lg" variant="secondary" className="h-14"><Link href="/depo/send">Send Shipment</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-14"><Link href="/depo/distributors">Add Distributor</Link></Button>
        </div>
        <Card>
          <CardHeader><CardTitle>Current Stock</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stock.map((s) => (
              <p key={s.id} className="text-sm flex justify-between"><span>{s.productName}</span><span className="font-semibold">{s.quantity}</span></p>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
