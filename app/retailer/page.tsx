'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const salesData = [
  { day: 'Mon', sales: 1200 },
  { day: 'Tue', sales: 1800 },
  { day: 'Wed', sales: 1500 },
  { day: 'Thu', sales: 2200 },
  { day: 'Fri', sales: 2800 },
  { day: 'Sat', sales: 3200 },
  { day: 'Sun', sales: 2100 },
]

const inventoryStatus = [
  { category: 'Circuit Boards', inStock: 450, total: 500, percentage: 90 },
  { category: 'LED Panels', inStock: 120, total: 200, percentage: 60 },
  { category: 'Power Supplies', inStock: 35, total: 150, percentage: 23 },
  { category: 'Connectors', inStock: 800, total: 1000, percentage: 80 },
  { category: 'Capacitors', inStock: 2000, total: 2500, percentage: 80 },
]

const recentSales = [
  { id: 'SALE-4521', customer: 'John Smith', items: 3, total: '$245.00', time: '10 min ago' },
  { id: 'SALE-4520', customer: 'Sarah Johnson', items: 5, total: '$520.00', time: '25 min ago' },
  { id: 'SALE-4519', customer: 'Mike Davis', items: 2, total: '$180.00', time: '1 hour ago' },
  { id: 'SALE-4518', customer: 'Emily Brown', items: 8, total: '$890.00', time: '2 hours ago' },
  { id: 'SALE-4517', customer: 'Chris Wilson', items: 1, total: '$75.00', time: '3 hours ago' },
]

const pendingRestocks = [
  { product: 'Power Supply PS-100', ordered: 100, eta: 'Tomorrow', status: 'in-transit' },
  { product: 'LED Panel LP-200', ordered: 50, eta: '2 days', status: 'processing' },
  { product: 'Circuit Board CB-500', ordered: 75, eta: '3 days', status: 'confirmed' },
]

const topSellers = [
  { name: 'Circuit Board CB-500', sales: 125, revenue: '$6,250' },
  { name: 'LED Panel LP-200', sales: 98, revenue: '$4,900' },
  { name: 'Power Supply PS-100', sales: 85, revenue: '$3,400' },
  { name: 'Connector Set CS-50', sales: 72, revenue: '$1,440' },
]

export default function RetailerDashboard() {
  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Retailer Dashboard" userName="TechMart Store" />
      
      <main className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Inventory"
            value="3,405"
            change="Units in stock"
            changeType="neutral"
            icon={Package}
          />
          <StatsCard
            title="Today Sales"
            value="$4,280"
            change="+18% from yesterday"
            changeType="positive"
            icon={DollarSign}
          />
          <StatsCard
            title="Orders Today"
            value="48"
            change="+12 from yesterday"
            changeType="positive"
            icon={ShoppingCart}
          />
          <StatsCard
            title="Low Stock Items"
            value="3"
            change="Need restocking"
            changeType="negative"
            icon={AlertTriangle}
          />
        </div>

        {/* Charts and Sales Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Sales Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
              <CardDescription>Sales performance this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`$${value}`, 'Sales']}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Sellers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Top Sellers
              </CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellers.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                    </div>
                    <p className="text-sm font-bold text-success">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory and Orders Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Stock levels by category</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryStatus.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.inStock} / {item.total}
                      </span>
                    </div>
                    <Progress
                      value={item.percentage}
                      className={`h-2 ${
                        item.percentage < 30 ? '[&>div]:bg-destructive' :
                        item.percentage < 50 ? '[&>div]:bg-warning' :
                        '[&>div]:bg-success'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6" size="lg">
                Request Restock
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Recent Sales
                </CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{sale.customer}</p>
                      <p className="text-xs text-muted-foreground">{sale.id} • {sale.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{sale.total}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Restocks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Restocks</CardTitle>
            <CardDescription>Incoming inventory orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingRestocks.map((restock) => (
                <div key={restock.product} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{restock.product}</p>
                    <Badge
                      variant={
                        restock.status === 'in-transit' ? 'default' :
                        restock.status === 'processing' ? 'secondary' : 'outline'
                      }
                    >
                      {restock.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{restock.ordered} units</span>
                    <span>ETA: {restock.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
