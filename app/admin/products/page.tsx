'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'
import { PRODUCT_CATALOG_COUNT } from '@/lib/catalog/products'
import { toast } from 'sonner'

export default function AdminProductsPage() {
  const { refresh } = useStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const products = electroTrackService.getProducts()

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category))
    return ['all', ...Array.from(set).sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    })
  }, [products, search, category])

  const handleReloadCatalog = () => {
    electroTrackService.replaceProductCatalog()
    refresh()
    toast.success(`Loaded ${PRODUCT_CATALOG_COUNT} products from price list. Stock cleared — re-upload factory stock.`)
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Product catalog" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Price list ({products.length} items)</CardTitle>
              <CardDescription>
                MRP, RDP (GST paid), and case lot from your rate charts. Old demo
                products (Fan, Light, Bulb) are removed.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleReloadCatalog}>
              Reload full price list
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search product name or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 text-sm max-w-xs"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All categories' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">MRP (₹)</TableHead>
                    <TableHead className="text-right">RDP (₹)</TableHead>
                    <TableHead className="text-right">Case lot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="max-w-md">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.category}
                      </TableCell>
                      <TableCell className="text-right">{p.mrp}</TableCell>
                      <TableCell className="text-right font-medium">
                        {p.unitPrice}
                      </TableCell>
                      <TableCell className="text-right">{p.caseLot}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No products match.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
