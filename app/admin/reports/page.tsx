'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
} from 'lucide-react'
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
  Legend,
} from 'recharts'

const monthlyRevenue = [
  { month: 'Jan', revenue: 125000, cost: 85000, profit: 40000 },
  { month: 'Feb', revenue: 142000, cost: 92000, profit: 50000 },
  { month: 'Mar', revenue: 158000, cost: 98000, profit: 60000 },
  { month: 'Apr', revenue: 135000, cost: 88000, profit: 47000 },
  { month: 'May', revenue: 168000, cost: 102000, profit: 66000 },
  { month: 'Jun', revenue: 182000, cost: 110000, profit: 72000 },
]

const categoryData = [
  { name: 'Circuit Boards', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'LED Panels', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Power Supplies', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Connectors', value: 12, color: 'hsl(var(--chart-4))' },
  { name: 'Capacitors', value: 8, color: 'hsl(var(--chart-5))' },
]

const stockMovement = [
  { week: 'Week 1', incoming: 2400, outgoing: 1800 },
  { week: 'Week 2', incoming: 3200, outgoing: 2800 },
  { week: 'Week 3', incoming: 2800, outgoing: 3100 },
  { week: 'Week 4', incoming: 3500, outgoing: 2900 },
]

const regionData = [
  { name: 'North', sales: 4500 },
  { name: 'South', sales: 3800 },
  { name: 'East', sales: 5200 },
  { name: 'West', sales: 4100 },
  { name: 'Central', sales: 3200 },
]

const reportTemplates = [
  { name: 'Inventory Summary', description: 'Current stock levels across all locations', type: 'inventory' },
  { name: 'Sales Report', description: 'Revenue and sales performance analysis', type: 'sales' },
  { name: 'Transfer History', description: 'All stock movements and transfers', type: 'transfer' },
  { name: 'Supplier Analysis', description: 'Supplier performance and costs', type: 'supplier' },
  { name: 'Demand Forecast', description: 'Predicted stock requirements', type: 'forecast' },
  { name: 'Financial Statement', description: 'Revenue, costs, and profit margins', type: 'financial' },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last-30-days')
  const [reportType, setReportType] = useState('all')

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Reports & Analytics" userName="Admin User" />

      <main className="p-4 lg:p-8 space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-full sm:w-48">
                <FileText className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="transfers">Transfers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">$910,000</p>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+18.2%</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">$575,000</p>
                  <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">$335,000</p>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+24.8%</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Units Moved</p>
                  <p className="text-2xl font-bold">45,280</p>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>+8.4%</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                  <Package className="h-6 w-6 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Profit Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Revenue & Profit Trend
              </CardTitle>
              <CardDescription>Monthly financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Profit"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Sales by Category
              </CardTitle>
              <CardDescription>Product category distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Movement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Stock Movement
              </CardTitle>
              <CardDescription>Weekly incoming vs outgoing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockMovement}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="incoming" name="Incoming" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outgoing" name="Outgoing" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Regional Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Regional Sales Performance
              </CardTitle>
              <CardDescription>Sales by geographic region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} units`, 'Sales']}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
            <CardDescription>Quick access to commonly used reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <div
                  key={template.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
