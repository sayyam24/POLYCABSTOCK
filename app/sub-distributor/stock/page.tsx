'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function SubDistributorStockPage() {
  const { session } = useAuth()
  const { getOrgStock } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Stock" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Current Stock</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stock.map((s) => (
              <p key={s.id} className="flex justify-between text-sm"><span>{s.productName}</span><span className="font-bold">{s.quantity}</span></p>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
