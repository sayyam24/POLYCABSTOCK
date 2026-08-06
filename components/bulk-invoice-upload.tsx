'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Package, TrendingUp, AlertTriangle, Copy } from 'lucide-react'
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
  const [uploadedInvoiceNumbers, setUploadedInvoiceNumbers] = useState<Set<string>>(new Set())
  const [uploadedFileNames, setUploadedFileNames] = useState<Set<string>>(new Set())
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
      alert(`Maximum ${maxFiles} files allowed`)
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
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    
    if (droppedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
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
  }, [])

  const processFiles = async () => {
    if (files.length === 0) return

    // Check for duplicate file names in current session
    const duplicateFileNames: string[] = []
    files.forEach(file => {
      if (uploadedFileNames.has(file.name)) {
        duplicateFileNames.push(file.name)
      }
    })

    if (duplicateFileNames.length > 0) {
      toast.error('Duplicate files detected', {
        description: `These files were already uploaded in this session: ${duplicateFileNames.join(', ')}`,
        duration: 5000,
      })
      return
    }

    setIsUploading(true)
    
    // Get existing invoices from state for duplicate detection
    const stateRes = await fetch('/api/state')
    const stateData = await stateRes.json()
    const existingInvoices = stateData.invoices || []
    const existingInvoiceNumbers = new Set(
      existingInvoices.map((inv: any) => inv.invoice_number?.toUpperCase()).filter(Boolean)
    )
    
    // Convert files to base64
    const pdfFiles = await Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      })
    )

    // Get products from state
    const productsRes = await fetch('/api/state')
    const productsData = await productsRes.json()
    const products = productsData.products || []

    try {
      const response = await fetch('/api/process-bulk-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfFiles,
          products,
          productAliases: productsData.productAliases || [],
          uploadedBy: session?.userId || 'system',
          uploadedByName: session?.name || 'System',
          orgId: session?.orgId
        })
      })

      const data = await response.json()
      console.log('API Response:', data) // Debug log

      // Check for duplicate invoice numbers (both database and session cache)
      const duplicateInvoices: string[] = []
      data.results?.forEach((result: any) => {
        if (result.invoice_data?.invoice_number) {
          const invoiceNum = result.invoice_data.invoice_number.toUpperCase()
          if (existingInvoiceNumbers.has(invoiceNum) || uploadedInvoiceNumbers.has(invoiceNum)) {
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

      // Add new invoice numbers to session cache
      const newInvoiceNumbers = new Set(uploadedInvoiceNumbers)
      data.results?.forEach((result: any) => {
        if (result.invoice_data?.invoice_number) {
          newInvoiceNumbers.add(result.invoice_data.invoice_number.toUpperCase())
        }
      })
      setUploadedInvoiceNumbers(newInvoiceNumbers)

      // Add file names to session cache
      const newFileNames = new Set(uploadedFileNames)
      files.forEach(file => newFileNames.add(file.name))
      setUploadedFileNames(newFileNames)

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
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Batch Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Uploaded</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{summary.totalUploaded}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Successfully Updated</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{summary.successfullyUpdated}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Pending Review</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{summary.pendingReview}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Copy className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Duplicate Invoices</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{summary.duplicateInvoices}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Invoice Upload</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload {maxFiles} PDF invoices at once (drag & drop or click to select)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
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
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {files.length > 0 ? `${files.length} files selected` : 'Click to select or drag & drop PDF files'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum {maxFiles} files
              </p>
            </label>
          </div>

          {uploadProgress.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing Progress</span>
                <span>
                  {uploadProgress.filter(p => p.status === 'success').length} / {uploadProgress.length}
                </span>
              </div>
              {uploadProgress.map((progress) => (
                <div key={progress.index} className="flex items-center gap-3 p-2 border rounded">
                  {getStatusIcon(progress.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{progress.fileName}</p>
                    {progress.status === 'processing' && (
                      <Progress value={progress.progress} className="h-1 mt-1" />
                    )}
                    {progress.error && (
                      <p className="text-xs text-red-500">{progress.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={processFiles}
            disabled={files.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? 'Processing...' : 'Process Invoices'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
