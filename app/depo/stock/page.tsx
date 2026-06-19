'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OpeningStockUpload } from '@/components/opening-stock-upload'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function DepoStockPage() {
  const { session } = useAuth()
  const { getOrgStock } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []

  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Depo Stock" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Upload Opening Stock (CSV / Manual)</CardTitle></CardHeader>
          <CardContent><OpeningStockUpload /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Current Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stock.map((s) => (
              <p key={s.id} className="flex justify-between text-sm">
                <span>{s.productName}</span>
                <span className="font-bold">{s.quantity} units</span>
              </p>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
