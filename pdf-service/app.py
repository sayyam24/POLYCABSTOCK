import os
import re
import json
import base64
from typing import Dict, List, Optional, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import pdfplumber
from rapidfuzz import process, fuzz

app = Flask(__name__)
CORS(app)

def extract_text_from_pdf_pymupdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF (fitz) with aggressive filtering"""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            # Try "text" mode with layout preservation
            extracted = page.get_text("text", sort=True)
            text += extracted + "\n"
        doc.close()
        
        # Aggressive filtering to remove PDF structure data
        filtered_lines = []
        for line in text.split('\n'):
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip lines with PDF structure markers
            if re.search(r'^\s*\d+\s+×\s+\/[A-Z]', line):
                continue
            
            # Skip lines with PDF object references
            if re.search(r'^\s*\d+\s+\d+\s+obj', line):
                continue
            
            # Skip lines with binary garbage (lots of special characters)
            if len(re.findall(r'[^\x20-\x7E]', line)) > len(line) * 0.3:
                continue
            
            # Skip lines that are mostly numbers and symbols
            if re.search(r'^[\d\s×\[\](),./\-]+$', line):
                continue
            
            # Skip lines with PDF keywords
            pdf_keywords = ['/Length', '/MediaBox', '/FontBBox', '/Flags', '/Ascent', 
                          '/CapHeight', '/XHeight', '/BitsPerComponent', '/Width', '/Height', '/Size',
                          '/Filter', '/Subtype', '/Type', '/Resources', '/ProcSet']
            if any(keyword in line for keyword in pdf_keywords):
                continue
            
            # Keep lines that look like actual text
            if len(line) > 2 and re.search(r'[A-Za-z]{2,}', line):
                filtered_lines.append(line)
        
        return "\n".join(filtered_lines)
    except Exception as e:
        print(f"PyMuPDF extraction error: {e}")
        return ""

def extract_text_from_pdf_pdfplumber(pdf_path: str) -> str:
    """Extract text from PDF using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"pdfplumber extraction error: {e}")
        return ""


def extract_invoice_data(text: str) -> Dict:
    """Extract invoice data from text using regex patterns"""
    data = {
        'invoice_number': None,
        'invoice_date': None,
        'retailer_name': None,
        'items': []
    }
    
    # Invoice number patterns
    invoice_patterns = [
        r'invoice\s*no\.?\s*[:#]?\s*([A-Za-z0-9-/]+)',
        r'invoice\s*number\s*[:#]?\s*([A-Za-z0-9-/]+)',
        r'inv\s*no\.?\s*[:#]?\s*([A-Za-z0-9-/]+)',
        r'bill\s*no\.?\s*[:#]?\s*([A-Za-z0-9-/]+)',
    ]
    
    for pattern in invoice_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['invoice_number'] = match.group(1).strip()
            break
    
    # Invoice date patterns
    date_patterns = [
        r'date\s*[:]\s*(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})',
        r'invoice\s*date\s*[:]\s*(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})',
        r'bill\s*date\s*[:]\s*(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data['invoice_date'] = match.group(1).strip()
            break
    
    # Retailer name patterns (look for "To:", "Bill To:", "Customer:", etc.)
    retailer_patterns = [
        r'to\s*[:]\s*([A-Za-z\s]+)',
        r'bill\s*to\s*[:]\s*([A-Za-z\s]+)',
        r'customer\s*[:]\s*([A-Za-z\s]+)',
        r'sold\s*to\s*[:]\s*([A-Za-z\s]+)',
    ]
    
    for pattern in retailer_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if len(name) > 2:  # Filter out short matches
                data['retailer_name'] = name
                break
    
    # Extract items (product code, name, quantity, unit)
    # Look for tabular data patterns
    lines = text.split('\n')
    items = []
    
    # Pattern for item lines: typically has product code, name, quantity
    item_pattern = r'([A-Za-z0-9\-]+)\s+(.+?)\s+(\d+)\s*(?:pcs|units|nos|ea)?'
    
    for line in lines:
        match = re.search(item_pattern, line)
        if match:
            product_code = match.group(1).strip()
            product_name = match.group(2).strip()
            quantity = match.group(3).strip()
            
            # Filter out header lines
            if product_code.lower() not in ['code', 'item', 'product', 'sno', 'sl']:
                items.append({
                    'product_code': product_code,
                    'product_name': product_name,
                    'quantity': int(quantity),
                    'unit': 'pcs'  # Default unit
                })
    
    data['items'] = items
    return data

def match_products(extracted_items: List[Dict], product_database: List[Dict]) -> List[Dict]:
    """Match extracted products with database using Product Code → Exact Name → RapidFuzz"""
    matched_items = []
    unmatched_items = []
    
    # Create a lookup dictionary for products
    product_by_code = {p['code']: p for p in product_database if 'code' in p}
    product_by_name = {p['name'].lower(): p for p in product_database if 'name' in p}
    product_names = [p['name'] for p in product_database if 'name' in p]
    
    for item in extracted_items:
        matched = False
        
        # 1. Try exact product code match
        if item['product_code'] and item['product_code'] in product_by_code:
            product = product_by_code[item['product_code']]
            matched_items.append({
                **item,
                'matched_product_id': product.get('id'),
                'matched_product_name': product.get('name'),
                'match_method': 'code_exact'
            })
            matched = True
        
        # 2. Try exact product name match
        elif item['product_name'] and item['product_name'].lower() in product_by_name:
            product = product_by_name[item['product_name'].lower()]
            matched_items.append({
                **item,
                'matched_product_id': product.get('id'),
                'matched_product_name': product.get('name'),
                'match_method': 'name_exact'
            })
            matched = True
        
        # 3. Try fuzzy matching with RapidFuzz
        elif item['product_name'] and product_names:
            result = process.extractOne(
                item['product_name'],
                product_names,
                scorer=fuzz.WRatio,
                score_cutoff=80
            )
            if result:
                matched_name = result[0]
                score = result[1]
                product = next(p for p in product_database if p['name'] == matched_name)
                matched_items.append({
                    **item,
                    'matched_product_id': product.get('id'),
                    'matched_product_name': product.get('name'),
                    'match_method': 'name_fuzzy',
                    'match_score': score
                })
                matched = True
        
        if not matched:
            unmatched_items.append(item)
    
    return matched_items, unmatched_items

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'pdf-invoice-processor'})

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    """Process a PDF invoice and extract data"""
    try:
        data = request.json
        pdf_data = data.get('pdf_data')  # Base64 encoded PDF
        product_database = data.get('products', [])
        
        if not pdf_data:
            return jsonify({'error': 'No PDF data provided'}), 400
        
        # Decode base64 PDF
        pdf_bytes = base64.b64decode(pdf_data)
        
        # Save to temporary file
        temp_path = f"temp_{os.urandom(8).hex()}.pdf"
        with open(temp_path, 'wb') as f:
            f.write(pdf_bytes)
        
        try:
            # Try PyMuPDF first
            text = extract_text_from_pdf_pymupdf(temp_path)
            
            # If text extraction failed or returned very little text, try pdfplumber
            if len(text.strip()) < 50:
                text = extract_text_from_pdf_pdfplumber(temp_path)
            
            # Extract invoice data
            invoice_data = extract_invoice_data(text)
            
            # Match products
            matched_items, unmatched_items = match_products(
                invoice_data['items'],
                product_database
            )
            
            response = {
                'success': True,
                'invoice_data': invoice_data,
                'matched_items': matched_items,
                'unmatched_items': unmatched_items,
                'extraction_method': 'ocr' if len(text.strip()) < 50 else 'text'
            }
            
            return jsonify(response)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        print(f"PDF processing error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/process-bulk-pdf', methods=['POST'])
def process_bulk_pdf():
    """Process multiple PDF invoices in bulk"""
    try:
        data = request.json
        pdf_files = data.get('pdf_files', [])  # List of base64 encoded PDFs
        product_database = data.get('products', [])
        
        if not pdf_files:
            return jsonify({'error': 'No PDF files provided'}), 400
        
        results = []
        errors = []
        
        for idx, pdf_data in enumerate(pdf_files):
            try:
                # Decode base64 PDF
                pdf_bytes = base64.b64decode(pdf_data)
                
                # Save to temporary file
                temp_path = f"temp_bulk_{idx}_{os.urandom(8).hex()}.pdf"
                with open(temp_path, 'wb') as f:
                    f.write(pdf_bytes)
                
                try:
                    # Try PyMuPDF first
                    text = extract_text_from_pdf_pymupdf(temp_path)
                    
                    # If text extraction failed, try pdfplumber
                    if len(text.strip()) < 50:
                        text = extract_text_from_pdf_pdfplumber(temp_path)
                    
                    # Extract invoice data
                    invoice_data = extract_invoice_data(text)
                    
                    # Match products
                    matched_items, unmatched_items = match_products(
                        invoice_data['items'],
                        product_database
                    )
                    
                    results.append({
                        'index': idx,
                        'success': True,
                        'invoice_data': invoice_data,
                        'matched_items': matched_items,
                        'unmatched_items': unmatched_items,
                        'extraction_method': 'ocr' if len(text.strip()) < 50 else 'text'
                    })
                    
                finally:
                    # Clean up temporary file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                        
            except Exception as e:
                errors.append({
                    'index': idx,
                    'error': str(e)
                })
                results.append({
                    'index': idx,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'total_files': len(pdf_files),
            'successful': len([r for r in results if r.get('success')]),
            'failed': len(errors),
            'results': results,
            'errors': errors
        })
        
    except Exception as e:
        print(f"Bulk PDF processing error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
