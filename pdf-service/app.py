import os
import re
import json
import base64
from typing import Dict, List, Optional, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import pdfplumber
from paddleocr import PaddleOCR
import cv2
import numpy as np
from PIL import Image
from rapidfuzz import process, fuzz

app = Flask(__name__)
CORS(app)

# Initialize PaddleOCR (lazy loading to avoid startup delay)
ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = PaddleOCR(use_angle_cls=True, lang='en')
    return ocr_engine

def extract_text_from_pdf_pymupdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF (fitz)"""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
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

def extract_text_from_scanned_pdf(pdf_path: str) -> str:
    """Extract text from scanned PDF using PaddleOCR"""
    text = ""
    try:
        ocr = get_ocr_engine()
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Convert PDF page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Convert to numpy array for OpenCV
            img_array = np.array(img)
            
            # Run OCR
            result = ocr.ocr(img_array, cls=True)
            
            if result and result[0]:
                for line in result[0]:
                    if line[0]:
                        text += line[1][0] + "\n"
        
        doc.close()
        return text
    except Exception as e:
        print(f"PaddleOCR extraction error: {e}")
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
            
            # If still very little text, assume it's scanned and use OCR
            if len(text.strip()) < 50:
                text = extract_text_from_scanned_pdf(temp_path)
            
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
                    
                    # If still very little text, use OCR
                    if len(text.strip()) < 50:
                        text = extract_text_from_scanned_pdf(temp_path)
                    
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
    app.run(host='0.0.0.0', port=5001, debug=True)
