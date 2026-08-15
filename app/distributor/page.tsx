'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
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
  Search,
  Filter,
  Sparkles,
  Zap,
  Truck,
  BarChart3,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useEffect, useState } from 'react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useRouter } from 'next/navigation'


export default function DistributorDashboard() {
  const { session } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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
  const [stockItems, setStockItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [stockByCategoryState, setStockByCategoryState] = useState<Record<string, number>>({})
  const [categoriesState, setCategoriesState] = useState<string[]>([])

  // Stock with product details - aggregated by product
  const stockWithProducts = stockItems.map(s => ({
    ...s,
    productName: products.find(p => p.id === s.productId)?.name || s.productName || 'Unknown',
    sku: products.find(p => p.id === s.productId)?.sku || '',
    category: products.find(p => p.id === s.productId)?.category || 'Uncategorized'
  }))

  // Aggregate quantities by product (handle duplicates)
  const aggregatedStock = stockWithProducts.reduce((acc: Record<string, any>, item: any) => {
    const key = item.productId
    if (!acc[key]) {
      acc[key] = {
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        category: item.category,
        quantity: 0
      }
    }
    acc[key].quantity += item.quantity
    return acc
  }, {})

  const aggregatedStockArray = Object.values(aggregatedStock) as any[]

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Get unique categories and filter out generic ones
  const uniqueCategories = Array.from(new Set(aggregatedStockArray.map((s: any) => s.category)))
    .filter((cat: string) => cat !== 'Uncategorized' && cat !== 'General' && cat !== 'general')
    .sort()

  // Filter stock based on search and category
  const filteredStock = aggregatedStockArray.filter((item: any) => {
    const matchesSearch = searchTerm === '' || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a: any, b: any) => b.quantity - a.quantity)

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
          
          // Calculate stock by category
          const stockByCategory = orgStock.reduce((acc: Record<string, number>, s: any) => {
            const product = data.products?.find((p: any) => p.id === s.productId)
            const category = product?.category || 'Uncategorized'
            acc[category] = (acc[category] || 0) + s.quantity
            return acc
          }, {})
          
          const categories = Object.keys(stockByCategory)
            .filter((cat: string) => cat !== 'Uncategorized' && cat !== 'General' && cat !== 'general')
            .sort()
          
          setStockItems(orgStock)
          setProducts(data.products || [])
          setStockByCategoryState(stockByCategory)
          setCategoriesState(categories)
          
          setInventoryStats({
            totalInventory,
            incomingStock: 0,
            outgoingStock: 0,
            activeRetailers: 0
          })
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (loading) {
    return (
      <DashboardLayout role="distributor">
        <DashboardHeader title="Distributor Dashboard" userName="Distributor Corp" />
        <main className="p-4 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Distributor Dashboard" userName="Distributor Corp" />
      
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
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Inventory</p>
                  <p className="text-3xl font-bold">{inventoryStats.totalInventory.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                  <ArrowDownRight className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Incoming Stock</p>
                  <p className="text-3xl font-bold">{inventoryStats.incomingStock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Outgoing Stock</p>
                  <p className="text-3xl font-bold">{inventoryStats.outgoingStock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Retailers</p>
                  <p className="text-3xl font-bold">{inventoryStats.activeRetailers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock by Product */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Stock by Product</CardTitle>
              </div>
              {aggregatedStockArray.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {aggregatedStockArray.length} products
                  </span>
                </div>
              )}
            </div>
            <CardDescription>Individual product inventory levels</CardDescription>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 border-border/50 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 w-[280px] border-border/50 focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {aggregatedStockArray.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No stock data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock
                      .filter((s: any) => s.quantity > 0)
                      .slice(0, 20)
                      .map((item: any, index: number) => (
                      <tr key={`${item.productId}-${index}`} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 font-medium">{item.productName}</td>
                        <td className="py-4 px-4 text-muted-foreground font-mono text-sm">{item.sku}</td>
                        <td className="py-4 px-4">
                          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-lg">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStock.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products match your filters</p>
                  </div>
                )}
                {filteredStock.length > 20 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Showing top 20 of {filteredStock.length} products
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock by Category Summary */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-semibold">Stock by Category</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {categoriesState.length === 0 ? (
              <p className="text-muted-foreground">No stock data available</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {categoriesState.map((category) => (
                  <div key={category} className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-border/50 hover:shadow-md transition-shadow">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{category}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{stockByCategoryState[category]}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Verification Summary Card */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-semibold">Stock Verification Summary</CardTitle>
            </div>
            <CardDescription>Monthly stock adjustment overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-border/50">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Last Verification Date</div>
                <div className="text-lg font-semibold">
                  {stockSummary.lastVerificationDate 
                    ? new Date(stockSummary.lastVerificationDate).toLocaleDateString() 
                    : 'Never verified'}
                </div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-border/50">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Total Adjustments This Month</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{stockSummary.totalAdjustmentsThisMonth}</div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-border/50">
                <div className="text-sm font-semibold text-muted-foreground mb-2">Total Difference Adjusted</div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{stockSummary.totalDifferenceAdjusted}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Receives Widget */}
        {pendingReceives > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-900/50 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <CardTitle className="text-xl font-semibold text-yellow-800 dark:text-yellow-400">
                  Pending Receives ({pendingReceives})
                </CardTitle>
              </div>
              <CardDescription>Shipments waiting to be received</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push('/distributor/shipments')}
                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white shadow-lg shadow-yellow-500/25"
              >
                <Truck className="h-4 w-4 mr-2" />
                View Shipments
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Flow Chart */}
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Stock Flow</CardTitle>
              </div>
              <CardDescription>Incoming vs Outgoing inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet. Upload invoices to see stock flow data.
              </div>
            </CardContent>
          </Card>

          {/* Retailer Performance */}
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Retailer Performance</CardTitle>
              </div>
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
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-semibold">Pending Orders</CardTitle>
              </div>
              <CardDescription>Orders awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No pending orders
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="lg:col-span-2 border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-semibold">Top Products</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-indigo-100 dark:hover:bg-indigo-950/30">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Best selling items this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No data available yet. Upload invoices to see top products.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deliveries */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-semibold">Recent Deliveries</CardTitle>
            </div>
            <CardDescription>Successfully completed deliveries</CardDescription>
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
