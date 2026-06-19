'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockTable } from '@/components/products-table'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function RetailerStockPage() {
  const { session } = useAuth()
  const { getOrgStock } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []

  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Current Stock" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Store Inventory</CardTitle></CardHeader>
          <CardContent><StockTable rows={stock} /></CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
