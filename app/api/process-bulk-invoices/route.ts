import { NextResponse } from 'next/server'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { createProductMatchingService } from '@/lib/services/product-matching.service'
import type { Product, ProductAlias, AuthSession } from '@/lib/types'
import { loadServerState, saveServerState } from '@/lib/db/server-state'

interface ProcessBulkInvoicesRequest {
  pdfFiles: string[] // array of base64 encoded PDFs (legacy)
  products: Array<{ id: string; code: string; name: string }>
  productAliases?: ProductAlias[]
  uploadedBy?: string
  uploadedByName?: string
  orgId?: string // Distributor's organization ID
  pdfFilesRaw?: File[] // array of File objects (new FormData approach)
}

// Direct stock update function (inline to avoid HTTP request)
async function updateStockItems(orgId: string, items: Array<{ productId: string; productName: string; quantity: number }>) {
  const state = await loadServerState()
  
  for (const item of items) {
    const existingStock = state.stock.find(
      (s) => s.orgId === orgId && s.productId === item.productId
    )
    
    if (existingStock) {
      const oldQty = existingStock.quantity
      existingStock.quantity = Math.max(0, existingStock.quantity + item.quantity)
      existingStock.updatedAt = new Date().toISOString()
      console.log(`Updated stock for ${item.productName}: ${oldQty} -> ${existingStock.quantity}`)
    } else if (item.quantity > 0) {
      const org = state.organizations.find((o) => o.id === orgId)
      state.stock.push({
        id: `stock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        orgId,
        orgType: org?.type || 'distributor',
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        updatedAt: new Date().toISOString(),
      })
      console.log(`Created new stock record for ${item.productName}: ${item.quantity}`)
    } else {
      console.log(`Skipping item ${item.productName} - no existing stock and quantity is ${item.quantity}`)
    }
  }
  
  await saveServerState(state)
}

// Direct transaction history function (inline to avoid HTTP request)
async function addTransactionHistory(data: {
  invoiceNumber: string
  senderOrgId: string
  senderName: string
  senderRole: string
  receiverName: string
  receiverRole: string
  items: Array<{ productId: string; productName: string; quantity: number }>
  status: string
}) {
  const state = await loadServerState()
  
  // Add to transaction history
  state.transactionHistory.push({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    shipmentId: '',
    invoiceNumber: data.invoiceNumber,
    senderOrgId: data.senderOrgId,
    senderName: data.senderName,
    senderRole: data.senderRole as any,
    receiverOrgId: '',
    receiverName: data.receiverName,
    receiverRole: data.receiverRole as any,
    items: data.items,
    status: data.status as any,
    createdAt: new Date().toISOString()
  })
  
  // Also add to stock ledger for each item
  data.items.forEach(item => {
    const isDeduction = item.quantity < 0
    state.stockLedger.push({
      id: `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orgId: data.senderOrgId,
      productId: item.productId,
      productName: item.productName,
      productCode: '',
      quantity: Math.abs(item.quantity),
      quantityIn: isDeduction ? 0 : item.quantity,
      quantityOut: isDeduction ? Math.abs(item.quantity) : 0,
      closingBalance: 0, // Will be calculated by the ledger system
      actionType: isDeduction ? 'invoice_upload' : 'invoice_upload',
      action: isDeduction ? 'bulk_invoice_deduction' : 'bulk_invoice_upload',
      referenceNumber: data.invoiceNumber,
      userId: data.senderOrgId,
      userName: data.senderName,
      userRole: data.senderRole as any,
      dateTime: new Date().toISOString(),
      remarks: isDeduction 
        ? `Bulk invoice stock deduction - ${data.invoiceNumber}` 
        : `Bulk invoice upload - ${data.invoiceNumber}`
    } as any)
  })
  
  await saveServerState(state)
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
    // Check if request is FormData
    const contentType = req.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')
    
    let pdfFiles: string[] = []
    let products: Array<{ id: string; code: string; name: string }> = []
    let productAliases: ProductAlias[] = []
    let uploadedBy = 'system'
    let uploadedByName = 'System'
    let orgId: string | undefined
    let rawFiles: File[] = []
    
    if (isFormData) {
      // Parse FormData
      const formData = await req.formData()
      console.log('Request is FormData')
      
      // Extract PDF files
      rawFiles = []
      for (const [key, value] of formData.entries()) {
        if (key === 'pdf_files' && value instanceof File) {
          rawFiles.push(value)
        }
      }
      console.log(`Found ${rawFiles.length} PDF files in FormData`)
      
      // Extract products
      const productsJson = formData.get('products') as string
      if (productsJson) {
        products = JSON.parse(productsJson)
      }
      
      // Extract other fields
      const uploadedByValue = formData.get('uploadedBy') as string
      const uploadedByNameValue = formData.get('uploadedByName') as string
      const orgIdValue = formData.get('orgId') as string
      
      if (uploadedByValue) uploadedBy = uploadedByValue
      if (uploadedByNameValue) uploadedByName = uploadedByNameValue
      if (orgIdValue) orgId = orgIdValue
      
      // Convert File objects to base64 for batch record (legacy compatibility)
      pdfFiles = await Promise.all(
        rawFiles.map(async (file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        })
      )
    } else {
      // Parse JSON (legacy)
      const body = (await req.json()) as ProcessBulkInvoicesRequest
      console.log(`Request is JSON with ${body.pdfFiles?.length || 0} PDF files`)
      pdfFiles = body.pdfFiles
      products = body.products
      productAliases = body.productAliases || []
      uploadedBy = body.uploadedBy || 'system'
      uploadedByName = body.uploadedByName || 'System'
      orgId = body.orgId
    }

    if (!pdfFiles || !Array.isArray(pdfFiles)) {
      return NextResponse.json(
        { success: false, error: 'No PDF files provided' },
        { status: 400 }
      )
    }

    // Check for duplicate invoice numbers in existing shipments
    const state = await loadServerState()
    const existingInvoiceNumbers = new Set(
      state.shipments
        .filter(s => s.senderOrgId === orgId)
        .map(s => s.invoiceNumber?.toUpperCase())
        .filter(Boolean)
    )
    
    // Check for duplicates in transaction history as well
    const txInvoiceNumbers = new Set(
      state.transactionHistory
        .filter(tx => tx.senderOrgId === orgId)
        .map(tx => tx.invoiceNumber?.toUpperCase())
        .filter(Boolean)
    )
    
    // Combine both sets
    existingInvoiceNumbers.forEach(num => txInvoiceNumbers.add(num))
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

    // Call Python service with all PDFs using FormData
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'
    
    console.log(`Calling Python service with ${rawFiles.length} PDFs using FormData`)
    
    // Create FormData with actual PDF files
    const formData = new FormData()
    rawFiles.forEach((file: File) => {
      formData.append('pdf_files', file)
    })
    formData.append('products', JSON.stringify(fullProducts.map(p => ({ id: p.id, code: p.sku || '', name: p.name }))))
    formData.append('existing_invoices', JSON.stringify([]))
    
    const pythonResponse = await fetch(`${pythonServiceUrl}/parse-invoices`, {
      method: 'POST',
      body: formData, // No Content-Type header needed - browser sets it with boundary
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
      console.log(`=== Processing invoice ${index + 1} ===`)
      console.log('Result:', result)
      console.log('Items:', result.items)
      
      try {
        // Check for duplicate invoice number
        const invoiceNum = result.invoice_number?.toUpperCase()
        if (invoiceNum && existingInvoiceNumbers.has(invoiceNum)) {
          console.log(`Duplicate invoice detected: ${invoiceNum}`)
          results.push({
            fileName: `invoice_${index + 1}.pdf`,
            success: false,
            error: `Invoice number ${result.invoice_number} already exists`
          })
          errors.push(`Invoice number ${result.invoice_number} already exists`)
          continue
        }
        
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
        
        console.log(`Has unmatched items: ${hasUnmatched}, Result success: ${result.success}, orgId: ${orgId}`)
        
        // Deduct stock from distributor account if no unmatched items
        let stockDeducted = false
        if (!hasUnmatched && result.success && orgId) {
          console.log('Attempting stock deduction...')
          const stockItems = result.items.map((item: any) => ({
            productId: item.matched_product_id,
            productName: item.product_name || item.productName,
            quantity: -item.quantity // Negative to deduct
          }))
          console.log('Stock items to deduct:', stockItems)
          
          try {
            // Use direct function instead of HTTP request
            await updateStockItems(orgId, stockItems)
            stockDeducted = true
            console.log('Stock deduction successful')
          } catch (stockError) {
            console.error(`Failed to deduct stock for invoice ${index + 1}:`, stockError)
          }
        } else {
          console.log('Skipping stock deduction - conditions not met')
        }

        // Add transaction history entry via direct function
        if (result.success && orgId) {
          try {
            await addTransactionHistory({
              invoiceNumber: result.invoice_number || `INV_${index + 1}`,
              senderOrgId: orgId,
              senderName: uploadedByName,
              senderRole: 'sub_distributor',
              receiverName: 'Bulk Upload',
              receiverRole: 'system',
              items: result.items.map((item: any) => ({
                productId: item.matched_product_id || '',
                productName: item.product_name,
                quantity: item.quantity
              })),
              status: stockDeducted ? 'completed' : 'pending'
            })
            console.log('Transaction history added successfully')
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
