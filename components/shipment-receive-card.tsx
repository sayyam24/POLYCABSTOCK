'use client'

import { useState } from 'react'
import type { Shipment } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { FileText, CheckCircle2, XCircle, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ShipmentReceiveCardProps {
  shipment: Shipment
  onReceive: (id: string, parsedItems?: Array<{ productName: string; quantity: number }>) => void
  onReject?: (id: string) => void
}

export function ShipmentReceiveCard({
  shipment,
  onReceive,
  onReject,
}: ShipmentReceiveCardProps) {
  const canAct = shipment.status === 'sent' || shipment.status === 'in_transit'
  const [isParsing, setIsParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<Array<{ productName: string; quantity: number }>>([])
  const [showParsed, setShowParsed] = useState(false)

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

  const handleReceiveWithParsed = () => {
    if (parsedItems.length > 0) {
      onReceive(shipment.id, parsedItems)
    } else {
      onReceive(shipment.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">
              {shipment.invoiceNumber} — {shipment.shipmentNumber}
            </CardTitle>
            <CardDescription>
              From {shipment.senderName} · {new Date(shipment.createdAt).toLocaleString()}
            </CardDescription>
          </div>
          <StatusBadge status={shipment.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showParsed && parsedItems.length > 0 ? (
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
                onClick={handleReceiveWithParsed}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Update Stock
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Shipment contents:</p>
              <ul className="space-y-1">
                {shipment.items.map((item, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold">{item.quantity}</span> × {item.productName}
                    {item.notes && (
                      <span className="text-muted-foreground"> — {item.notes}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {shipment.invoiceFileName && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Invoice: {shipment.invoiceFileName}
                {shipment.invoiceStorageUrl && (
                  <a
                    href={shipment.invoiceStorageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    View file
                  </a>
                )}
                {shipment.invoiceDataUrl?.startsWith('data:image') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shipment.invoiceDataUrl}
                    alt="Invoice preview"
                    className="h-16 rounded border object-cover"
                  />
                )}
                {shipment.invoiceDataUrl?.startsWith('data:application/pdf') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = shipment.invoiceDataUrl!
                      link.download = shipment.invoiceFileName || 'invoice.pdf'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            )}

            {canAct && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleParseInvoice}
                    className="hidden"
                    id={`parse-${shipment.id}`}
                  />
                  <label htmlFor={`parse-${shipment.id}`}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 w-full cursor-pointer"
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
                            <Upload className="mr-2 h-5 w-5" /> Upload & Parse Invoice
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Upload the invoice PDF to parse products before receiving
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="default"
                    className="h-12 flex-1"
                    onClick={() => onReceive(shipment.id)}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Accept Shipment
                  </Button>
                  {onReject && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 flex-1"
                      onClick={() => onReject(shipment.id)}
                    >
                      <XCircle className="mr-2 h-5 w-5" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {shipment.notes && (
          <p className="text-sm text-muted-foreground">Note: {shipment.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
