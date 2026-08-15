import { NextResponse } from 'next/server'

interface ProcessInvoiceRequest {
  pdfData: string // base64 encoded PDF
  products?: Array<{ id: string; code: string; name: string }>
  productAliases?: any[]
}

interface InvoiceItem {
  productName: string
  quantity: number
}

interface ProcessInvoiceResponse {
  success: boolean
  invoice_data?: {
    items: InvoiceItem[]
  }
  error?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProcessInvoiceRequest
    const { pdfData } = body

    if (!pdfData) {
      return NextResponse.json(
        { success: false, error: 'PDF data is required' },
        { status: 400 }
      )
    }

    // Try Python parsing service if configured
    const pythonServiceUrl = process.env.PYTHON_PARSING_SERVICE_URL || 'http://localhost:5000/parse-invoices'

    if (pythonServiceUrl && !pythonServiceUrl.includes('localhost')) {
      try {
        const response = await fetch(pythonServiceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdf_files: [pdfData],
            products: body.products || [],
            existing_invoices: []
          })
        })

        if (response.ok) {
          const data = await response.json()

          if (data.success) {
            // Transform Python response to match expected format
            const firstResult = data.results?.[0] || data
            const invoiceItems: InvoiceItem[] = firstResult.items?.map((item: any) => ({
              productName: item.product_name || item.productName,
              quantity: item.quantity
            })) || []

            return NextResponse.json({
              success: true,
              invoice_data: {
                items: invoiceItems
              }
            } as ProcessInvoiceResponse)
          }
        }
      } catch (fetchError) {
        console.log('Python service unavailable, using local fallback')
      }
    }

    // Fallback: Use local parsing (basic implementation)
    // For production, you should implement proper PDF parsing or deploy the Python service
    console.log('Using local invoice parsing fallback')

    // Decode base64 PDF to text (simplified - in production use proper PDF parsing library)
    const pdfBuffer = Buffer.from(pdfData, 'base64')
    const pdfText = pdfBuffer.toString('utf-8')

    // Use the local extraction function
    const extractedData = extractInvoiceData(pdfText)
    const invoiceItems: InvoiceItem[] = extractedData.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity
    }))

    return NextResponse.json({
      success: true,
      invoice_data: {
        items: invoiceItems
      }
    } as ProcessInvoiceResponse)

  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process PDF'
      } as ProcessInvoiceResponse,
      { status: 500 }
    )
  }
}

function extractInvoiceData(text: string): {
  invoice_number: string
  invoice_date: string
  retailer_name: string
  items: Array<{ productName: string; productCode?: string; quantity: number; unit: string }>
} {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  
  let invoice_number = 'Unknown'
  let invoice_date = new Date().toISOString().split('T')[0]
  let retailer_name = 'Unknown'
  const items: Array<{ productName: string; productCode?: string; quantity: number; unit: string }> = []
  
  // Common patterns for invoice number
  const invoiceNumberPatterns = [
    /invoice\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
    /inv\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
    /bill\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
    /no\.?\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
  ]
  
  // Common patterns for date
  const datePatterns = [
    /date\s*[:#]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
  ]
  
  // Extract invoice number
  for (const line of lines) {
    for (const pattern of invoiceNumberPatterns) {
      const match = line.match(pattern)
      if (match) {
        invoice_number = match[1].toUpperCase()
        break
      }
    }
    if (invoice_number !== 'Unknown') break
  }
  
  // Extract date
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        invoice_date = match[1]
        break
      }
    }
  }
  
  // Try to extract retailer name (usually appears near "To:", "Bill To:", or at the top)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i]
    if (line.toLowerCase().includes('to:') || line.toLowerCase().includes('bill to:')) {
      if (i + 1 < lines.length) {
        retailer_name = lines[i + 1]
        break
      }
    }
  }
  
  // Extract items - look for lines with product names and quantities
  // Pattern: Product Name followed by quantity
  const itemPatterns = [
    // Pattern: Product Name Qty Unit
    /^([a-zA-Z][a-zA-Z0-9\s\-\(\)]+)\s+(\d+)\s*(pcs|ea|units?|nos?|pieces?)?$/i,
    // Pattern: Qty Product Name
    /^(\d+)\s+([a-zA-Z][a-zA-Z0-9\s\-\(\)]+)$/i,
    // Pattern: Product Name - Qty
    /^([a-zA-Z][a-zA-Z0-9\s\-\(\)]+)\s*-\s*(\d+)$/i,
  ]
  
  for (const line of lines) {
    // Skip header lines
    if (line.toLowerCase().includes('s.no') || 
        line.toLowerCase().includes('item') || 
        line.toLowerCase().includes('description') ||
        line.toLowerCase().includes('total') ||
        line.toLowerCase().includes('amount')) {
      continue
    }
    
    for (const pattern of itemPatterns) {
      const match = line.match(pattern)
      if (match) {
        let productName: string
        let quantity: number
        let unit = 'pcs'
        
        if (pattern === itemPatterns[0] || pattern === itemPatterns[2]) {
          productName = match[1].trim()
          quantity = parseInt(match[2], 10)
          if (match[3]) unit = match[3]
        } else {
          quantity = parseInt(match[1], 10)
          productName = match[2].trim()
        }
        
        // Filter out very short names or unreasonable quantities
        if (productName.length > 2 && quantity > 0 && quantity < 10000) {
          items.push({ productName, productCode: undefined, quantity, unit })
        }
        break
      }
    }
  }
  
  // If no items found with patterns, try a more lenient approach
  if (items.length === 0) {
    for (const line of lines) {
      const parts = line.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1]
        const quantity = parseInt(lastPart, 10)
        
        if (!isNaN(quantity) && quantity > 0 && quantity < 10000) {
          const productName = parts.slice(0, -1).join(' ')
          if (productName.length > 2) {
            items.push({ productName, productCode: undefined, quantity, unit: 'pcs' })
          }
        }
      }
    }
  }
  
  return {
    invoice_number,
    invoice_date,
    retailer_name,
    items,
  }
}
