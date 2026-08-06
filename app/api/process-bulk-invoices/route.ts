import { NextResponse } from 'next/server'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { createProductMatchingService } from '@/lib/services/product-matching.service'
import type { Product, ProductAlias, AuthSession } from '@/lib/types'

interface ProcessBulkInvoicesRequest {
  pdfFiles: string[] // array of base64 encoded PDFs
  products: Array<{ id: string; code: string; name: string }>
  productAliases?: ProductAlias[]
  uploadedBy?: string
  uploadedByName?: string
  orgId?: string // Distributor's organization ID
}

interface InvoiceItem {
  productCode?: string
  productName: string
  quantity: number
  unit: string
  matchedProductId?: string
  matchedProductName?: string
}

interface BulkProcessResult {
  fileName: string
  success: boolean
  invoice_data?: {
    invoice_number: string
    invoice_date: string
    retailer_name: string
    items: InvoiceItem[]
  }
  matched_items?: InvoiceItem[]
  unmatched_items?: InvoiceItem[]
  error?: string
}

interface BulkProcessResponse {
  success: boolean
  batchId?: string
  total_files: number
  successful: number
  failed: number
  results: BulkProcessResult[]
  errors: string[]
}

async function processSinglePDF(
  pdfData: string,
  products: Product[],
  productAliases: ProductAlias[],
  fileName: string,
  batchId: string
): Promise<{ success: boolean; invoiceNumber?: string; status: string; failureReason?: string; failureDetails?: string; parsedData?: any }> {
  // This function is no longer used - we process all PDFs in one call to Python service
  throw new Error('processSinglePDF should not be called directly')
}

export async function POST(req: Request) {
  console.log('Received request to /api/process-bulk-invoices')  // Debug log
  try {
    const body = (await req.json()) as ProcessBulkInvoicesRequest
    console.log(`Request contains ${body.pdfFiles?.length || 0} PDF files`)  // Debug log
    const { pdfFiles, products, productAliases = [], uploadedBy = 'system', uploadedByName = 'System', orgId } = body

    if (!pdfFiles || !Array.isArray(pdfFiles)) {
      return NextResponse.json(
        { success: false, error: 'No PDF files provided' },
        { status: 400 }
      )
    }

    // Convert products to full Product format
    const fullProducts: Product[] = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.code,
      category: 'Uncategorized',
      unitPrice: 0,
      mrp: 0,
      caseLot: 1,
    }))

    // Create batch record
    const invoices = pdfFiles.map((pdf, index) => ({
      invoiceNumber: `TEMP_${index}`,
      fileName: `invoice_${index + 1}.pdf`,
      pdfData: pdf,
    }))

    const batch = electroTrackService.createBulkUploadBatch(uploadedBy, uploadedByName, invoices)

    // Call Python service with all PDFs at once
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'
    
    console.log(`Calling Python service with ${pdfFiles.length} PDFs`)
    const pythonResponse = await fetch(`${pythonServiceUrl}/parse-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf_files: pdfFiles,
        products: fullProducts.map(p => ({ id: p.id, code: p.sku || '', name: p.name })),
        existing_invoices: []
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout for bulk processing
    })

    if (!pythonResponse.ok) {
      throw new Error(`Python service error: ${pythonResponse.status}`)
    }

    const pythonData = await pythonResponse.json()
    console.log(`Python service returned ${pythonData.results?.length || 0} results`)
    
    if (!pythonData.success || !pythonData.results) {
      throw new Error('Failed to parse PDFs with Python service')
    }

    // Process results from Python service
    const results: BulkProcessResult[] = []
    const errors: string[] = []

    for (let index = 0; index < pythonData.results.length; index++) {
      const result = pythonData.results[index]
      try {
        // Transform Python response to our format
        const parsedData = {
          invoiceNumber: result.invoice_number,
          invoiceDate: result.invoice_date,
          retailerName: result.retailer_name,
          items: result.items || []
        }

        // Check for unmatched items
        const unmatchedItems = result.items.filter((item: any) => !item.matched || item.match_type === 'manual_review')
        const hasUnmatched = unmatchedItems.length > 0
        const status = hasUnmatched ? 'pending_mapping' : 'success'
        
        // Deduct stock from distributor account if no unmatched items
        let stockDeducted = false
        if (!hasUnmatched && result.success && orgId) {
          try {
            // Use bulk update stock API
            const stockUpdateRes = await fetch('/api/bulk-update-stock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orgId: orgId,
                items: result.items.map((item: any) => ({
                  productId: item.matched_product_id,
                  productName: item.product_name,
                  quantity: -item.quantity // Negative to deduct
                })),
                actionType: 'bulk_invoice_upload',
                referenceNumber: result.invoice_number || `INV_${index + 1}`,
                remarks: `Bulk upload invoice ${result.invoice_number}`
              })
            })
            stockDeducted = stockUpdateRes.ok
          } catch (stockError) {
            console.error(`Failed to deduct stock for invoice ${index + 1}:`, stockError)
          }
        }

        // Add transaction history entry via API
        if (result.success && orgId) {
          try {
            await fetch('/api/add-transaction-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invoiceNumber: result.invoice_number || `INV_${index + 1}`,
                senderOrgId: orgId,
                senderName: uploadedByName,
                senderRole: 'distributor',
                receiverName: 'Bulk Upload',
                receiverRole: 'system',
                items: result.items.map((item: any) => ({
                  productId: item.matched_product_id || '',
                  productName: item.product_name,
                  quantity: item.quantity
                })),
                status: stockDeducted ? 'completed' : 'pending'
              })
            })
          } catch (historyError) {
            console.error(`Failed to add transaction history for invoice ${index + 1}:`, historyError)
          }
        }
        
        // Update invoice status
        electroTrackService.updateBulkUploadInvoice(
          `${batch.batchId}_invoice_${index + 1}.pdf`,
          {
            status: status as any,
            parsedData: parsedData,
            stockUpdated: stockDeducted,
            stockUpdatedDate: stockDeducted ? new Date().toISOString() : undefined,
          }
        )

        results.push({
          fileName: `invoice_${index + 1}.pdf`,
          success: result.success,
          invoice_data: result.success ? {
            invoice_number: result.invoice_number,
            invoice_date: result.invoice_date,
            retailer_name: result.retailer_name,
            items: result.items
          } : undefined,
          error: result.error
        })

        if (!result.success) {
          errors.push(result.error || 'Unknown error')
        }
      } catch (error) {
        results.push({
          fileName: `invoice_${index + 1}.pdf`,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process PDF'
        })
        errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      batchId: batch.batchId,
      total_files: pdfFiles.length,
      successful,
      failed,
      results,
      errors,
      summary: {
        total: pdfFiles.length,
        success: successful,
        failed: failed,
        duplicates: 0
      }
    } as BulkProcessResponse)

  } catch (error) {
    console.error('Bulk invoice processing error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process bulk invoices' 
      },
      { status: 500 }
    )
  }
}
