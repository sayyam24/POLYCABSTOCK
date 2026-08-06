'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { StockAdjustment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Calendar } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'

export default function SubDistributorAdjustmentHistoryPage() {
  const { session } = useAuth()
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterReason, setFilterReason] = useState('')

  useEffect(() => {
    loadAdjustments()
  }, [session])

  const loadAdjustments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      const orgAdjustments = (data.stockAdjustments || []).filter((adj: StockAdjustment) => adj.orgId === session?.orgId)
      setAdjustments(orgAdjustments)
    } catch (err) {
      console.error('Failed to load adjustments')
    } finally {
      setLoading(false)
    }
  }

  const getReasonLabel = (reason: StockAdjustment['reason']) => {
    const labels: Record<StockAdjustment['reason'], string> = {
      physical_count_correction: 'Physical Count Correction',
      damaged_stock: 'Damaged Stock',
      missing_stock: 'Missing Stock',
      expired_stock: 'Expired Stock',
      manual_correction: 'Manual Correction',
      other: 'Other',
    }
    return labels[reason] || reason
  }

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return 'text-green-600'
    if (difference < 0) return 'text-red-600'
    return 'text-blue-600'
  }

  const filteredAdjustments = adjustments.filter(adj => {
    const matchesSearch = 
      adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDate = !filterDate || adj.adjustedDate.startsWith(filterDate)
    const matchesReason = !filterReason || adj.reason === filterReason

    return matchesSearch && matchesDate && matchesReason
  })

  if (loading) {
    return (
      <DashboardLayout role="sub_distributor">
        <DashboardHeader title="Adjustment History" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Adjustment History" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment History</CardTitle>
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
              <Input
                type="date"
                placeholder="Filter by date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-[180px]"
              />
              <Select value={filterReason} onValueChange={setFilterReason}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Reasons</SelectItem>
                  <SelectItem value="physical_count_correction">Physical Count Correction</SelectItem>
                  <SelectItem value="damaged_stock">Damaged Stock</SelectItem>
                  <SelectItem value="missing_stock">Missing Stock</SelectItem>
                  <SelectItem value="expired_stock">Expired Stock</SelectItem>
                  <SelectItem value="manual_correction">Manual Correction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAdjustments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No adjustments found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date & Time</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">System Stock</th>
                      <th className="text-left py-3 px-4">Physical Stock</th>
                      <th className="text-left py-3 px-4">Difference</th>
                      <th className="text-left py-3 px-4">Adjustment Qty</th>
                      <th className="text-left py-3 px-4">Reason</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdjustments.map((adj) => (
                      <tr key={adj.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          {new Date(adj.adjustedDate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{adj.productName}</div>
                          <div className="text-xs text-muted-foreground">{adj.productCode}</div>
                        </td>
                        <td className="py-3 px-4">{adj.systemStock}</td>
                        <td className="py-3 px-4">{adj.physicalStock}</td>
                        <td className={`py-3 px-4 font-semibold ${getDifferenceColor(adj.difference)}`}>
                          {adj.difference > 0 ? '+' : ''}{adj.difference}
                        </td>
                        <td className={`py-3 px-4 font-semibold ${getDifferenceColor(adj.adjustmentQuantity)}`}>
                          {adj.adjustmentQuantity > 0 ? '+' : ''}{adj.adjustmentQuantity}
                        </td>
                        <td className="py-3 px-4">{getReasonLabel(adj.reason)}</td>
                        <td className="py-3 px-4">{adj.adjustedByName}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {adj.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredAdjustments.length} of {adjustments.length} adjustments
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
