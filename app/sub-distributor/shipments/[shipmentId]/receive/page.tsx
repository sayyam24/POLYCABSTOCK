'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { Shipment, ShortageReason } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package, CheckCircle, AlertTriangle, Upload, Loader2 } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReceivedItem {
  productId: string
  productName: string
  dispatchedQuantity: number
  receivedQuantity: number
}

export default function SubDistributorReceiveShipmentPage({ params }: { params: { shipmentId: string } }) {
  const { session } = useAuth()
  const router = useRouter()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReceiving, setIsReceiving] = useState(false)
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([])
  const [shortageReason, setShortageReason] = useState<ShortageReason>('other')
  const [remarks, setRemarks] = useState('')
  const [hasShortage, setHasShortage] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<Array<{ productName: string; quantity: number }>>([])
  const [showParsed, setShowParsed] = useState(false)

  useEffect(() => {
    loadShipment()
  }, [params.shipmentId])

  const loadShipment = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      const found = (data.shipments || []).find((s: Shipment) => s.id === params.shipmentId)
      
      if (!found) {
        toast.error('Shipment not found')
        router.back()
        return
      }
      
      if (found.receiverOrgId !== session?.orgId) {
        toast.error('You are not the receiver of this shipment')
        router.back()
        return
      }
      
      if (found.status !== 'sent') {
        toast.error('This shipment has already been processed')
        router.back()
        return
      }
      
      setShipment(found)
      
      // Don't auto-populate items - force PDF parsing
      setReceivedItems([])
    } catch (err) {
      toast.error('Failed to load shipment')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleReceivedQuantityChange = (index: number, value: number) => {
    const newItems = [...receivedItems]
    newItems[index].receivedQuantity = Math.max(0, value)
    setReceivedItems(newItems)
    
    const hasAnyShortage = newItems.some(item => item.receivedQuantity < item.dispatchedQuantity)
    setHasShortage(hasAnyShortage)
  }

  const handleParseInvoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    setIsParsing(true)
    try {
      const base64 = await fileToBase64(file)
      
      const res = await fetch('/api/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData: base64,
          products: [],
          productAliases: []
        })
      })

      const data = await res.json()
      
      if (data.success && data.invoice_data?.items) {
        setParsedItems(data.invoice_data.items)
        setShowParsed(true)
        toast.success('Invoice parsed successfully')
      } else {
        toast.error(data.error || 'Failed to parse invoice')
      }
    } catch (err) {
      toast.error('Failed to parse invoice')
    } finally {
      setIsParsing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
    })
  }

  const handleConfirmParsed = () => {
    // Convert parsed items to received items format
    const newReceivedItems = parsedItems.map((item, index) => ({
      productId: `parsed_${index}`,
      productName: item.productName,
      dispatchedQuantity: item.quantity,
      receivedQuantity: item.quantity,
    }))
    setReceivedItems(newReceivedItems)
    setShowParsed(false)
  }

  const handleReceive = async () => {
    if (!shipment || !session) return

    try {
      setIsReceiving(true)
      
      const itemsWithShortage = receivedItems.filter(item => item.receivedQuantity < item.dispatchedQuantity)
      
      if (itemsWithShortage.length > 0 && !shortageReason) {
        toast.error('Please select a reason for the shortage')
        setIsReceiving(false)
        return
      }

      electroTrackService.receiveShipmentPartial(
        session,
        shipment.id,
        receivedItems,
        shortageReason,
        remarks
      )
      
      toast.success('Shipment received successfully')
      router.push(`/sub-distributor/shipments/${shipment.id}`)
    } catch (err) {
      toast.error('Failed to receive shipment')
    } finally {
      setIsReceiving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="sub_distributor">
        <DashboardHeader title="Receive Shipment" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  if (!shipment) {
    return null
  }

  const totalDispatched = receivedItems.reduce((sum, item) => sum + item.dispatchedQuantity, 0)
  const totalReceived = receivedItems.reduce((sum, item) => sum + item.receivedQuantity, 0)
  const totalShortage = totalDispatched - totalReceived

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Receive Shipment" />
      <main className="p-4 lg:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Invoice Number</div>
                <div className="font-medium">{shipment.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shipment ID</div>
                <div className="font-medium">{shipment.shipmentNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sender</div>
                <div className="font-medium">{shipment.senderName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shipment Date</div>
                <div className="font-medium">{new Date(shipment.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Invoice Parsing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showParsed && parsedItems.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 space-y-2">
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
                      onClick={() => setShowParsed(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmParsed}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Use Parsed Data
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleParseInvoice}
                    className="hidden"
                    id="parse-invoice"
                  />
                  <label htmlFor="parse-invoice">
                    <Button
                      variant="outline"
                      size="lg"
                      className="cursor-pointer"
                      disabled={isParsing}
                      asChild
                    >
                      <span>
                        {isParsing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Parsing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-5 w-5" /> Upload & Parse Invoice PDF
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload the invoice PDF to extract product data automatically
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items to Receive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {receivedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No items to receive. Upload and parse an invoice above to populate items.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {receivedItems.map((item, index) => {
                    const shortage = item.dispatchedQuantity - item.receivedQuantity
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium">{item.productName}</div>
                          {shortage > 0 && (
                            <div className="text-red-600 font-medium">
                              Shortage: {shortage}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Dispatched Qty</Label>
                            <div className="text-lg font-semibold">{item.dispatchedQuantity}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Received Qty</Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.dispatchedQuantity}
                              value={item.receivedQuantity}
                              onChange={(e) => handleReceivedQuantityChange(index, parseInt(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Shortage</Label>
                            <div className={`text-lg font-semibold mt-1 ${shortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {shortage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Total Dispatched</div>
                    <div className="font-bold">{totalDispatched}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="font-medium">Total Received</div>
                    <div className="font-bold">{totalReceived}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="font-medium">Total Shortage</div>
                    <div className={`font-bold ${totalShortage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalShortage}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {hasShortage && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Shortage Reason Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Reason for Shortage</Label>
                  <Select value={shortageReason} onValueChange={(v) => setShortageReason(v as ShortageReason)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damaged_during_transport">Damaged During Transport</SelectItem>
                      <SelectItem value="missing_items">Missing Items</SelectItem>
                      <SelectItem value="wrong_quantity_sent">Wrong Quantity Sent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remarks (Optional)</Label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional notes..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Please Confirm</div>
                <div className="text-sm text-yellow-700 mt-1">
                  By confirming, you will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Deduct stock from sender: {shipment.senderName}</li>
                    <li>Add stock to your inventory ({totalReceived} units)</li>
                    <li>Update the Stock Ledger</li>
                    {totalShortage > 0 && (
                      <>
                        <li>Mark shipment as Partially Received</li>
                        <li>Create shortage records for missing items</li>
                      </>
                    )}
                    {totalShortage === 0 && (
                      <li>Mark shipment as Received</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReceive}
            disabled={isReceiving}
            className="flex-1"
          >
            {isReceiving ? 'Receiving...' : 'Confirm & Receive'}
          </Button>
        </div>
      </main>
    </DashboardLayout>
  )
}
