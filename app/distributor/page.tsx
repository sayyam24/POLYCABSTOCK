'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  ArrowDownRight,
  ArrowUpRight,
  Store,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '@/components/auth-provider'
import { useEffect, useState } from 'react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useRouter } from 'next/navigation'


export default function DistributorDashboard() {
  const { session } = useAuth()
  const router = useRouter()
  const [stockSummary, setStockSummary] = useState({
    lastVerificationDate: null as string | null,
    totalAdjustmentsThisMonth: 0,
    totalDifferenceAdjusted: 0,
  })
  const [pendingReceives, setPendingReceives] = useState(0)
  const [inventoryStats, setInventoryStats] = useState({
    totalInventory: 0,
    incomingStock: 0,
    outgoingStock: 0,
    activeRetailers: 0
  })

  useEffect(() => {
    if (session) {
      const summary = electroTrackService.getStockAdjustmentSummary(session.orgId)
      setStockSummary(summary)
      
      // Load pending receives and inventory stats
      const res = fetch('/api/state', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          const shipments = data.shipments || []
          const pending = shipments.filter((s: any) => 
            s.receiverOrgId === session.orgId && s.status === 'sent'
          ).length
          setPendingReceives(pending)
          
          // Calculate inventory stats
          const stock = data.stock || []
          const orgStock = stock.filter((s: any) => s.orgId === session.orgId)
          const totalInventory = orgStock.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0)
          
          setInventoryStats({
            totalInventory,
            incomingStock: 0, // Calculate from incoming shipments if needed
            outgoingStock: 0, // Calculate from outgoing shipments if needed
            activeRetailers: 0 // Calculate from retailers if needed
          })
        })
        .catch(() => {})
    }
  }, [session])

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Distributor Dashboard" userName="Distributor Corp" />
      
      <main className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Current Inventory"
            value={inventoryStats.totalInventory.toLocaleString()}
            change={inventoryStats.totalInventory > 0 ? "Stock available" : "No data yet"}
            changeType={inventoryStats.totalInventory > 0 ? "positive" : "neutral"}
            icon={Package}
          />
          <StatsCard
            title="Incoming Stock"
            value={inventoryStats.incomingStock.toLocaleString()}
            change="No data yet"
            changeType="neutral"
            icon={ArrowDownRight}
          />
          <StatsCard
            title="Outgoing Stock"
            value={inventoryStats.outgoingStock.toLocaleString()}
            change="No data yet"
            changeType="neutral"
            icon={ArrowUpRight}
          />
          <StatsCard
            title="Active Retailers"
            value={inventoryStats.activeRetailers.toLocaleString()}
            change="No data yet"
            changeType="neutral"
            icon={Store}
          />
        </div>

        {/* Stock Verification Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Stock Verification Summary
              </CardTitle>
              <CardDescription>Monthly stock adjustment overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Last Verification Date</div>
                <div className="text-lg font-semibold">
                  {stockSummary.lastVerificationDate 
                    ? new Date(stockSummary.lastVerificationDate).toLocaleDateString() 
                    : 'Never verified'}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Adjustments This Month</div>
                <div className="text-lg font-semibold text-green-600">{stockSummary.totalAdjustmentsThisMonth}</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Difference Adjusted</div>
                <div className="text-lg font-semibold text-purple-600">{stockSummary.totalDifferenceAdjusted}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Receives Widget */}
        {pendingReceives > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Pending Receives ({pendingReceives})
              </CardTitle>
              <CardDescription>Shipments waiting to be received</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/distributor/shipments')}>
                View Shipments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Flow</CardTitle>
              <CardDescription>Incoming vs Outgoing inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet. Upload invoices to see stock flow data.
              </div>
            </CardContent>
          </Card>

          {/* Retailer Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Retailer Performance</CardTitle>
              <CardDescription>Top performing retail partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet. Start shipping to retailers to see performance data.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Orders
                </CardTitle>
                <CardDescription>Orders awaiting processing</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No pending orders
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling items this month</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No data available yet. Upload invoices to see top products.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Recent Deliveries
              </CardTitle>
              <CardDescription>Successfully completed deliveries</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No recent deliveries
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
