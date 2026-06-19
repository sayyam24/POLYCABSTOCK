'use client'

import { useMemo } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Package,
  ArrowLeftRight,
  Store,
  Truck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { getDataStore } from '@/lib/store/data-store'
import { useStore } from '@/components/store-provider'
import { computeDemoAnalytics } from '@/lib/demo/analytics'
import { isDemoSeededLocally } from '@/lib/demo/persist'
import { DemoDataPanel } from '@/components/demo-data-panel'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const defaultStockTrend = [
  { month: 'Jan', depo: 4000, distributor: 2400, retailer: 2400 },
  { month: 'Feb', depo: 3000, distributor: 1398, retailer: 2210 },
  { month: 'Mar', depo: 2000, distributor: 9800, retailer: 2290 },
  { month: 'Apr', depo: 2780, distributor: 3908, retailer: 2000 },
  { month: 'May', depo: 1890, distributor: 4800, retailer: 2181 },
  { month: 'Jun', depo: 2390, distributor: 3800, retailer: 2500 },
]

const defaultTransferData = [
  { name: 'Mon', transfers: 12 },
  { name: 'Tue', transfers: 19 },
  { name: 'Wed', transfers: 15 },
  { name: 'Thu', transfers: 25 },
  { name: 'Fri', transfers: 22 },
  { name: 'Sat', transfers: 8 },
  { name: 'Sun', transfers: 5 },
]

const chartLegendColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3'] as const

export default function AdminDashboard() {
  const { version } = useStore()
  const analytics = useMemo(() => {
    void version
    if (!isDemoSeededLocally()) return null
    const state = getDataStore()
    if (state.stock.length < 10) return null
    return computeDemoAnalytics(state)
  }, [version])

  const transferData = analytics?.weeklyTransfers ?? defaultTransferData
  const lowStockFromDemo = analytics?.fastMovingProducts.slice(0, 3).map((p) => ({
    product: p.name,
    location: 'Network',
    stock: p.quantity,
    threshold: p.quantity + 50,
  })) ?? []

  const lowStockAlerts =
    lowStockFromDemo.length > 0
      ? lowStockFromDemo
      : [
          { product: 'LED Bulb 9W', location: 'Distributor', stock: 15, threshold: 50 },
          { product: 'MCB 32A', location: 'Retailer', stock: 8, threshold: 30 },
        ]

  const recentTransfers = getDataStore()
    .shipments.slice(0, 5)
    .map((s) => ({
      id: s.shipmentNumber,
      from: s.senderName,
      to: s.receiverName,
      items: s.items.reduce((n, i) => n + i.quantity, 0),
      status: s.status === 'received' ? 'completed' : s.status === 'sent' ? 'in-transit' : s.status,
    }))

  const inventoryDistribution = analytics
    ? [
        { name: 'Depo', value: Math.round(((analytics.stockByRole.find((r) => r.role === 'depo')?.units ?? 0) / Math.max(analytics.totalStockUnits, 1)) * 100), color: 'var(--chart-1)' },
        { name: 'Distributor', value: Math.round(((analytics.stockByRole.find((r) => r.role === 'distributor')?.units ?? 0) / Math.max(analytics.totalStockUnits, 1)) * 100), color: 'var(--chart-2)' },
        { name: 'Retailer', value: Math.round(((analytics.stockByRole.find((r) => r.role === 'retailer')?.units ?? 0) / Math.max(analytics.totalStockUnits, 1)) * 100), color: 'var(--chart-3)' },
      ]
    : [
        { name: 'Depo', value: 45, color: 'var(--chart-1)' },
        { name: 'Distributor', value: 35, color: 'var(--chart-2)' },
        { name: 'Retailer', value: 20, color: 'var(--chart-3)' },
      ]

  const stockTrendData = defaultStockTrend

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Admin Dashboard" userName="Admin User" />
      
      <main className="p-4 lg:p-8 space-y-6">
        {!isDemoSeededLocally() && <DemoDataPanel />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Inventory"
            value={analytics ? analytics.totalStockUnits.toLocaleString() : '—'}
            change={analytics ? 'Units across network' : 'Generate demo data'}
            changeType="positive"
            icon={Package}
          />
          <StatsCard
            title="Pending Shipments"
            value={analytics ? String(analytics.pendingShipments) : '—'}
            change={analytics ? `${analytics.recentTransactions} received this week` : '—'}
            changeType="neutral"
            icon={ArrowLeftRight}
          />
          <StatsCard
            title="Distributors"
            value={analytics ? String(analytics.distributorCount) : '—'}
            change={analytics ? 'Active in demo' : '—'}
            changeType="positive"
            icon={Truck}
          />
          <StatsCard
            title="Retailers"
            value={analytics ? String(analytics.retailerCount) : '—'}
            change={analytics ? `${analytics.lowStockAlerts} low stock alerts` : '—'}
            changeType="positive"
            icon={Store}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Trends Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stock Trends</CardTitle>
              <CardDescription>Inventory levels across supply chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="depo"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="distributor"
                      stackId="1"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="retailer"
                      stackId="1"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">Depo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Distributor</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-sm text-muted-foreground">Retailer</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Distribution</CardTitle>
              <CardDescription>Current stock by location type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {inventoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {inventoryDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-3 w-3 rounded-full', chartLegendColors[index])} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Transfers</CardTitle>
              <CardDescription>Number of transfers this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transferData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="transfers" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transfers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transfers</CardTitle>
                <CardDescription>Latest stock movements</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(recentTransfers.length ? recentTransfers : [{ id: '—', from: '—', to: '—', items: 0, status: 'pending' }]).slice(0, 4).map((transfer) => (
                  <div key={transfer.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{transfer.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {transfer.from} → {transfer.to}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{transfer.items} items</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        transfer.status === 'completed' ? 'bg-success/10 text-success' :
                        transfer.status === 'in-transit' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {transfer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Items below threshold</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{alert.product}</p>
                      <p className="text-xs text-muted-foreground">{alert.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">{alert.stock} units</p>
                      <p className="text-xs text-muted-foreground">Min: {alert.threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" size="lg">
                Restock Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  )
}
