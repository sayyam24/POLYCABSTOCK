'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Truck,
  BarChart3,
  Layers,
  Zap,
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
      
      <main className="p-4 lg:p-8 space-y-8">
        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Inventory</p>
                  <p className="text-3xl font-bold">3,405</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Today Sales</p>
                  <p className="text-3xl font-bold">$4,280</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Orders Today</p>
                  <p className="text-3xl font-bold">48</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Low Stock</p>
                  <p className="text-3xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Sales Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Sales Chart */}
          <Card className="lg:col-span-2 border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Weekly Sales</CardTitle>
              </div>
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
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Top Sellers</CardTitle>
              </div>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellers.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                    </div>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{product.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory and Orders Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory Status */}
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-semibold">Inventory Status</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-indigo-100 dark:hover:bg-indigo-950/30">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Stock levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryStatus.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.inStock} / {item.total}
                      </span>
                    </div>
                    <Progress
                      value={item.percentage}
                      className={`h-2 ${
                        item.percentage < 30 ? '[&>div]:bg-red-500' :
                        item.percentage < 50 ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-green-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25" 
                size="lg"
              >
                <Truck className="h-4 w-4 mr-2" />
                Request Restock
              </Button>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-semibold">Recent Sales</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-indigo-100 dark:hover:bg-indigo-950/30">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors rounded-lg px-2">
                    <div>
                      <p className="text-sm font-semibold">{sale.customer}</p>
                      <p className="text-xs text-muted-foreground">{sale.id} • {sale.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{sale.total}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Restocks */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-semibold">Pending Restocks</CardTitle>
            </div>
            <CardDescription>Incoming inventory orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pendingRestocks.map((restock) => (
                <div key={restock.product} className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-border/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">{restock.product}</p>
                    <Badge
                      className={
                        restock.status === 'in-transit' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900/50' :
                        restock.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50'
                      }
                    >
                      {restock.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="font-semibold">{restock.ordered} units</span>
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
