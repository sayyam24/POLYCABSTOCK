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

const salesData = [
  { month: 'Jan', incoming: 2400, outgoing: 1800 },
  { month: 'Feb', incoming: 1398, outgoing: 2200 },
  { month: 'Mar', incoming: 9800, outgoing: 7500 },
  { month: 'Apr', incoming: 3908, outgoing: 3200 },
  { month: 'May', incoming: 4800, outgoing: 4100 },
  { month: 'Jun', incoming: 3800, outgoing: 3500 },
]

const topProducts = [
  { name: 'Circuit Board CB-500', sold: 1250, revenue: '$62,500', trend: '+15%' },
  { name: 'LED Panel LP-200', sold: 980, revenue: '$49,000', trend: '+8%' },
  { name: 'Power Supply PS-100', sold: 850, revenue: '$34,000', trend: '+12%' },
  { name: 'Connector Set CS-50', sold: 720, revenue: '$14,400', trend: '-3%' },
  { name: 'Capacitor Kit CK-25', sold: 650, revenue: '$16,250', trend: '+5%' },
]

const retailerPerformance = [
  { name: 'Store A', value: 85 },
  { name: 'Store B', value: 72 },
  { name: 'Store C', value: 68 },
  { name: 'Store D', value: 55 },
  { name: 'Store E', value: 48 },
]

const pendingOrders = [
  { id: 'ORD-2451', retailer: 'RetailMax', items: 45, date: '2 hours ago', priority: 'high' },
  { id: 'ORD-2450', retailer: 'TechMart', items: 120, date: '5 hours ago', priority: 'medium' },
  { id: 'ORD-2449', retailer: 'ElectroShop', items: 35, date: '8 hours ago', priority: 'low' },
  { id: 'ORD-2448', retailer: 'GadgetWorld', items: 78, date: '1 day ago', priority: 'medium' },
]

const recentDeliveries = [
  { id: 'DEL-1892', retailer: 'QuickBuy', items: 200, status: 'delivered' },
  { id: 'DEL-1891', retailer: 'TechZone', items: 150, status: 'delivered' },
  { id: 'DEL-1890', retailer: 'DigitalStore', items: 85, status: 'delivered' },
]

export default function DistributorDashboard() {
  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Distributor Dashboard" userName="Distributor Corp" />
      
      <main className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Current Inventory"
            value="45,280"
            change="+8.2% from last week"
            changeType="positive"
            icon={Package}
          />
          <StatsCard
            title="Incoming Stock"
            value="2,450"
            change="Expected today"
            changeType="neutral"
            icon={ArrowDownRight}
          />
          <StatsCard
            title="Outgoing Stock"
            value="1,820"
            change="Shipped today"
            changeType="neutral"
            icon={ArrowUpRight}
          />
          <StatsCard
            title="Active Retailers"
            value="42"
            change="+5 new this month"
            changeType="positive"
            icon={Store}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Flow</CardTitle>
              <CardDescription>Incoming vs Outgoing inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
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
                    <Line
                      type="monotone"
                      dataKey="incoming"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="outgoing"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Incoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">Outgoing</span>
                </div>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={retailerPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{order.id}</p>
                        <Badge
                          variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {order.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.retailer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{order.items} items</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" size="lg">
                Process Orders
              </Button>
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
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{product.revenue}</p>
                      <p className={`text-xs flex items-center justify-end gap-1 ${
                        product.trend.startsWith('+') ? 'text-success' : 'text-destructive'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        {product.trend}
                      </p>
                    </div>
                  </div>
                ))}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                  <div>
                    <p className="text-sm font-medium">{delivery.id}</p>
                    <p className="text-xs text-muted-foreground">{delivery.retailer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{delivery.items} items</p>
                    <Badge variant="outline" className="text-success border-success/30">
                      {delivery.status}
                    </Badge>
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
