'use client'

import { useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Search,
  X,
  File,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const invoiceHistory = [
  {
    id: 'INV-2024-0156',
    filename: 'invoice_jan_2024.pdf',
    uploadedBy: 'John Doe',
    uploadDate: '2024-01-15 14:32',
    size: '245 KB',
    status: 'verified',
    amount: '$12,450.00',
  },
  {
    id: 'INV-2024-0155',
    filename: 'supplier_bill_1422.pdf',
    uploadedBy: 'Sarah Smith',
    uploadDate: '2024-01-15 11:20',
    size: '180 KB',
    status: 'pending',
    amount: '$8,920.00',
  },
  {
    id: 'INV-2024-0154',
    filename: 'order_receipt_789.pdf',
    uploadedBy: 'Mike Johnson',
    uploadDate: '2024-01-14 16:45',
    size: '320 KB',
    status: 'verified',
    amount: '$5,680.00',
  },
  {
    id: 'INV-2024-0153',
    filename: 'distributor_invoice.pdf',
    uploadedBy: 'Emily Brown',
    uploadDate: '2024-01-14 09:15',
    size: '290 KB',
    status: 'rejected',
    amount: '$3,200.00',
  },
  {
    id: 'INV-2024-0152',
    filename: 'monthly_statement.pdf',
    uploadedBy: 'John Doe',
    uploadDate: '2024-01-13 17:00',
    size: '450 KB',
    status: 'verified',
    amount: '$24,100.00',
  },
]

interface UploadedFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'complete' | 'error'
}

export default function InvoicesPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleFiles = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 25
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: 100, status: 'complete' as const } : f
            )
          )
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
          )
        }
      }, 200)
    })
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }, [handleFiles])

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Verified</Badge>
      case 'pending':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredInvoices = invoiceHistory.filter(
    (invoice) =>
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Invoice Upload" userName="Admin User" />

      <main className="p-4 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,245</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">1,180</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">52</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">13</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoices</CardTitle>
            <CardDescription>Drag and drop files or click to browse</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                type="file"
                id="file-input"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragging ? 'Drop files here' : 'Drop files here or click to upload'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PDF, PNG, JPG (Max 10MB per file)
                  </p>
                </div>
                <Button size="lg" variant="outline" className="mt-2">
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Uploading Files</h4>
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              file.status === 'complete' ? 'bg-success' : 'bg-primary'
                            )}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12">
                          {Math.round(file.progress)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    {file.status === 'complete' && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>All uploaded invoices and their status</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {invoice.filename}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.uploadedBy}</TableCell>
                      <TableCell>{invoice.uploadDate}</TableCell>
                      <TableCell>{invoice.size}</TableCell>
                      <TableCell className="font-medium">{invoice.amount}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
