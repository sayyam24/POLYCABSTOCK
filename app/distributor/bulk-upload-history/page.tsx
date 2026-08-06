'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { BulkUploadBatch } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Calendar, FileText, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function BulkUploadHistoryPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [batches, setBatches] = useState<BulkUploadBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadBatches()
  }, [session])

  const loadBatches = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      setBatches(data.bulkUploadBatches || [])
    } catch (err) {
      toast.error('Failed to load upload history')
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter(batch =>
    batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.uploadedByName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'partial_success': return 'text-yellow-600 bg-yellow-50'
      case 'failed': return 'text-red-600 bg-red-50'
      case 'processing': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'partial_success': return AlertCircle
      case 'failed': return XCircle
      case 'processing': return Clock
      default: return FileText
    }
  }

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Bulk Upload History" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Batches</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batch ID or uploader..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upload batches found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.map((batch) => {
                  const StatusIcon = getStatusIcon(batch.status)
                  return (
                    <div
                      key={batch.id}
                      onClick={() => router.push(`/distributor/bulk-upload-history/${batch.batchId}`)}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getStatusColor(batch.status)}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold">{batch.batchId}</div>
                            <div className="text-sm text-muted-foreground">
                              Uploaded by {batch.uploadedByName} on {new Date(batch.uploadDate).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-medium">{batch.totalInvoices} invoices</div>
                            <div className="text-xs text-muted-foreground">
                              {batch.successCount} success, {batch.failedCount} failed
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs">
                        <span className="text-green-600">
                          ✓ {batch.stockUpdatedCount} stock updated
                        </span>
                        {batch.duplicateCount > 0 && (
                          <span className="text-yellow-600">
                            ⚠ {batch.duplicateCount} duplicates
                          </span>
                        )}
                        {batch.pendingMappingCount > 0 && (
                          <span className="text-blue-600">
                            ⏳ {batch.pendingMappingCount} pending mapping
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredBatches.length} of {batches.length} batches
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
