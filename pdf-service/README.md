# PDF Invoice Processing Service

This Python Flask service provides PDF invoice processing capabilities for the ElectroTrack system, including text extraction, OCR for scanned documents, and product matching.

## Features

- **PDF Text Extraction**: Uses PyMuPDF and pdfplumber for extracting text from digital PDFs
- **OCR Fallback**: PaddleOCR for processing scanned/invoice images
- **Invoice Data Extraction**: Extracts invoice number, date, retailer name, and product details
- **Product Matching**: Multi-stage matching (Product Code → Exact Name → RapidFuzz)
- **Bulk Processing**: Handle 10-100 PDFs simultaneously with progress tracking
- **Duplicate Detection**: Prevents duplicate invoice processing

## Prerequisites

- Python 3.8 or higher
- pip package manager

## Installation

1. Navigate to the pdf-service directory:
```bash
cd pdf-service
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

### Dependencies

- `PyMuPDF==1.23.8` - PDF text extraction
- `pdfplumber==0.10.3` - Alternative PDF text extraction
- `paddleocr==2.7.0.3` - OCR for scanned documents
- `paddlepaddle==2.5.2` - PaddleOCR backend
- `rapidfuzz==3.6.1` - Fuzzy string matching
- `opencv-python==4.8.1.78` - Image processing
- `Pillow==10.1.0` - Image handling
- `flask==3.0.0` - Web framework
- `flask-cors==4.0.0` - CORS support
- `werkzeug==3.0.1` - WSGI utilities

## Running the Service

Start the Flask server:
```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status.

### Process Single Invoice
```
POST /process-pdf
Content-Type: application/json

{
  "pdf_data": "base64_encoded_pdf",
  "products": [
    {"id": "1", "code": "PROD001", "name": "Product Name"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "invoice_data": {
    "invoice_number": "INV-001",
    "invoice_date": "2024-01-15",
    "retailer_name": "Retailer Name",
    "items": [...]
  },
  "matched_items": [...],
  "unmatched_items": [...],
  "extraction_method": "text"
}
```

### Process Bulk Invoices
```
POST /process-bulk-pdf
Content-Type: application/json

{
  "pdf_files": ["base64_pdf_1", "base64_pdf_2"],
  "products": [...]
}
```

**Response:**
```json
{
  "success": true,
  "total_files": 2,
  "successful": 2,
  "failed": 0,
  "results": [...],
  "errors": []
}
```

## Integration with Next.js

The Next.js application communicates with this service via the following API routes:

- `/api/process-invoice` - Single invoice processing
- `/api/process-bulk-invoices` - Bulk invoice processing

### Environment Variables

Add to your `.env.local`:
```
PDF_SERVICE_URL=http://localhost:5001
```

## Invoice Data Extraction

The service extracts the following information from invoices:

1. **Invoice Number**: Uses regex patterns to find invoice numbers
2. **Invoice Date**: Extracts dates in various formats
3. **Retailer Name**: Identifies customer/bill-to information
4. **Product Details**: Extracts product code, name, quantity, and unit

### Extraction Methods

1. **PyMuPDF**: First attempt for digital PDFs
2. **pdfplumber**: Fallback if PyMuPDF fails
3. **PaddleOCR**: Final fallback for scanned documents

## Product Matching Logic

Three-stage matching process:

1. **Exact Product Code Match**: Direct code lookup
2. **Exact Product Name Match**: Case-insensitive name comparison
3. **Fuzzy Matching**: RapidFuzz with 80% similarity threshold

Unmatched products are flagged for manual review.

## Error Handling

- Individual invoice failures don't stop bulk processing
- Failed invoices can be retried later
- Detailed error messages returned for debugging

## Performance Considerations

- OCR processing is CPU-intensive
- First run of PaddleOCR may be slower (model loading)
- Consider running on a machine with adequate CPU resources
- For large bulk operations, consider processing in batches

## Troubleshooting

### PaddleOCR Installation_issues
If you encounter issues with PaddleOCR installation:
```bash
pip install paddlepaddle==2.5.2 -i https://mirror.baidu.com/pypi/simple
pip install paddleocr==2.7.0.3
```

### Port Already in Use
If port 5001 is already in use, modify the port in `app.py`:
```python
app.run(host='0.0.0.0', port=5002, debug=True)
```

### Memory Issues
For processing many large PDFs, consider:
- Processing in smaller batches
- Increasing system memory
- Using a machine with more resources

## Security Notes

- The service runs on localhost by default
- For production, consider:
  - Adding authentication
  - Using HTTPS
  - Implementing rate limiting
  - Adding input validation
