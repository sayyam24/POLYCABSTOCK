'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockTable } from '@/components/products-table'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { useState, useEffect } from 'react'
import type { StockRecord, Product, OpeningStockRow } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Upload, Trash2 } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { parseOpeningStockRows } from '@/lib/spreadsheet'
import { toast } from 'sonner'

export default function SubDistributorStockPage() {
  const { session } = useAuth()
  const { refresh } = useStore()
  const [stock, setStock] = useState<StockRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showBillUpload, setShowBillUpload] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [manualEntry, setManualEntry] = useState({
    productId: '',
    quantity: 0
  })
  const [billRows, setBillRows] = useState<OpeningStockRow[]>([
    { productName: '', quantity: 0 }
  ])
  const [parsedItems, setParsedItems] = useState<Array<{ productName: string; quantity: number }>>([])
  const [showParsedReview, setShowParsedReview] = useState(false)

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

  const stockWithProducts = stock.map(s => ({
    ...s,
    productName: products.find(p => p.id === s.productId)?.name || s.productName || 'Unknown',
    sku: products.find(p => p.id === s.productId)?.sku || '',
    category: products.find(p => p.id === s.productId)?.category || '',
    unitPrice: products.find(p => p.id === s.productId)?.unitPrice || 0,
    mrp: products.find(p => p.id === s.productId)?.mrp || 0,
    caseLot: products.find(p => p.id === s.productId)?.caseLot || 1,
  }))

  const filteredStock = stockWithProducts.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

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
        const dataRes = await fetch('/api/state', { cache: 'no-store' })
        const data = await dataRes.json()
        setStock((data.stock || []).filter((s: StockRecord) => s.orgId === session?.orgId))
        setShowManualEntry(false)
        setManualEntry({ productId: '', quantity: 0 })
        toast.success('Stock updated successfully')
      }
    } catch (err) {
      console.error('Failed to update stock:', err)
      toast.error('Failed to update stock')
    }
  }

  const handleBillUpload = async () => {
    if (!session) return
    try {
      await electroTrackService.uploadOpeningStock(
        session,
        billRows.filter((r) => r.productName && r.quantity > 0),
      )
      refresh()
      const dataRes = await fetch('/api/state', { cache: 'no-store' })
      const data = await dataRes.json()
      setStock((data.stock || []).filter((s: StockRecord) => s.orgId === session?.orgId))
      setShowBillUpload(false)
      setBillRows([{ productName: '', quantity: 0 }])
      toast.success('Stock updated from bill')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleSpreadsheet = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseOpeningStockRows(text)
      if (parsed.length) {
        setBillRows(parsed)
        toast.success(`Loaded ${parsed.length} products from file`)
      } else {
        toast.error('No valid rows found. Use: Product, Quantity')
      }
    }
    reader.readAsText(file)
  }

  const addBillRow = () => setBillRows((r) => [...r, { productName: '', quantity: 0 }])
  const updateBillRow = (i: number, patch: Partial<OpeningStockRow>) =>
    setBillRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const handleConfirmParsed = () => {
    setBillRows(parsedItems.map((item) => ({
      productName: item.productName,
      quantity: item.quantity
    })))
    setShowParsedReview(false)
  }

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Stock" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Stock</CardTitle>
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
              <Button onClick={() => setShowManualEntry(!showManualEntry)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
              <Button onClick={() => setShowBillUpload(!showBillUpload)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Bill
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

            {showBillUpload && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-semibold mb-4">Upload Bill for Stock Update</h3>
                
                {showParsedReview && parsedItems.length > 0 ? (
                  <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Parsed Invoice Items:</p>
                    <ul className="space-y-1">
                      {parsedItems.map((item, i) => (
                        <li key={i} className="text-sm text-blue-800 dark:text-blue-200">
                          <span className="font-semibold">{item.quantity}</span> × {item.productName}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowParsedReview(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleConfirmParsed}
                      >
                        <Upload className="mr-2 h-4 w-4" /> Use Parsed Data
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                      <Label>Upload PDF Invoice</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        className="h-12"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          try {
                            const reader = new FileReader()
                            reader.onload = async () => {
                              const result = reader.result as string
                              const base64 = result.split(',')[1] // Remove data URL prefix
                              const res = await fetch('/api/process-invoice', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  pdfData: base64,
                                  products: products.map(p => ({ id: p.id, code: p.sku, name: p.name })),
                                  productAliases: [],
                                })
                              })
                              const data = await res.json()
                              console.log('Parse response:', data)
                              if (data.success && data.invoice_data?.items) {
                                setParsedItems(data.invoice_data.items)
                                setShowParsedReview(true)
                                toast.success(`Parsed ${data.invoice_data.items.length} products from PDF`)
                              } else {
                                console.error('Parse failed:', data.error)
                                toast.error(data.error || 'Failed to parse PDF. Try manual entry.')
                              }
                            }
                            reader.readAsDataURL(file)
                          } catch (err) {
                            console.error('PDF processing error:', err)
                            toast.error('Failed to process PDF')
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Or Upload Excel / CSV (Product, Quantity)</Label>
                      <Input
                        type="file"
                        accept=".csv,.txt,.xlsx,.xls"
                        className="h-12"
                        onChange={(e) => e.target.files?.[0] && handleSpreadsheet(e.target.files[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Save Excel as CSV if needed. Columns: product name, quantity.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base">Bill Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBillRow}>
                    <Plus className="h-4 w-4 mr-1" /> Add row
                  </Button>
                </div>

                {billRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end mb-2">
                    <div className="col-span-7 space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Input
                        value={row.productName}
                        onChange={(e) => updateBillRow(i, { productName: e.target.value })}
                        className="h-11"
                        placeholder="Fan"
                      />
                    </div>
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        value={row.quantity || ''}
                        onChange={(e) => updateBillRow(i, { quantity: Number(e.target.value) })}
                        className="h-11"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11"
                      disabled={billRows.length <= 1}
                      onClick={() => setBillRows((r) => r.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleBillUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Update Stock from Bill
                  </Button>
                  <Button variant="outline" onClick={() => setShowBillUpload(false)}>Cancel</Button>
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
