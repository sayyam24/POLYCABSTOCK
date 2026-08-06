'use client'

import * as React from 'react'
import { CheckCircle, AlertCircle, FileText, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

interface ParsedInvoice {
  success: boolean
  invoice_number?: string
  invoice_date?: string
  retailer_name?: string
  items: ParsedItem[]
  extraction_method?: string
  error?: string
  duplicate?: boolean
}

interface ParsedItem {
  productName: string
  productCode?: string
  quantity: number
  unit: string
  matchedProductId?: string
  matchedProductName?: string
  matchType?: string
  confidence?: number
}

interface BulkInvoiceReviewProps {
  parsedInvoices: ParsedInvoice[]
  products: Product[]
  onConfirm: (confirmedInvoices: ParsedInvoice[]) => void
  onCancel: () => void
}

export function BulkInvoiceReview({
  parsedInvoices,
  products,
  onConfirm,
  onCancel,
}: BulkInvoiceReviewProps) {
  const [manualMappings, setManualMappings] = React.useState<Record<string, string>>({})
  const [selectedInvoices, setSelectedInvoices] = React.useState<Set<string>>(new Set())

  const successfulInvoices = parsedInvoices.filter(inv => inv.success && !inv.duplicate)
  const failedInvoices = parsedInvoices.filter(inv => !inv.success || inv.duplicate)

  const unmatchedItems = successfulInvoices.flatMap(inv =>
    inv.items.filter(item => !item.matchedProductId || item.matchType === 'manual_review')
  )

  const handleSelectInvoice = (invoiceNumber: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(invoiceNumber)) {
        newSet.delete(invoiceNumber)
      } else {
        newSet.add(invoiceNumber)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedInvoices.size === successfulInvoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(successfulInvoices.map(inv => inv.invoice_number || '')))
    }
  }

  const handleManualMapping = (itemKey: string, productId: string) => {
    setManualMappings(prev => ({
      ...prev,
      [itemKey]: productId
    }))
  }

  const getMatchTypeColor = (matchType?: string) => {
    switch (matchType) {
      case 'code':
        return 'bg-green-100 text-green-800'
      case 'exact_name':
        return 'bg-blue-100 text-blue-800'
      case 'fuzzy':
        return 'bg-yellow-100 text-yellow-800'
      case 'manual_review':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.95) return 'text-green-600'
    if (confidence >= 0.85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleConfirm = () => {
    // Apply manual mappings
    const updatedInvoices = successfulInvoices.map(inv => {
      if (!selectedInvoices.has(inv.invoice_number || '')) return inv

      const updatedItems = inv.items.map(item => {
        const itemKey = `${inv.invoice_number}-${item.productName}-${item.quantity}`
        const manualProductId = manualMappings[itemKey]
        
        if (manualProductId) {
          const product = products.find(p => p.id === manualProductId)
          return {
            ...item,
            matchedProductId: manualProductId,
            matchedProductName: product?.name,
            matchType: 'manual',
            confidence: 1.0
          }
        }
        return item
      })

      return {
        ...inv,
        items: updatedItems
      }
    })

    const confirmedInvoices = updatedInvoices.filter(inv => 
      selectedInvoices.has(inv.invoice_number || '')
    )

    onConfirm(confirmedInvoices)
  }

  const canConfirm = selectedInvoices.size > 0 && 
    successfulInvoices
      .filter(inv => selectedInvoices.has(inv.invoice_number || ''))
      .every(inv => 
        inv.items.every(item => {
          const itemKey = `${inv.invoice_number}-${item.productName}-${item.quantity}`
          return manualMappings[itemKey] || item.matchedProductId
        })
      )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{parsedInvoices.length}</div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successfulInvoices.length}</div>
              <div className="text-sm text-muted-foreground">Successfully Parsed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{unmatchedItems.length}</div>
              <div className="text-sm text-muted-foreground">Items Need Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedInvoices.length}</div>
              <div className="text-sm text-muted-foreground">Failed/Duplicates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed/Duplicate Invoices */}
      {failedInvoices.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed or Duplicate Invoices ({failedInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedInvoices.map((inv, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{inv.invoice_number || 'Unknown Invoice'}</div>
                      <div className="text-sm text-muted-foreground">
                        {inv.duplicate ? 'Duplicate invoice number' : inv.error || 'Parsing failed'}
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {inv.duplicate ? 'Duplicate' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Successful Invoices */}
      {successfulInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Successfully Parsed Invoices ({successfulInvoices.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedInvoices.size === successfulInvoices.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {successfulInvoices.map((inv, idx) => {
                const invoiceUnmatched = inv.items.filter(item => !item.matchedProductId || item.matchType === 'manual_review')
                const isSelected = selectedInvoices.has(inv.invoice_number || '')
                
                return (
                  <div key={idx} className={`border rounded-lg p-4 ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectInvoice(inv.invoice_number || '')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{inv.invoice_number}</span>
                          <Badge variant="outline">{inv.extraction_method}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {inv.retailer_name} • {inv.invoice_date} • {inv.items.length} items
                        </div>
                        {invoiceUnmatched.length > 0 && (
                          <div className="text-sm text-yellow-600 font-medium">
                            {invoiceUnmatched.length} items require manual mapping
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 ml-6">
                      {inv.items.map((item, itemIdx) => {
                        const needsManual = !item.matchedProductId || item.matchType === 'manual_review'
                        const itemKey = `${inv.invoice_number}-${item.productName}-${item.quantity}`
                        
                        return (
                          <div key={itemIdx} className={`border rounded p-3 ${needsManual ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'}`}>
                            <div className="flex items-start gap-3">
                              <Package className="h-4 w-4 text-muted-foreground mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{item.productName}</span>
                                  {item.productCode && (
                                    <Badge variant="outline" className="text-xs">{item.productCode}</Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    Qty: {item.quantity} {item.unit}
                                  </span>
                                </div>
                                
                                {needsManual ? (
                                  <div className="mt-2">
                                    <Select
                                      value={manualMappings[itemKey] || ''}
                                      onValueChange={(value) => handleManualMapping(itemKey, value)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select product to map..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products.map(product => (
                                          <SelectItem key={product.id} value={product.id}>
                                            {product.name} {product.sku && `(${product.sku})`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getMatchTypeColor(item.matchType)}>
                                      {item.matchType?.replace('_', ' ')}
                                    </Badge>
                                    {item.confidence && (
                                      <span className={`text-sm ${getConfidenceColor(item.confidence)}`}>
                                        {Math.round(item.confidence * 100)}% confidence
                                      </span>
                                    )}
                                    <span className="text-sm text-green-600">
                                      → {item.matchedProductName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          Confirm {selectedInvoices.size} Invoices
        </Button>
      </div>
    </div>
  )
}
