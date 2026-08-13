'use client'

import { SalesmanLayout } from '@/components/salesman-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Package, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'

export default function SalesmanPage() {
  const { session } = useAuth()
  const [stock, setStock] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [distributor, setDistributor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!session) return
    
    try {
      const headers = {
        'x-user-id': session.userId,
        'x-user-role': session.role,
        'x-org-id': session.orgId,
        'x-distributor-id': session.distributorId || '',
        'x-user-email': session.email,
        'x-user-name': session.name,
      }

      const [stockRes, productsRes, distributorRes] = await Promise.all([
        fetch('/api/salesman/stock', { headers }),
        fetch('/api/salesman/products', { headers }),
        fetch('/api/salesman/distributor', { headers }),
      ])

      if (stockRes.ok) setStock(await stockRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (distributorRes.ok) setDistributor(await distributorRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = stock.filter(item => {
    const product = products.find(p => p.id === item.productId)
    const productName = product?.name || ''
    const productSku = product?.sku || ''
    const category = product?.category || 'Uncategorized'
    
    const matchesSearch = searchTerm === '' || 
      productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      productSku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(products.map(p => p.category))).filter(c => c && c !== 'Uncategorized').sort()

  if (loading) {
    return (
      <SalesmanLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </SalesmanLayout>
    )
  }

  return (
    <SalesmanLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock View</h1>
          <p className="text-gray-600 mt-1">
            {distributor ? `Viewing stock for ${distributor.name}` : 'Loading distributor...'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Inventory ({filteredStock.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">SKU/Product Code</th>
                    <th className="text-left py-3 px-4">Product Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Available Quantity</th>
                    <th className="text-left py-3 px-4">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => {
                    const product = products.find(p => p.id === item.productId)
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{product?.sku || '-'}</td>
                        <td className="py-3 px-4 font-medium">{product?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {product?.category || 'Uncategorized'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-lg">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">pcs</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredStock.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No stock items found matching your filters
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SalesmanLayout>
  )
}
