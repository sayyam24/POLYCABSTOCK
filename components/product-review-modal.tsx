'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AlertCircle, Package, X } from 'lucide-react'

interface UnmatchedItem {
  product_code: string
  product_name: string
  quantity: number
  unit: string
}

interface Product {
  id: string
  code: string
  name: string
  sku: string
}

interface ProductReviewModalProps {
  unmatchedItems: UnmatchedItem[]
  products: Product[]
  onConfirm: (matchedItems: Array<{ item: UnmatchedItem; productId: string }>) => void
  onCancel: () => void
}

export function ProductReviewModal({ unmatchedItems, products, onConfirm, onCancel }: ProductReviewModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>({})

  const handleProductSelect = (itemIndex: number, productId: string) => {
    setSelections(prev => ({
      ...prev,
      [itemIndex]: productId
    }))
  }

  const handleConfirm = () => {
    const matchedItems = unmatchedItems.map((item, index) => ({
      item,
      productId: selections[index] || ''
    })).filter(match => match.productId)

    onConfirm(matchedItems)
  }

  const allSelected = unmatchedItems.every((_, index) => selections[index])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[85vh] overflow-hidden border-border/50 shadow-2xl">
        <CardHeader className="border-b border-border/50 pb-4 bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Review Unmatched Products</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Please manually select the correct product for each unmatched item
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="space-y-4">
            {unmatchedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Code</Label>
                      <p className="font-medium mt-1">{item.product_code || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</Label>
                      <p className="font-medium mt-1">{item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Name</Label>
                    <p className="font-medium mt-1">{item.product_name}</p>
                  </div>
                </div>
                <div className="w-72 flex-shrink-0">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Product</Label>
                  <Select
                    value={selections[index] || ''}
                    onValueChange={(value) => handleProductSelect(index, value)}
                  >
                    <SelectTrigger className="h-10 border-border/50 focus:border-primary/50 mt-1">
                      <SelectValue placeholder="Choose product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.code} - {product.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={onCancel}
              className="h-10 border-border/50 hover:bg-accent/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!allSelected}
              className="h-10 font-medium"
            >
              Confirm Selections ({unmatchedItems.length} items)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
