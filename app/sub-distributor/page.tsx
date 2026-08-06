'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { Package, Send, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import type { StockRecord, Product } from '@/lib/types'

export default function SubDistributorDashboard() {
  const { session } = useAuth()
  const { getOrgStock, getIncomingShipments, getProducts } = useStore()
  const stock = session ? getOrgStock(session.orgId) : []
  const products = getProducts()
  const pending = session
    ? getIncomingShipments(session.orgId).filter((s) => s.status === 'sent').length
    : 0

  // Calculate stock by category
  const stockByCategory = stock.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId)
    const category = product?.category || 'Uncategorized'
    acc[category] = (acc[category] || 0) + item.quantity
    return acc
  }, {} as Record<string, number>)

  const categories = Object.keys(stockByCategory)
  const totalStock = Object.values(stockByCategory).reduce((a, b) => a + b, 0)

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Sub Distributor Dashboard" notificationsHref="/sub-distributor/notifications" />
      <main className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Stock" value={totalStock} icon={Package} />
          <StatsCard title="Pending" value={pending} change="Incoming shipments" icon={Send} />
          <StatsCard title="Retailers" value="—" icon={Store} />
        </div>

        {/* Stock by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-muted-foreground">No stock data available</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div key={category} className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground mb-1">{category}</p>
                    <p className="text-2xl font-bold">{stockByCategory[category]}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="h-12"><Link href="/sub-distributor/receive">Receive</Link></Button>
          <Button asChild size="lg" variant="secondary" className="h-12"><Link href="/sub-distributor/send">Send to Retailer</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-12"><Link href="/sub-distributor/retailers">Add Retailer</Link></Button>
        </div>
      </main>
    </DashboardLayout>
  )
}
