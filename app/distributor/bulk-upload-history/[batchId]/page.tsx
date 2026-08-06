'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { BulkUploadBatch, BulkUploadInvoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Download, Trash2, Eye, FileText, CheckCircle, XCircle, Clock, AlertCircle, Copy } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function BatchDetailPage({ params }: { params: { batchId: string } }) {
  const { session } = useAuth()
  const router = useRouter()
  const [batch, setBatch] = useState<BulkUploadBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBatch()
  }, [params.batchId])

  const loadBatch = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      const foundBatch = (data.bulkUploadBatches || []).find((b: BulkUploadBatch) => b.batchId === params.batchId)
      setBatch(foundBatch || null)
    } catch (err) {
      toast.error('Failed to load batch details')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (invoiceId: string) => {
    try {
      setRetrying(prev => new Set(prev).add(invoiceId))
      electroTrackService.retryBulkUploadInvoice(invoiceId)
      toast.success('Invoice marked for retry')
      loadBatch()
    } catch (err) {
      toast.error('Failed to retry invoice')
    } finally {
      setRetrying(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoiceId)
        return newSet
      })
    }
  }

  const handleRetryFailed = async () => {
    const failedInvoices = batch?.invoices.filter(inv => 
      ['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(inv.status)
    ) || []
    
    for (const invoice of failedInvoices) {
      await handleRetry(invoice.id)
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      setDeleting(prev => new Set(prev).add(invoiceId))
      electroTrackService.deleteBulkUploadInvoice(invoiceId)
      toast.success('Invoice deleted')
      loadBatch()
    } catch (err) {
      toast.error('Failed to delete invoice')
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoiceId)
        return newSet
      })
    }
  }

  const handleDownloadFailed = () => {
    const failedInvoices = batch?.invoices.filter(inv => 
      ['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(inv.status)
    ) || []
    
    const csvContent = [
      ['Invoice Number', 'File Name', 'Status', 'Failure Reason', 'Failure Details'],
      ...failedInvoices.map(inv => [
        inv.invoiceNumber,
        inv.fileName,
        inv.status,
        inv.failureReason || '',
        inv.failureDetails || ''
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `failed_invoices_${batch?.batchId}.csv`
    link.click()
  }

  const handleViewPdf = (invoice: BulkUploadInvoice) => {
    const pdfWindow = window.open('', '_blank')
    if (pdfWindow) {
      pdfWindow.document.write(`
        <html>
          <body>
            <embed src="${invoice.pdfData}" type="application/pdf" width="100%" height="100%" />
          </body>
        </html>
      `)
    }
  }

  const handleViewParsedData = (invoice: BulkUploadInvoice) => {
    const dataWindow = window.open('', '_blank')
    if (dataWindow && invoice.parsedData) {
      dataWindow.document.write(`
        <html>
          <head><title>Parsed Data - ${invoice.invoiceNumber}</title></head>
          <body style="font-family: monospace; padding: 20px;">
            <h2>${invoice.invoiceNumber}</h2>
            <p><strong>Date:</strong> ${invoice.parsedData.invoiceDate}</p>
            <p><strong>Retailer:</strong> ${invoice.parsedData.retailerName}</p>
            <h3>Items:</h3>
            <table border="1" cellpadding="5">
              <tr><th>Product</th><th>Code</th><th>Quantity</th><th>Unit</th></tr>
              ${invoice.parsedData.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.productCode || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
      case 'failed':
      case 'ocr_failed':
      case 'corrupted':
      case 'invalid_format':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'duplicate':
        return <Badge className="bg-yellow-100 text-yellow-800"><Copy className="h-3 w-3 mr-1" />Duplicate</Badge>
      case 'pending_mapping':
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1" />Pending Mapping</Badge>
      case 'processing':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Processing</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getFailureReasonLabel = (reason?: string) => {
    const labels: Record<string, string> = {
      ocr_failed: 'OCR Failed',
      product_not_matched: 'Product Not Matched',
      duplicate_invoice: 'Duplicate Invoice',
      corrupted_pdf: 'Corrupted PDF',
      invalid_format: 'Invalid Format',
      network_error: 'Network Error',
      validation_error: 'Validation Error',
    }
    return labels[reason || ''] || reason
  }

  if (loading) {
    return (
      <DashboardLayout role="distributor">
        <DashboardHeader title="Loading..." />
        <main className="p-4 lg:p-8">
          <div>Loading batch details...</div>
        </main>
      </DashboardLayout>
    )
  }

  if (!batch) {
    return (
      <DashboardLayout role="distributor">
        <DashboardHeader title="Batch Not Found" />
        <main className="p-4 lg:p-8">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <div className="mt-4 text-muted-foreground">Batch not found</div>
        </main>
      </DashboardLayout>
    )
  }

  const failedInvoices = batch.invoices.filter(inv => 
    ['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(inv.status)
  )

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title={`Batch ${batch.batchId}`} />
      <main className="p-4 lg:p-8">
        <div className="mb-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>

        {/* Batch Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Batch Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{batch.totalInvoices}</div>
                <div className="text-sm text-muted-foreground">Total Uploaded</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{batch.stockUpdatedCount}</div>
                <div className="text-sm text-muted-foreground">Successfully Updated</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{batch.failedCount}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{batch.pendingMappingCount}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{batch.duplicateCount}</div>
                <div className="text-sm text-muted-foreground">Duplicate Invoices</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Uploaded by {batch.uploadedByName} on {new Date(batch.uploadDate).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {failedInvoices.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleRetryFailed} disabled={retrying.size > 0}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Failed ({failedInvoices.length})
                </Button>
                <Button onClick={handleDownloadFailed} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Failed List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices ({batch.invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Invoice Number</th>
                    <th className="text-left py-3 px-4">File Name</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Failure Reason</th>
                    <th className="text-left py-3 px-4">Stock Updated</th>
                    <th className="text-left py-3 px-4">Retries</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">{invoice.fileName}</td>
                      <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {invoice.failureReason ? getFailureReasonLabel(invoice.failureReason) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.stockUpdated ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.retryCount > 0 && (
                          <Badge variant="outline">{invoice.retryCount}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewPdf(invoice)}
                            title="View PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.parsedData && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewParsedData(invoice)}
                              title="View Parsed Data"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {['failed', 'ocr_failed', 'corrupted', 'invalid_format'].includes(invoice.status) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRetry(invoice.id)}
                              disabled={retrying.has(invoice.id)}
                              title="Retry"
                            >
                              <RefreshCw className={`h-4 w-4 ${retrying.has(invoice.id) ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                          {!invoice.stockUpdated && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(invoice.id)}
                              disabled={deleting.has(invoice.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
