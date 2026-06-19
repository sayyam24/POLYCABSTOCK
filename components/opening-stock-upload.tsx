'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Upload } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import type { OpeningStockRow } from '@/lib/types'
import { parseOpeningStockRows } from '@/lib/spreadsheet'
import { toast } from 'sonner'

export function OpeningStockUpload() {
  const { session } = useAuth()
  const { refresh } = useStore()
  const [rows, setRows] = useState<OpeningStockRow[]>([
    { productName: 'NEO+ SLIM LED BATTEN 8W (1 FEET) CW/WW/NW', quantity: 0 },
    { productName: '', quantity: 0 },
  ])

  const addRow = () => setRows((r) => [...r, { productName: '', quantity: 0 }])
  const updateRow = (i: number, patch: Partial<OpeningStockRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const handleSpreadsheet = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseOpeningStockRows(text)
      if (parsed.length) {
        setRows(parsed)
        toast.success(`Loaded ${parsed.length} products from file`)
      } else {
        toast.error('No valid rows found. Use: Product, Quantity')
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (!session) return
    try {
      await electroTrackService.uploadOpeningStock(
        session,
        rows.filter((r) => r.productName && r.quantity > 0),
      )
      refresh()
      toast.success('Stock updated from bill / Excel')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const title =
    session?.role === 'admin'
      ? 'Factory stock (manual or Excel/CSV)'
      : 'Depo stock adjustment (manual or Excel/CSV)'

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="space-y-2">
        <Label>Upload Excel / CSV (Product, Quantity)</Label>
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

      <div className="flex items-center justify-between">
        <Label className="text-base">Line items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Add row
        </Button>
      </div>

      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-7 space-y-1">
            <Label className="text-xs">Product</Label>
            <Input
              value={row.productName}
              onChange={(e) => updateRow(i, { productName: e.target.value })}
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
              onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
              className="h-11"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11"
            disabled={rows.length <= 1}
            onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button size="lg" className="w-full h-12" onClick={handleSubmit}>
        <Upload className="mr-2 h-5 w-5" /> Update stock
      </Button>
    </div>
  )
}
