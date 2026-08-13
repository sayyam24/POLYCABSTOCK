'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { StatsCard } from '@/components/stats-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { Package, Send, Store, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    .filter(cat => cat !== 'Uncategorized' && cat !== 'General' && cat !== 'general')
    .sort()
  const totalStock = Object.values(stockByCategory).reduce((a, b) => a + b, 0)

  // Stock with product details - aggregated by product
  const stockWithProducts = stock.map(s => ({
    ...s,
    productName: products.find(p => p.id === s.productId)?.name || s.productName || 'Unknown',
    sku: products.find(p => p.id === s.productId)?.sku || '',
    category: products.find(p => p.id === s.productId)?.category || 'Uncategorized'
  }))

  // Aggregate quantities by product (handle duplicates)
  const aggregatedStock = stockWithProducts.reduce((acc, item) => {
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
  }, {} as Record<string, any>)

  const aggregatedStockArray = Object.values(aggregatedStock)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Get unique categories and filter out generic ones
  const uniqueCategories = Array.from(new Set(aggregatedStockArray.map(s => s.category)))
    .filter(cat => cat !== 'Uncategorized' && cat !== 'General' && cat !== 'general')
    .sort()

  // Filter stock based on search and category
  const filteredStock = aggregatedStockArray.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  }).sort((a, b) => b.quantity - a.quantity)

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Sub Distributor Dashboard" notificationsHref="/sub-distributor/notifications" />
      <main className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Total Stock" value={totalStock} icon={Package} />
          <StatsCard title="Pending" value={pending} change="Incoming shipments" icon={Send} />
          <StatsCard title="Retailers" value="—" icon={Store} />
        </div>

        {/* Individual Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Product</CardTitle>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
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
              <p className="text-muted-foreground">No stock data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Product</th>
                      <th className="text-left py-2 px-3">SKU</th>
                      <th className="text-left py-2 px-3">Category</th>
                      <th className="text-right py-2 px-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock
                      .filter(s => s.quantity > 0)
                      .map((item, index) => (
                      <tr key={`${item.productId}-${index}`} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{item.productName}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.sku}</td>
                        <td className="py-2 px-3 text-muted-foreground">{item.category}</td>
                        <td className="py-2 px-3 text-right font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStock.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No products match your filters</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock by Category Summary */}
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
