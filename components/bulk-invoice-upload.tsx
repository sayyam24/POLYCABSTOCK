'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Package, TrendingUp, AlertTriangle, Copy, CloudUpload, Sparkles, FileCheck, Loader2 } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useAuth } from '@/components/auth-provider'
import { toast } from 'sonner'

interface UploadProgress {
  index: number
  fileName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
}

interface BulkInvoiceUploadProps {
  onUploadComplete: (results: any[]) => void
  maxFiles?: number
}

export function BulkInvoiceUpload({ onUploadComplete, maxFiles = 100 }: BulkInvoiceUploadProps) {
  const { session } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [summary, setSummary] = useState({
    totalUploaded: 0,
    successfullyUpdated: 0,
    failed: 0,
    pendingReview: 0,
    duplicateInvoices: 0
  })

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setSummary(electroTrackService.getBulkUploadSummary())
    } catch (err) {
      console.error('Failed to load summary')
    }
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setFiles(selectedFiles)
    setUploadProgress(
      selectedFiles.map((file, index) => ({
        index,
        fileName: file.name,
        status: 'pending' as const,
        progress: 0
      }))
    )
  }, [maxFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    
    if (droppedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setFiles(droppedFiles)
    setUploadProgress(
      droppedFiles.map((file, index) => ({
        index,
        fileName: file.name,
        status: 'pending' as const,
        progress: 0
      }))
    )
  }, [maxFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    
    // Get existing invoices from state for duplicate detection
    const stateRes = await fetch('/api/state')
    const stateData = await stateRes.json()
    const existingInvoices = stateData.invoices || []
    const existingInvoiceNumbers = new Set(
      existingInvoices.map((inv: any) => inv.invoice_number?.toUpperCase()).filter(Boolean)
    )
    
    // Also check against transaction history for uploaded invoice numbers
    const existingTxInvoiceNumbers = new Set(
      (stateData.transactionHistory || [])
        .map((tx: any) => tx.invoiceNumber?.toUpperCase())
        .filter(Boolean)
    )
    
    // Combine both sets
    existingInvoiceNumbers.forEach(num => existingTxInvoiceNumbers.add(num))
    
    // Get products from state
    const productsRes = await fetch('/api/state')
    const productsData = await productsRes.json()
    const products = productsData.products || []

    try {
      // Create FormData with actual PDF files - NO base64 conversion
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('pdf_files', file)
      })
      formData.append('products', JSON.stringify(products))
      formData.append('productAliases', JSON.stringify(productsData.productAliases || []))
      formData.append('uploadedBy', session?.userId || 'system')
      formData.append('uploadedByName', session?.name || 'System')
      formData.append('orgId', session?.orgId || '')
      
      const response = await fetch('/api/process-bulk-invoices', {
        method: 'POST',
        body: formData // No Content-Type header - browser sets it with boundary
      })

      const data = await response.json()
      console.log('API Response:', data) // Debug log

      // Check for duplicate invoice numbers
      const duplicateInvoices: string[] = []
      data.results?.forEach((result: any) => {
        if (result.invoice_number) {
          const invoiceNum = result.invoice_number.toUpperCase()
          if (existingTxInvoiceNumbers.has(invoiceNum)) {
            duplicateInvoices.push(invoiceNum)
          }
        }
      })

      if (duplicateInvoices.length > 0) {
        toast.error('Duplicate invoices detected', {
          description: `The following invoice numbers already exist: ${duplicateInvoices.join(', ')}`,
          duration: 5000,
        })
        setIsUploading(false)
        return
      }

      // Update progress based on results
      const updatedProgress = uploadProgress.map((progress, index) => {
        const result = data.results?.[index] // Use index instead of finding by index property
        if (result) {
          return {
            ...progress,
            status: result.success ? 'success' : 'error',
            progress: 100,
            error: result.error
          } as UploadProgress
        }
        return progress
      })

      setUploadProgress(updatedProgress)
      onUploadComplete(data.results || [])
      
      // Show professional toast notification with detailed breakdown
      if (data.summary) {
        if (data.summary.failed === 0) {
          toast.success('All PDFs parsed successfully', {
            description: `Stock is being deducted for ${data.summary.success} invoices`,
            duration: 5000,
          })
        } else {
          toast.error('Processing completed with errors', {
            description: `Total: ${data.summary.total} | Success: ${data.summary.success} | Failed: ${data.summary.failed}`,
            duration: 5000,
          })
        }
      }
      
      // Log detailed results for debugging
      console.log('=== PARSING RESULTS ===')
      data.results?.forEach((result: any, index: number) => {
        console.log(`Invoice ${index + 1}:`)
        console.log(`- Success: ${result.success}`)
        console.log(`- Invoice Number: ${result.invoice_data?.invoice_number || 'N/A'}`)
        console.log(`- Date: ${result.invoice_data?.invoice_date || 'N/A'}`)
        console.log(`- Retailer: ${result.invoice_data?.retailer_name || 'N/A'}`)
        console.log(`- Items: ${result.invoice_data?.items?.length || 0}`)
        if (result.invoice_data?.items) {
          result.invoice_data.items.forEach((item: any, i: number) => {
            console.log(`  ${i + 1}. ${item.productName} - Qty: ${item.quantity} - Matched: ${item.matched ? 'Yes' : 'No'}`)
          })
        }
        console.log(`- Error: ${result.error || 'None'}`)
      })

    } catch (error) {
      console.error('Bulk upload error:', error)
      setErrorProgress()
    } finally {
      setIsUploading(false)
    }
  }

  const setErrorProgress = () => {
    setUploadProgress(prev => prev.map(p => ({
      ...p,
      status: 'error' as const,
      error: 'Processing failed'
    })))
  }

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-5 w-5 text-slate-400" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Batch Summary Card */}
      <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Bulk Upload Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Overview of your invoice processing activity</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Uploaded</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.totalUploaded}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Successfully Updated</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.successfullyUpdated}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Failed</span>
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.failed}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200 dark:from-yellow-950/30 dark:to-yellow-900/20 dark:border-yellow-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pendingReview}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Copy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duplicate Invoices</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summary.duplicateInvoices}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
              <CloudUpload className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Bulk Invoice Upload</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload {maxFiles} PDF invoices at once with our intelligent parsing system
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative group border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.02]' 
                : 'border-border/50 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/10'
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-upload"
              disabled={isUploading}
            />
            <label htmlFor="bulk-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-6">
                <div className={`p-6 rounded-full transition-all duration-300 ${
                  isDragging 
                    ? 'bg-indigo-500 scale-110 shadow-xl shadow-indigo-500/50' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:scale-105 group-hover:shadow-lg shadow-indigo-500/25'
                }`}>
                  <CloudUpload className="h-12 w-12 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold">
                    {files.length > 0 ? (
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {files.length} files selected
                      </span>
                    ) : (
                      <>
                        <span className="text-slate-700 dark:text-slate-300">Drag & drop PDF files here</span>
                        <span className="text-slate-400 dark:text-slate-500">or click to browse</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum {maxFiles} files • PDF format only • Intelligent parsing enabled
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Ready to process {files.length} invoices
                    </span>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-indigo-500" />
                  <span className="font-semibold">Processing Progress</span>
                </div>
                <span className="text-sm font-medium">
                  {uploadProgress.filter(p => p.status === 'success').length} / {uploadProgress.length}
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {uploadProgress.map((progress) => (
                  <div
                    key={progress.index}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(progress.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{progress.fileName}</p>
                      {progress.status === 'processing' && (
                        <Progress value={progress.progress} className="h-2 mt-3" />
                      )}
                      {progress.error && (
                        <p className="text-xs text-red-500 mt-2">{progress.error}</p>
                      )}
                    </div>
                    {progress.status === 'success' && (
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Button */}
          <Button
            onClick={processFiles}
            disabled={files.length === 0 || isUploading}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Invoices...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Process {files.length} Invoices
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
