'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { StockRecord, Shipment, StockAdjustment, BulkUploadInvoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, AlertCircle, Copy, Truck, RotateCcw, RefreshCw, XCircle } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface NegativeStockItem {
  product: StockRecord
  lastTransaction?: string
  user?: string
}

interface PendingOCRItem {
  invoice: BulkUploadInvoice
  uploadDate: string
  status: string
}

interface DuplicateInvoiceItem {
  invoiceNumber: string
  uploadDate: string
  existingDate: string
}

interface UnmatchedProductItem {
  productName: string
  invoiceNumber: string
  suggestedMatch?: string
}

interface PendingShipmentItem {
  shipment: Shipment
  daysPending: number
}

export default function SubDistributorStockHealthPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const [negativeStock, setNegativeStock] = useState<NegativeStockItem[]>([])
  const [pendingOCR, setPendingOCR] = useState<PendingOCRItem[]>([])
  const [duplicateInvoices, setDuplicateInvoices] = useState<DuplicateInvoiceItem[]>([])
  const [unmatchedProducts, setUnmatchedProducts] = useState<UnmatchedProductItem[]>([])
  const [pendingShipments, setPendingShipments] = useState<PendingShipmentItem[]>([])
  const [recentAdjustments, setRecentAdjustments] = useState<StockAdjustment[]>([])

  const [summary, setSummary] = useState({
    negativeStock: 0,
    pendingOCR: 0,
    duplicateInvoices: 0,
    unmatchedProducts: 0,
    pendingShipments: 0,
    recentAdjustments: 0,
  })

  useEffect(() => {
    loadHealthData()
    
    if (autoRefresh) {
      const interval = setInterval(loadHealthData, 60000)
      return () => clearInterval(interval)
    }
  }, [session, autoRefresh])

  const loadHealthData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      
      const orgStock = (data.stock || []).filter((s: StockRecord) => s.orgId === session?.orgId)
      const negativeItems = orgStock.filter((s: StockRecord) => s.quantity < 0).map((s: StockRecord) => ({
        product: s,
        lastTransaction: new Date(s.updatedAt).toLocaleString(),
      }))
      setNegativeStock(negativeItems)

      const batches = (data.bulkUploadBatches || []).filter((b: any) => b.uploadedBy === session?.userId)
      const pendingOCRItems: PendingOCRItem[] = []
      batches.forEach((batch: any) => {
        batch.invoices.forEach((invoice: BulkUploadInvoice) => {
          if (invoice.status === 'pending_mapping' || invoice.status === 'ocr_failed') {
            pendingOCRItems.push({
              invoice,
              uploadDate: new Date(invoice.createdAt).toLocaleString(),
              status: invoice.status,
            })
          }
        })
      })
      setPendingOCR(pendingOCRItems)

      setDuplicateInvoices([])
      setUnmatchedProducts([])

      const shipments = (data.shipments || [])
      const pendingItems = shipments
        .filter((s: Shipment) => 
          (s.senderOrgId === session?.orgId || s.receiverOrgId === session?.orgId) && s.status === 'sent'
        )
        .map((s: Shipment) => {
          const createdDate = new Date(s.createdAt)
          const now = new Date()
          const daysPending = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
          return { shipment: s, daysPending }
        })
        .sort((a: PendingShipmentItem, b: PendingShipmentItem) => b.daysPending - a.daysPending)
      setPendingShipments(pendingItems)

      const adjustments = (data.stockAdjustments || [])
        .filter((adj: StockAdjustment) => adj.orgId === session?.orgId)
        .sort((a: StockAdjustment, b: StockAdjustment) => 
          new Date(b.adjustedDate).getTime() - new Date(a.adjustedDate).getTime()
        )
        .slice(0, 10)
      setRecentAdjustments(adjustments)

      setSummary({
        negativeStock: negativeItems.length,
        pendingOCR: pendingOCRItems.length,
        duplicateInvoices: 0,
        unmatchedProducts: 0,
        pendingShipments: pendingItems.length,
        recentAdjustments: adjustments.length,
      })

      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadHealthData()
    toast.success('Data refreshed')
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
    toast.info(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled (60s)')
  }

  if (loading) {
    return (
      <DashboardLayout role="sub_distributor">
        <DashboardHeader title="Stock Health" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Stock Health" />
      <main className="p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoRefresh}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh: {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('negative-stock')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Negative Stock</p>
                  <p className="text-2xl font-bold text-red-600">{summary.negativeStock}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('pending-ocr')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending OCR</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pendingOCR}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('duplicate-invoices')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.duplicateInvoices}</p>
                </div>
                <Copy className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('unmatched-products')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unmatched</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.unmatchedProducts}</p>
                </div>
                <XCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('pending-shipments')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.pendingShipments}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => document.getElementById('recent-adjustments')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Adjustments</p>
                  <p className="text-2xl font-bold text-green-600">{summary.recentAdjustments}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card id="negative-stock" className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <TrendingDown className="h-5 w-5" />
              Negative Stock ({negativeStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {negativeStock.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No negative stock items
              </div>
            ) : (
              <div className="space-y-2">
                {negativeStock.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="font-medium">{item.product.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {item.product.quantity} • Last: {item.lastTransaction}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/sub-distributor/ledger')}
                    >
                      View Ledger
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="pending-ocr" className="mb-6 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Pending OCR Review ({pendingOCR.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOCR.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No pending OCR reviews
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOCR.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <div className="font-medium">{item.invoice.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Uploaded: {item.uploadDate} • Status: {item.status}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                      <Button size="sm">
                        Retry
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="duplicate-invoices" className="mb-6 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Copy className="h-5 w-5" />
              Duplicate Invoice Warning ({duplicateInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {duplicateInvoices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No duplicate invoices
              </div>
            ) : (
              <div className="space-y-2">
                {duplicateInvoices.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <div className="font-medium">{item.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Uploaded: {item.uploadDate} • Existing: {item.existingDate}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        View Existing
                      </Button>
                      <Button size="sm" variant="destructive">
                        Replace
                      </Button>
                      <Button size="sm" variant="ghost">
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="unmatched-products" className="mb-6 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <XCircle className="h-5 w-5" />
              Unmatched Products ({unmatchedProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unmatchedProducts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No unmatched products
              </div>
            ) : (
              <div className="space-y-2">
                {unmatchedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Invoice: {item.invoiceNumber}
                        {item.suggestedMatch && ` • Suggested: ${item.suggestedMatch}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Map Product
                      </Button>
                      <Button size="sm" variant="outline">
                        Create Alias
                      </Button>
                      <Button size="sm" variant="ghost">
                        Ignore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="pending-shipments" className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Truck className="h-5 w-5" />
              Pending Shipments ({pendingShipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingShipments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No pending shipments
              </div>
            ) : (
              <div className="space-y-2">
                {pendingShipments.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <div className="font-medium">{item.shipment.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.shipment.senderName} → {item.shipment.receiverName}
                        {item.daysPending > 0 && ` • ${item.daysPending} days pending`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/sub-distributor/shipments/${item.shipment.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="recent-adjustments" className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <RotateCcw className="h-5 w-5" />
              Recent Stock Adjustments ({recentAdjustments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAdjustments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No recent adjustments
              </div>
            ) : (
              <div className="space-y-2">
                {recentAdjustments.map((adj, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium">{adj.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        {adj.adjustmentQuantity > 0 ? '+' : ''}{adj.adjustmentQuantity} • {adj.reason}
                        {` • ${new Date(adj.adjustedDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {adj.adjustedByName}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
