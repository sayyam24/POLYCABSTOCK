'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockTable } from '@/components/products-table'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { StockRecord, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'

export default function RetailerStockPage() {
  const { session } = useAuth()
  const [stock, setStock] = useState<StockRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [manualEntry, setManualEntry] = useState({
    productId: '',
    quantity: 0
  })

  useEffect(() => {
    if (!session) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const res = await fetch('/api/state', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status}`)
        }
        
        const data = await res.json()
        console.log('MongoDB data loaded:', { 
          products: data.products?.length, 
          stock: data.stock?.length,
          orgId: session.orgId 
        })
        
        setProducts(data.products || [])
        setStock((data.stock || []).filter((s: StockRecord) => s.orgId === session.orgId))
      } catch (err) {
        console.error('Failed to load stock:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [session])

  // Combine stock with product details
  const stockWithProducts = stock.map(s => ({
    ...s,
    productName: products.find(p => p.id === s.productId)?.name || s.productName || 'Unknown',
    sku: products.find(p => p.id === s.productId)?.sku || '',
    category: products.find(p => p.id === s.productId)?.category || '',
    unitPrice: products.find(p => p.id === s.productId)?.unitPrice || 0,
    mrp: products.find(p => p.id === s.productId)?.mrp || 0,
    caseLot: products.find(p => p.id === s.productId)?.caseLot || 1,
  }))

  // Filter stock based on search and category
  const filteredStock = stockWithProducts.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  // Handle manual stock update
  const handleManualUpdate = async () => {
    if (!manualEntry.productId || manualEntry.quantity <= 0) return
    
    try {
      const res = await fetch('/api/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: session?.orgId,
          productId: manualEntry.productId,
          quantity: manualEntry.quantity
        })
      })
      
      if (res.ok) {
        // Reload stock data
        const dataRes = await fetch('/api/state', { cache: 'no-store' })
        const data = await dataRes.json()
        setStock((data.stock || []).filter((s: StockRecord) => s.orgId === session?.orgId))
        setShowManualEntry(false)
        setManualEntry({ productId: '', quantity: 0 })
      }
    } catch (err) {
      console.error('Failed to update stock:', err)
    }
  }

  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Current Stock" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Store Inventory</CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowManualEntry(!showManualEntry)}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showManualEntry && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-4">Manual Stock Entry</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={manualEntry.productId} onValueChange={(v) => setManualEntry({...manualEntry, productId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={manualEntry.quantity}
                      onChange={(e) => setManualEntry({...manualEntry, quantity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleManualUpdate}>Update Stock</Button>
                  <Button variant="outline" onClick={() => setShowManualEntry(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">Error: {error}</div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Products: {products.length} | Stock Records: {stock.length} | Showing: {filteredStock.length}
                </div>
                <StockTable rows={filteredStock} />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
