'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { Product, StockRecord, StockAdjustment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Search, Check, Plus, Minus } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'

interface VerificationItem {
  product: Product
  systemStock: number
  physicalStock: number
  difference: number
}

export default function SubDistributorStockVerificationPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [stock, setStock] = useState<StockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('all')
  const [adjustmentReason, setAdjustmentReason] = useState<StockAdjustment['reason'] | ''>('')
  const [remarks, setRemarks] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)

  useEffect(() => {
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      setProducts(data.products || [])
      setStock(data.stock || [])
      
      initializeVerificationItems(data.products || [], data.stock || [])
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const initializeVerificationItems = (allProducts: Product[], allStock: StockRecord[]) => {
    const orgStock = allStock.filter(s => s.orgId === session?.orgId)
    
    const items: VerificationItem[] = allProducts.map(product => {
      const stockRecord = orgStock.find(s => s.productId === product.id)
      return {
        product,
        systemStock: stockRecord?.quantity || 0,
        physicalStock: stockRecord?.quantity || 0,
        difference: 0,
      }
    })
    
    setVerificationItems(items)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return 'text-green-600 bg-green-50'
    if (difference < 0) return 'text-red-600 bg-red-50'
    return 'text-blue-600 bg-blue-50'
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference === 0) return Check
    if (difference < 0) return Minus
    return Plus
  }

  const handlePhysicalStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setVerificationItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const difference = numValue - item.systemStock
        return { ...item, physicalStock: numValue, difference }
      }
      return item
    }))
  }

  const handleAdjustStock = async (item: VerificationItem) => {
    if (item.difference === 0) {
      toast.info('No difference to adjust')
      return
    }

    if (!adjustmentReason) {
      toast.error('Please select a reason for adjustment')
      return
    }

    if (!session) return

    try {
      setIsAdjusting(true)
      electroTrackService.createStockAdjustment(
        session,
        item.product.id,
        item.product.name,
        item.product.sku,
        item.systemStock,
        item.physicalStock,
        adjustmentReason,
        remarks
      )
      
      toast.success('Stock adjusted successfully')
      loadData()
      setAdjustmentReason('')
      setRemarks('')
    } catch (err) {
      toast.error('Failed to adjust stock')
    } finally {
      setIsAdjusting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="sub_distributor">
        <DashboardHeader title="Stock Verification" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Stock Verification" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Verify Stock</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {filteredProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationItems
                .filter(item => selectedProduct === 'all' || item.product.id === selectedProduct)
                .filter(item => 
                  item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(item => {
                  const DifferenceIcon = getDifferenceIcon(item.difference)
                  return (
                    <div key={item.product.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {item.product.sku}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifferenceColor(item.difference)}`}>
                          <DifferenceIcon className="h-4 w-4 inline mr-1" />
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">System Stock</Label>
                          <div className="text-2xl font-bold">{item.systemStock}</div>
                        </div>
                        <div>
                          <Label htmlFor={`physical-${item.product.id}`} className="text-sm text-muted-foreground">Physical Stock</Label>
                          <Input
                            id={`physical-${item.product.id}`}
                            type="number"
                            value={item.physicalStock}
                            onChange={(e) => handlePhysicalStockChange(item.product.id, e.target.value)}
                            className="text-2xl font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Difference</Label>
                          <div className={`text-2xl font-bold ${getDifferenceColor(item.difference).split(' ')[0]}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </div>
                        </div>
                      </div>

                      {item.difference !== 0 && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="reason">Adjustment Reason *</Label>
                              <Select value={adjustmentReason} onValueChange={(v) => setAdjustmentReason(v as StockAdjustment['reason'])}>
                                <SelectTrigger id="reason">
                                  <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="physical_count_correction">Physical Count Correction</SelectItem>
                                  <SelectItem value="damaged_stock">Damaged Stock</SelectItem>
                                  <SelectItem value="missing_stock">Missing Stock</SelectItem>
                                  <SelectItem value="expired_stock">Expired Stock</SelectItem>
                                  <SelectItem value="manual_correction">Manual Correction</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="remarks">Remarks (Optional)</Label>
                              <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add any additional notes..."
                                className="h-[42px]"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAdjustStock(item)}
                            disabled={isAdjusting || !adjustmentReason}
                            className="w-full"
                          >
                            {isAdjusting ? 'Adjusting...' : 'Adjust Stock'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            
            {verificationItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
