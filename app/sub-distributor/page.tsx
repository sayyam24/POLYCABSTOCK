'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { Package, Send, Store } from 'lucide-react'

export default function SubDistributorDashboard() {
  const { session } = useAuth()
  const { getOrgStock, getIncomingShipments } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []
  const pending = session
    ? getIncomingShipments(session.orgId).filter((s) => s.status === 'sent').length
    : 0

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Sub Distributor Dashboard" notificationsHref="/sub-distributor/notifications" />
      <main className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Stock" value={stock.reduce((a, b) => a + b.quantity, 0)} icon={Package} />
          <StatsCard title="Pending" value={pending} change="Incoming shipments" icon={Send} />
          <StatsCard title="Retailers" value="—" icon={Store} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12"><Link href="/sub-distributor/receive">Receive</Link></Button>
          <Button asChild size="lg" variant="secondary" className="h-12"><Link href="/sub-distributor/send">Send to Retailer</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12"><Link href="/sub-distributor/retailers">Add Retailer</Link></Button>
        </div>
      </main>
    </DashboardLayout>
  )
}
