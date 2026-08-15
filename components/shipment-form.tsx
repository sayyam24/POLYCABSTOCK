'use client'

import * as React from 'react'
import { Plus, Trash2, Upload, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Organization, Product, ShipmentItem } from '@/lib/types'
import { parseShipmentItemsFromSpreadsheet } from '@/lib/spreadsheet'
import { toast } from 'sonner'

export interface ShipmentFormData {
  receiverOrgId: string
  invoiceNumber: string
  invoiceFileName?: string
  invoiceDataUrl?: string
  items: ShipmentItem[]
  notes?: string
}

interface ShipmentFormProps {
  receivers: Organization[]
  products: Product[]
  stockQuantities: Record<string, number>
  onSubmit: (data: ShipmentFormData) => void | Promise<void>
  submitLabel?: string
  /** Distributor → retailer: bill copy required */
  requireBillCopy?: boolean
}

const emptyRow = (): ShipmentItem => ({
  productId: '',
  productName: '',
  quantity: 0,
  notes: '',
})

export function ShipmentForm({
  receivers,
  products,
  stockQuantities,
  onSubmit,
  submitLabel = 'Send shipment (bill / Excel)',
  requireBillCopy = false,
}: ShipmentFormProps) {
  const [receiverOrgId, setReceiverOrgId] = React.useState(receivers[0]?.id ?? '')
  const [invoiceNumber, setInvoiceNumber] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [invoiceFileName, setInvoiceFileName] = React.useState<string>()
  const [invoiceDataUrl, setInvoiceDataUrl] = React.useState<string>()
  const [invoiceFiles, setInvoiceFiles] = React.useState<File[]>([])
  const [rows, setRows] = React.useState<ShipmentItem[]>([emptyRow()])
  const [loading, setLoading] = React.useState(false)
  const [parsing, setParsing] = React.useState(false)
  const [error, setError] = React.useState('')

  const effectiveReceiverOrgId =
    receiverOrgId || receivers[0]?.id || ''

  const updateRow = (index: number, patch: Partial<ShipmentItem>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    updateRow(index, {
      productId,
      productName: product?.name ?? '',
    })
  }

  const handleInvoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    // Support both single and multiple file uploads
    if (files.length === 1) {
      const file = files[0]
      setInvoiceFileName(file.name)
      const reader = new FileReader()
      reader.onload = () => {
        setInvoiceDataUrl(typeof reader.result === 'string' ? reader.result : undefined)
      }
      reader.readAsDataURL(file)
    } else {
      // Bulk upload mode
      setInvoiceFiles(files)
      setInvoiceFileName(`${files.length} invoices selected`)
    }
  }

  const handleBulkParse = async () => {
    if (invoiceFiles.length === 0) {
      toast.error('Please select PDF files first')
      return
    }

    setParsing(true)
    setError('')

    try {
      // Convert files to base64
      const pdfFiles = await Promise.all(
        invoiceFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]
              resolve(base64)
            }
            reader.readAsDataURL(file)
          })
        })
      )

      // Prepare products for matching
      const productsForMatching = products.map(p => ({
        id: p.id,
        code: p.sku || '',
        name: p.name
      }))

      // Call bulk parsing API
      const res = await fetch('/api/parse-bulk-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfFiles,
          products: productsForMatching
        })
      })

      if (!res.ok) {
        throw new Error('Failed to parse invoices')
      }

      const data = await res.json()
      
      if (data.success && data.results) {
        // Process results - for now, just use the first successful invoice
        const successfulResults = data.results.filter((r: any) => r.success && !r.duplicate)
        
        if (successfulResults.length === 0) {
          toast.error('No valid invoices found (all duplicates or parsing failed)')
          return
        }

        // Use the first successful invoice
        const firstResult = successfulResults[0]
        
        if (firstResult.invoice_number && !invoiceNumber) {
          setInvoiceNumber(firstResult.invoice_number)
        }

        // Convert parsed items to shipment items
        const parsedItems = firstResult.items
          .filter((item: any) => item.matched || item.match_type === 'manual_review')
          .map((item: any) => ({
            productId: item.matched_product_id || '',
            productName: item.matched_product_name || item.product_name,
            quantity: item.quantity,
            notes: item.matched ? '' : 'Manual review required'
          }))

        if (parsedItems.length > 0) {
          setRows(parsedItems)
          setInvoiceNumber(firstResult.invoice_number || invoiceNumber)
          toast.success(`Parsed ${parsedItems.length} items from ${successfulResults.length} invoices`)
          
          // Show detailed breakdown
          console.log('Parsing Results:', {
            invoicesProcessed: successfulResults.length,
            itemsExtracted: parsedItems.length,
            extractionMethod: firstResult.extraction_method,
            matchedItems: parsedItems.filter((i: any) => i.notes === '').length,
            manualReviewItems: parsedItems.filter((i: any) => i.notes !== '').length
          })
        } else {
          toast.error('No items could be extracted from invoices')
        }

        // Show summary
        if (data.summary) {
          toast.info(`Processed ${data.summary.total} invoices: ${data.summary.success} success, ${data.summary.failed} failed, ${data.summary.duplicates} duplicates`)
        }
      }
    } catch (err) {
      console.error('Bulk parsing error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to parse invoices')
    } finally {
      setParsing(false)
    }
  }

  const handleItemsSpreadsheet = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseShipmentItemsFromSpreadsheet(text, products)
      if (parsed.length) {
        setRows(parsed)
        toast.success(`Loaded ${parsed.length} products from file`)
      } else {
        toast.error('No valid rows. Use: Product, Quantity (names must match catalog)')
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!effectiveReceiverOrgId) {
      setError('Select a receiver')
      return
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice / bill number is required')
      return
    }

    if (requireBillCopy && !invoiceFileName && !invoiceDataUrl && invoiceFiles.length === 0) {
      setError('Upload a bill copy for this retailer')
      return
    }

    const items = rows.filter(
      (r) => r.productName && r.quantity > 0 && (r.productId || r.productName),
    )
    
    // Allow PDF-only submission if invoice file is uploaded
    if (!items.length && !invoiceFileName && !invoiceDataUrl && invoiceFiles.length === 0) {
      setError('Add at least one product with quantity or upload an invoice PDF')
      return
    }

    // Only validate stock if manual items are added
    if (items.length > 0) {
      for (const item of items) {
        const product = products.find(
          (p) =>
            p.id === item.productId ||
            p.name.toLowerCase() === item.productName.toLowerCase(),
        )
        const pid = product?.id ?? item.productId
        const available = pid ? (stockQuantities[pid] ?? 0) : 0
        if (!product && !item.productId) {
          setError(`Unknown product: ${item.productName}. Add it to factory stock first.`)
          return
        }
        if (item.quantity > available) {
          setError(`Insufficient stock for ${item.productName} (max ${available})`)
          return
        }
      }
    }

    setLoading(true)
    try {
      await onSubmit({
        receiverOrgId: effectiveReceiverOrgId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceFileName,
        invoiceDataUrl,
        items,
        notes: notes.trim() || undefined,
      })
      setInvoiceNumber('')
      setNotes('')
      setInvoiceFileName(undefined)
      setInvoiceDataUrl(undefined)
      setRows([emptyRow()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send shipment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Receiver</Label>
        <Select value={effectiveReceiverOrgId} onValueChange={setReceiverOrgId}>
          <SelectTrigger className="h-10 border-border/50 focus:border-primary/50">
            <SelectValue placeholder="Select receiver" />
          </SelectTrigger>
          <SelectContent>
            {receivers.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Invoice number</Label>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-001"
            required
            className="h-10 border-border/50 focus:border-primary/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Bill copy {requireBillCopy ? '(required)' : '(optional)'}
          </Label>
          <div className="relative">
            <Input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleInvoiceFile}
              required={requireBillCopy}
              className="h-10 border-border/50 focus:border-primary/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
          {invoiceFiles.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBulkParse}
              disabled={parsing}
              className="mt-2 h-9 border-border/50 hover:bg-accent/50"
            >
              <FileText className="h-4 w-4 mr-2" />
              {parsing ? 'Parsing...' : 'Parse Invoices'}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Single file for manual entry, multiple files for bulk parsing (15-20 PDFs)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Import line items from Excel / CSV</Label>
        <div className="relative">
          <Input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleItemsSpreadsheet(e.target.files[0])}
            className="h-10 border-border/50 focus:border-primary/50 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Columns: Product name, Quantity (same names as in product list).
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Products on bill</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="h-9 border-border/50 hover:bg-accent/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add line
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid gap-3 sm:grid-cols-[1fr_120px_1fr_auto] items-end border border-border/50 rounded-xl p-4 bg-card/50 hover:bg-card transition-colors"
            >
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</Label>
                <Select
                  value={row.productId}
                  onValueChange={(v) => handleProductChange(index, v)}
                >
                  <SelectTrigger className="h-9 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (stock: {stockQuantities[p.id] ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  value={row.quantity || ''}
                  onChange={(e) =>
                    updateRow(index, { quantity: Number(e.target.value) || 0 })
                  }
                  className="h-9 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Line notes</Label>
                <Input
                  value={row.notes ?? ''}
                  onChange={(e) => updateRow(index, { notes: e.target.value })}
                  className="h-9 border-border/50 focus:border-primary/50"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={rows.length <= 1}
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border-border/50 focus:border-primary/50 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 font-medium"
      >
        {loading ? 'Sending...' : submitLabel}
      </Button>
    </form>
  )
}
