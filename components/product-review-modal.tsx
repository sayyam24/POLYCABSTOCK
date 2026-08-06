'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle>Review Unmatched Products</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please manually select the correct product for each unmatched item
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {unmatchedItems.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Extracted Code</Label>
                    <p className="font-medium">{item.product_code || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Extracted Name</Label>
                    <p className="font-medium">{item.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <p className="font-medium">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <div className="w-64">
                  <Label className="text-xs text-muted-foreground">Select Product</Label>
                  <Select
                    value={selections[index] || ''}
                    onValueChange={(value) => handleProductSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!allSelected}>
              Confirm Selections
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
