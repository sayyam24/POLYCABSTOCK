# ElectroTrack Invoice Parser - Python Backend

This Python service provides fast, accurate PDF invoice parsing using open-source libraries. It supports bulk processing of 15-20 invoices in parallel with automatic fallback mechanisms.

## Features

- **PyMuPDF (fitz)**: Primary text extraction for computer-generated PDFs
- **PaddleOCR**: Automatic fallback for scanned/image-based PDFs
- **Camelot**: Primary table extraction with lattice flavor
- **pdfplumber**: Fallback table extraction
- **RapidFuzz**: Fuzzy product matching
- **Parallel Processing**: Process multiple invoices simultaneously
- **Duplicate Detection**: Prevents duplicate invoice processing
- **Smart Product Matching**: Code → Exact Name → Fuzzy matching

## Prerequisites

- Python 3.8 or higher
- pip package manager

## Installation

1. **Navigate to the invoice parser directory:**
   ```bash
   cd invoice_parser
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**

   **Windows:**
   ```bash
   venv\Scripts\activate
   ```

   **Mac/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Dependencies

- `pypdfium2==4.27.0` - PDF text extraction (alternative to PyMuPDF with pre-built wheels)
- `paddleocr==2.7.0.3` - OCR for scanned PDFs
- `paddlepaddle==2.6.1` - PaddleOCR backend
- `camelot-py[cv]==0.11.0` - Table extraction
- `pdfplumber==0.11.0` - Fallback table extraction
- `rapidfuzz==3.9.6` - Fuzzy string matching
- `flask==3.0.3` - Web API framework
- `flask-cors==4.0.1` - CORS support
- `werkzeug==3.0.3` - WSGI utilities

## Running the Service

1. **Start the Flask server:**
   ```bash
   python app.py
   ```

2. **The service will start on:**
   ```
   http://localhost:5000
   ```

3. **Health check:**
   ```bash
   curl http://localhost:5000/health
   ```

## Configuration

### Environment Variables

Set the `PYTHON_SERVICE_URL` in your Next.js `.env.local` file:

```env
PYTHON_SERVICE_URL=http://localhost:5000
```

### Port Configuration

To change the default port (5000), edit `app.py`:

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)  # Change port to 8000
```

## API Endpoints

### POST /parse-invoices

Parse multiple PDF invoices in parallel.

**Request Body:**
```json
{
  "pdf_files": ["base64_encoded_pdf_1", "base64_encoded_pdf_2"],
  "products": [
    {
      "id": "product_1",
      "code": "SKU001",
      "name": "LED Bulb 9W"
    }
  ],
  "existing_invoices": [
    {
      "invoice_number": "INV-001"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "invoice_number": "INV-001",
      "invoice_date": "01/01/2024",
      "retailer_name": "ABC Retailer",
      "items": [
        {
          "product_name": "LED Bulb 9W",
          "product_code": "SKU001",
          "quantity": 10,
          "unit": "pcs",
          "matched": true,
          "matched_product_id": "product_1",
          "matched_product_name": "LED Bulb 9W",
          "match_type": "code",
          "confidence": 1.0
        }
      ],
      "extraction_method": "pymupdf_camelot",
      "duplicate": false
    }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "duplicates": 0
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "invoice-parser"
}
```

## Extraction Methods

The parser uses a cascading approach:

1. **Text Extraction:**
   - Primary: PyMuPDF (fast, accurate for computer-generated PDFs)
   - Fallback: PaddleOCR (for scanned/image-based PDFs)

2. **Table Extraction:**
   - Primary: Camelot with lattice flavor
   - Fallback: Camelot with stream flavor
   - Final fallback: pdfplumber
   - Last resort: Text-based pattern matching

3. **Product Matching:**
   - Exact code match (100% confidence)
   - Exact name match (100% confidence)
   - Fuzzy match with RapidFuzz (85%+ confidence threshold)
   - Manual review required (below 85% confidence)

## Troubleshooting

### PaddleOCR Installation Issues

If you encounter issues with PaddleOCR installation:

```bash
# Install CPU version (faster, lighter)
pip install paddlepaddle==2.6.1

# Or install GPU version (if you have NVIDIA GPU)
pip install paddlepaddle-gpu==2.6.1
```

### Camelot Installation Issues

Camelot requires system dependencies for table extraction:

**Ubuntu/Debian:**
```bash
sudo apt-get install python3-tk ghostscript
```

**Mac:**
```bash
brew install tcl-tk ghostscript
```

**Windows:**
- Install Ghostscript from https://www.ghostscript.com/

### Port Already in Use

If port 5000 is already in use:

```bash
# Find process using port 5000 (Windows)
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change the port in app.py
```

## Performance

- **Single PDF:** ~2-5 seconds
- **Bulk (15-20 PDFs):** ~10-30 seconds (parallel processing)
- **Scanned PDFs:** Slower due to OCR processing

## Integration with Next.js

The Next.js API route (`/api/parse-bulk-invoices`) automatically:

1. Calls the Python service
2. Falls back to client-side parsing if Python service is unavailable
3. Handles duplicate detection
4. Transforms responses to match frontend expectations

## Security Notes

- The service runs on localhost by default
- For production, consider:
  - Adding authentication
  - Using HTTPS
  - Implementing rate limiting
  - Adding input validation
  - Running behind a reverse proxy (nginx)

## License

All libraries used are open-source and free for commercial use.
