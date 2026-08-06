import { NextResponse } from 'next/server'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { loadDatabase } from '@/lib/db/local-db'

interface BulkParseRequest {
  pdfFiles: string[] // base64 encoded PDFs
  products: Array<{ id: string; code: string; name: string }>
  existingInvoices?: Array<{ invoiceNumber: string }>
}

interface ParsedItem {
  product_name: string
  product_code?: string
  quantity: number
  unit: string
  matched?: boolean
  matched_product_id?: string
  matched_product_name?: string
  match_type?: string
  confidence?: number
}

interface ParseResult {
  success: boolean
  invoice_number?: string
  invoice_date?: string
  retailer_name?: string
  items: ParsedItem[]
  extraction_method?: string
  error?: string
  duplicate?: boolean
}

interface BulkParseResponse {
  success: boolean
  results?: ParseResult[]
  summary?: {
    total: number
    success: number
    failed: number
    duplicates: number
  }
  error?: string
}

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BulkParseRequest
    const { pdfFiles, products, existingInvoices = [] } = body
    
    if (!pdfFiles || pdfFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No PDF files provided' },
        { status: 400 }
      )
    }
    
    // Get existing invoice numbers for duplicate detection
    const state = loadDatabase()
    const existingInvoiceNumbers = new Set<string>(
      (state.shipments || []).map((s: { invoiceNumber?: string }) => s.invoiceNumber?.toUpperCase()).filter(Boolean) as string[]
    )
    
    // Add any additional existing invoices from request
    existingInvoices.forEach(inv => {
      if (inv.invoiceNumber) {
        existingInvoiceNumbers.add(inv.invoiceNumber.toUpperCase())
      }
    })
    
    // Prepare request for Python service
    const pythonRequest = {
      pdf_files: pdfFiles,
      products: products.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name
      })),
      existing_invoices: Array.from(existingInvoiceNumbers).map(inv => ({ invoice_number: inv }))
    }
    
    // Call Python service
    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/parse-invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonRequest),
      signal: AbortSignal.timeout(120000) // 2 minute timeout for bulk processing
    })
    
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text()
      console.error('Python service error:', errorText)
      
      // Fallback to client-side parsing if Python service is unavailable
      return await fallbackParsing(pdfFiles, products, existingInvoiceNumbers)
    }
    
    const pythonData = await pythonResponse.json() as BulkParseResponse
    
    // Transform Python response to match our expected format
    const transformedResults = pythonData.results?.map(result => ({
      ...result,
      items: result.items?.map(item => ({
        productName: item.product_name,
        productCode: item.product_code,
        quantity: item.quantity,
        unit: item.unit,
        matchedProductId: item.matched_product_id,
        matchedProductName: item.matched_product_name,
        matchType: item.match_type,
        confidence: item.confidence
      }))
    }))
    
    return NextResponse.json({
      success: true,
      results: transformedResults,
      summary: pythonData.summary
    })
    
  } catch (error) {
    console.error('Bulk invoice parsing error:', error)
    
    // Try to parse the request body for fallback
    try {
      const body = await req.clone().json() as BulkParseRequest
      const existingInvoiceNumbers = new Set<string>()
      return await fallbackParsing(body.pdfFiles, body.products, existingInvoiceNumbers)
    } catch {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to parse invoices' },
        { status: 500 }
      )
    }
  }
}

async function fallbackParsing(
  pdfFiles: string[],
  products: Array<{ id: string; code: string; name: string }>,
  existingInvoiceNumbers: Set<string>
): Promise<NextResponse> {
  // Fallback to simple parsing using pdf-parse if Python service is unavailable
  try {
    // @ts-ignore - pdf-parse doesn't have proper TypeScript definitions
    const pdf = await import('pdf-parse')
    
    const results = []
    
    for (const pdfData of pdfFiles) {
      const pdfBuffer = Buffer.from(pdfData, 'base64')
      // @ts-ignore
      const pdfDataParsed = await pdf.default(pdfBuffer)
      const text = pdfDataParsed.text
      
      // Simple extraction
      const invoiceNumber = extractInvoiceNumber(text)
      const items = extractSimpleItems(text)
      
      // Check for duplicate
      const isDuplicate = invoiceNumber && existingInvoiceNumbers.has(invoiceNumber.toUpperCase())
      
      results.push({
        success: !isDuplicate,
        invoice_number: invoiceNumber,
        invoice_date: extractDate(text),
        retailer_name: extractRetailerName(text),
        items: items.map(item => ({
          productName: item.name,
          productCode: null,
          quantity: item.quantity,
          unit: 'pcs',
          matched: false,
          match_type: 'manual_review',
          confidence: 0
        })),
        extraction_method: 'fallback_pdf_parse',
        duplicate: isDuplicate,
        error: isDuplicate ? 'Duplicate invoice number' : null
      })
    }
    
    const successCount = results.filter(r => r.success).length
    const duplicateCount = results.filter(r => r.duplicate).length
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: results.length - successCount,
        duplicates: duplicateCount
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Both Python service and fallback parsing failed' },
      { status: 500 }
    )
  }
}

function extractInvoiceNumber(text: string): string | null {
  const patterns = [
    /invoice\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
    /inv\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
    /bill\s*[:#]?\s*([a-zA-Z0-9\-\/]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].toUpperCase()
  }
  return null
}

function extractDate(text: string): string | null {
  const match = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
  return match ? match[1] : null
}

function extractRetailerName(text: string): string | null {
  const lines = text.split('\n')
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].toLowerCase().includes('to:') || lines[i].toLowerCase().includes('bill to:')) {
      return lines[i + 1]?.trim() || null
    }
  }
  return null
}

function extractSimpleItems(text: string): Array<{ name: string; quantity: number }> {
  const items = []
  const lines = text.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9\s\-\(\)]+)\s+(\d+)\s*(pcs|ea|units?|nos?|pieces?)?$/i)
    if (match) {
      const name = match[1].trim()
      const quantity = parseInt(match[2], 10)
      if (name && quantity > 0) {
        items.push({ name, quantity })
      }
    }
  }
  
  return items
}
