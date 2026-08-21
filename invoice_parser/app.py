from flask import Flask, request, jsonify
from flask_cors import CORS
import pypdfium2  # PDF text extraction
import pdfplumber  # Table extraction
import concurrent.futures
import os
import tempfile
import base64
import re
from rapidfuzz import process, fuzz
from typing import List, Dict, Optional, Tuple
import uuid
import fitz  # PyMuPDF

app = Flask(__name__)
CORS(app)

def is_valid_extracted_text(text: str) -> bool:
    """Strict validation to reject PDF structure data and binary content"""
    if not text or len(text.strip()) < 10:
        return False
    
    # Check for PDF structure markers - IMMEDIATE REJECTION
    pdf_markers = ['/Length', '/MediaBox', '/FontBBox', '/Flags', '/Ascent', 
                  '/CapHeight', '/XHeight', '/BitsPerComponent', '/Width', '/Height', '/Size',
                  '/Filter', '/Subtype', '/Type', '/Resources', '/ProcSet', '/XObject',
                  '/Count', '/Font', '/BaseFont', '/Encoding', '/ToUnicode']
    
    for marker in pdf_markers:
        if marker in text:
            print(f"VALIDATION FAILED: Found PDF marker '{marker}' in extracted text")
            return False
    
    # Check for patterns like "270 × /Length"
    if re.search(r'\d+\s+×\s+\/[A-Z]', text):
        print("VALIDATION FAILED: Found '× /Marker' pattern in extracted text")
        return False
    
    # Check for binary garbage (lots of non-printable characters)
    non_printable = len(re.findall(r'[^\x20-\x7E\r\n\t]', text))
    if non_printable > len(text) * 0.1:  # More strict: only 10% allowed
        print(f"VALIDATION FAILED: Too many non-printable characters ({non_printable}/{len(text)})")
        return False
    
    # Check if text contains actual words (at least some letters)
    if not re.search(r'[A-Za-z]{3,}', text):
        print("VALIDATION FAILED: No actual words found in extracted text")
        return False
    
    print("VALIDATION PASSED: Extracted text appears valid")
    return True

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using fitz.open(stream=) with strict validation"""
    text = ""
    try:
        # Use fitz.open with stream as specified
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Use page.get_text("text") as specified
            extracted = page.get_text("text")
            text += extracted + "\n"
        
        doc.close()
        
        # Debug: Print first 500 characters
        print(f"DEBUG: Extracted text (first 500 chars): {text[:500]}")
        
        # Strict validation
        if not is_valid_extracted_text(text):
            print("EXTRACTION FAILED: Extracted text failed validation")
            return ""
        
        print(f"EXTRACTION SUCCESS: Extracted {len(text)} characters")
        return text
        
    except Exception as e:
        print(f"PyMuPDF extraction error: {e}")
        return ""

class InvoiceParser:
    def __init__(self):
        pass
    
    def extract_text_pymupdf(self, pdf_path: str) -> Optional[str]:
        """Extract text using pypdfium2"""
        try:
            pdf = pypdfium2.PdfDocument(pdf_path)
            text = ""
            for page in pdf:
                text += page.get_textpage().get_text_range()
            pdf.close()
            return text if text.strip() else None
        except Exception as e:
            print(f"pypdfium2 extraction failed: {e}")
            return None
    
    def extract_table_pdfplumber(self, pdf_path: str, page_num: int = 1) -> List[List[str]]:
        """Extract table using pdfplumber"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                page = pdf.pages[page_num - 1]
                tables = page.extract_tables()
                if tables and len(tables) > 0:
                    return tables[0]
            return []
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
            return []
    
    def extract_invoice_number(self, text: str) -> Optional[str]:
        """Extract invoice number"""
        distributor_names = ['Shreash', 'SHREASH', 'shreash', 'SHREASH ENTERPRISES', 'Shreash Enterprises']
        invalid_patterns = ['INVOICE', 'BILL', 'NO', 'OICE', 'ILL']
        
        patterns = [
            r'invoice\s*[:#]?\s*([a-zA-Z0-9\-\/]+)',
            r'inv\s*[:#]?\s*([a-zA-Z0-9\-\/]+)',
            r'bill\s*[:#]?\s*([a-zA-Z0-9\-\/]+)',
            r'no\.?\s*[:#]?\s*([a-zA-Z0-9\-\/]+)',
            r'invoice\s+no\.?\s*[:#]?\s*([a-zA-Z0-9\-\/]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                invoice_num = match.group(1).upper().strip()
                # Filter out distributor names and invalid patterns
                if not any(distributor.lower() in invoice_num.lower() for distributor in distributor_names):
                    if not any(invalid in invoice_num.upper() for invalid in invalid_patterns):
                        # Only return if it looks like a valid invoice number (has at least one digit or is longer than 3 chars)
                        if len(invoice_num) > 3 or any(c.isdigit() for c in invoice_num):
                            return invoice_num
        return None
    
    def extract_invoice_date(self, text: str) -> Optional[str]:
        """Extract invoice date"""
        patterns = [
            r'date\s*[:#]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
            r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    def extract_retailer_name(self, text: str) -> Optional[str]:
        """Extract retailer name"""
        distributor_names = ['Shreash', 'SHREASH', 'shreash', 'SHREASH ENTERPRISES', 'Shreash Enterprises']
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if 'to:' in line.lower() or 'bill to:' in line.lower():
                if i + 1 < len(lines):
                    retailer = lines[i + 1].strip()
                    # Filter out distributor names
                    if not any(distributor.lower() in retailer.lower() for distributor in distributor_names):
                        return retailer
        return None
    
    def extract_items_from_table(self, table: List[List]) -> List[Dict]:
        """Extract items from table data - standard row-based format"""
        items = []
        
        if not table or len(table) < 2:
            return items
        
        print(f"Table has {len(table)} rows")
        
        # Find the header row
        header_row_index = -1
        for i, row in enumerate(table):
            if row:
                row_str = str(row)
                if 'Description of Goods' in row_str or 'Sl No.' in row_str:
                    header_row_index = i
                    print(f"Found header row at index {i}")
                    print(f"Header row: {row}")
                    break
        
        if header_row_index < 0:
            print("No header row found")
            return items
        
        # Process rows after the header
        for i in range(header_row_index + 1, len(table)):
            row = table[i]
            if not row or len(row) < 2:
                continue
            
            # Skip non-product rows (totals, tax, etc.)
            row_str = str(row)
            skip_keywords = ['Total', 'CGST', 'SGST', 'Tax', 'Amount', 'HSN/SAC', 'Round Off', 'Bill Details', 'Authorised', 'Signatory', 'Company', 'Bank', 'Declaration']
            if any(keyword in row_str for keyword in skip_keywords):
                print(f"Skipping row {i} (contains skip keyword)")
                continue
            
            # Skip rows that don't have a serial number in column 0
            if len(row) > 0 and row[0]:
                serial_str = str(row[0]).strip()
                if not serial_str.replace('.', '').replace(',', '').isdigit() or serial_str in ['None', '']:
                    print(f"Skipping row {i} (no valid serial number)")
                    continue
            
            print(f"Processing row {i}: {row}")
            
            # Extract from specific columns based on header structure
            # Column 0: Serial number
            # Column 1: Product name
            # Column 2: HSN code  
            # Column 4: Quantity
            # Column 10: Rate
            # Column 15: Amount
            
            serial_number = None
            product_name = None
            hsn_code = None
            quantity = None
            
            # Extract serial number (column 0)
            if len(row) > 0 and row[0]:
                serial_str = str(row[0]).strip()
                if serial_str and serial_str != 'None':
                    serial_number = serial_str
            
            # Extract product name (column 1)
            if len(row) > 1 and row[1]:
                product_name = str(row[1]).strip()
                if product_name == 'None':
                    product_name = None
            
            # Extract HSN code (column 2)
            if len(row) > 2 and row[2]:
                hsn_str = str(row[2]).strip()
                if hsn_str and hsn_str != 'None':
                    hsn_code = hsn_str
            
            # Extract quantity (column 4)
            if len(row) > 4 and row[4]:
                qty_str = str(row[4]).strip()
                if qty_str and qty_str != 'None':
                    qty_match = re.search(r'(\d+\.?\d*)', qty_str)
                    if qty_match:
                        try:
                            qty_val = float(qty_match.group(1))
                            if 0 < qty_val < 10000:
                                quantity = int(qty_val)
                                print(f"  Found quantity: {quantity}")
                        except ValueError:
                            pass
            
            # Only add item if we have both product name and quantity
            if product_name and quantity:
                items.append({
                    'product_name': product_name,
                    'product_code': hsn_code,
                    'quantity': quantity,
                    'unit': 'pcs'
                })
                print(f"  Extracted item: {product_name} - Qty: {quantity}")
            else:
                print(f"  Skipped row (missing product_name or quantity): product_name={product_name}, quantity={quantity}")
        
        print(f"Total items extracted from table: {len(items)}")
        return items
    
    def map_columns(self, header_row: List[str]) -> Dict[str, int]:
        """Map column names to indices"""
        col_map = {}
        for i, cell in enumerate(header_row):
            cell_lower = str(cell).lower()
            if any(keyword in cell_lower for keyword in ['code', 'sku', 'item no']):
                col_map['code'] = i
            elif any(keyword in cell_lower for keyword in ['name', 'description', 'product', 'item']):
                col_map['name'] = i
            elif any(keyword in cell_lower for keyword in ['qty', 'quantity', 'nos', 'pieces']):
                col_map['quantity'] = i
            elif any(keyword in cell_lower for keyword in ['unit', 'uom']):
                col_map['unit'] = i
        return col_map
    
    def extract_item_from_row(self, row: List[str], col_map: Dict[str, int]) -> Optional[Dict]:
        """Extract item data from table row"""
        try:
            product_name = row[col_map.get('name', 0)] if 'name' in col_map else row[0]
            product_code = row[col_map['code']] if 'code' in col_map and col_map['code'] < len(row) else None
            quantity_str = row[col_map.get('quantity', 1)] if 'quantity' in col_map else row[1]
            unit = row[col_map['unit']] if 'unit' in col_map and col_map['unit'] < len(row) else 'pcs'
            
            # Clean and parse quantity
            quantity = re.sub(r'[^\d.]', '', str(quantity_str))
            quantity = float(quantity) if quantity else 0
            
            if not product_name or quantity <= 0:
                return None
            
            return {
                'product_name': str(product_name).strip(),
                'product_code': str(product_code).strip() if product_code else None,
                'quantity': int(quantity),
                'unit': str(unit).strip()
            }
        except Exception as e:
            print(f"Error extracting item from row: {e}")
            return None
    
    def parse_invoice(self, pdf_bytes: bytes, products: List[Dict]) -> Dict:
        """Parse single invoice PDF from bytes"""
        result = {
            'success': False,
            'invoice_number': None,
            'invoice_date': None,
            'retailer_name': None,
            'items': [],
            'extraction_method': None,
            'error': None
        }
        
        try:
            # Extract text using new fitz-based method with validation
            text = extract_text_from_pdf_bytes(pdf_bytes)
            extraction_method = 'pymupdf_stream'
            
            if not text:
                result['error'] = 'Failed to extract valid text from PDF. The PDF may be scanned or in an unsupported format.'
                return result
            
            # Extract metadata
            result['invoice_number'] = self.extract_invoice_number(text)
            result['invoice_date'] = self.extract_invoice_date(text)
            result['retailer_name'] = self.extract_retailer_name(text)
            
            # Use text-based extraction (more reliable for this invoice format)
            items = self.extract_items_from_text(text)
            result['items'] = items
            result['extraction_method'] = f'{extraction_method}_text_based'
            
            # Match products
            matched_items = self.match_products(result['items'], products)
            result['items'] = matched_items
            
            result['success'] = True
            
        except Exception as e:
            result['error'] = str(e)
            print(f"Error parsing invoice: {e}")
        
        return result
    
    def extract_items_from_text(self, text: str) -> List[Dict]:
        """Extract items from text - optimized for this invoice format with multi-line support"""
        items = []
        lines = text.split('\n')
        
        print(f"Extracting items from {len(lines)} lines of text")
        
        # Look for the section with product data
        in_product_section = False
        current_item = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Detect start of product section
            if 'Description of Goods' in line or 'Sl No.' in line:
                # Finalize current item if exists (for multi-page invoices)
                if current_item and current_item.get('product_name'):
                    if current_item.get('quantity'):
                        items.append(current_item)
                        print(f"Extracted item: {current_item['product_name']} - Qty: {current_item['quantity']}")
                    else:
                        print(f"  Warning: Finalizing item without quantity: {current_item['product_name']}")
                    current_item = None
                in_product_section = True
                print(f"Found product section header at line {i}: {line}")
                continue
            
            # Detect end of product section - look for footer patterns
            # Don't end at page breaks - just skip them and continue
            if in_product_section:
                # Only end if we see total quantity lines, currency, or footer text
                # Skip page break indicators (don't end, just continue)
                if ('Total' in line and 'NOS' in line) or 'INR' in line or 'We declare that this invoice' in line:
                    in_product_section = False
                    print(f"End of product section at line {i}: {line}")
                    continue
            
            if not in_product_section:
                continue
            
            # Skip empty lines
            if not line or len(line) < 3:
                continue
            
            # Skip lines that are clearly not products
            # But don't skip lines that contain NOS (quantity indicator)
            skip_keywords = ['Sl No.', 'Description', 'HSN', 'Quantity', 'Sale Price', 'Rate', 'per', 'Disc', 'Amount', 'Total', 'CGST', 'SGST', 'Tax', 'Round Off', 'Bill Details', 'Authorised', 'Signatory', 'Company', 'Bank', 'Declaration', 'Branch', 'IFS Code', 'A/c', 'SWIFT', 'New Ref', 'Days', 'Dr', 'OUTPUT', 'Less', 'continued to page', 'Page', 'Tax Invoice', 'No.', 'Enterprises', 'From', 'Pune', 'MOB', 'GSTIN', 'UIN', 'State Name', 'Code', 'Consignee', 'Ship to', 'Buyer', 'Bill to', 'NEAR', 'Dated', 'Delivery Note', 'Dispatched through', 'Mode', 'Terms of Payment', 'Other References', 'Destination', 'Terms of Delivery', 'AMBIKA', 'SHREE', 'RAM', 'ELECTRICALS', 'SHIVANE', 'RAVET', 'ADDMART', 'MALL', 'NDA', 'ROAD', 'DESHMUKH', 'WADI', 'P128', 'P174', '26-May', '18-Jun', '26-May-26', '18-Jun-26']
            
            # Distributor names that should always be skipped (even if they contain NOS)
            distributor_names = ['Shreash', 'SHREASH', 'shreash', 'SHREASH ENTERPRISES', 'Shreash Enterprises']
            
            # Skip distributor names regardless of NOS
            if any(distributor.lower() in line.lower() for distributor in distributor_names):
                print(f"  Skipped distributor name: {line}")
                continue
            
            if any(keyword.lower() in line.lower() for keyword in skip_keywords) and 'NOS' not in line:
                continue
            
            # Check if this line starts with a serial number (1, 2, 3, etc.)
            # Serial numbers should be integers at the start (1-99 for multi-page invoices)
            parts = line.split()
            if parts and parts[0].replace('.', '').replace(',', '').isdigit():
                serial = parts[0]
                try:
                    serial_num = float(serial.replace(',', ''))
                    # Serial numbers should be integers (1-99) to avoid misidentifying other numbers
                    # Also require that the serial is followed by actual product text (not just wattage)
                    if 1 <= serial_num <= 99 and serial_num == int(serial_num) and len(parts) > 1:
                        # Additional check: if the second part looks like wattage (e.g., "W", "WATT"), 
                        # this might be a continuation line, not a new serial
                        second_part = parts[1].upper() if len(parts) > 1 else ''
                        is_wattage = second_part in ['W', 'WATT', 'WATTS'] or (second_part.replace('.', '').isdigit() and float(second_part) < 100)
                        
                        is_continuation = False
                        if current_item and not current_item.get('quantity'):
                            # Check if this looks like a continuation line (small number, short line)
                            # Also check if the second part looks like a product spec (STAR, WATT, etc.)
                            if serial_num <= 10 and len(parts) <= 3:
                                spec_keywords = ['STAR', 'WATT', 'W', 'WATTS', 'K', 'V', 'A']
                                if second_part in spec_keywords or len(parts) == 2:
                                    is_continuation = True
                                    print(f"  Previous item has no quantity, treating as continuation: {serial_num}")
                        
                        if not is_wattage and not is_continuation:
                            # Save previous item if exists
                            if current_item and current_item.get('product_name') and current_item.get('quantity'):
                                items.append(current_item)
                                print(f"Extracted item: {current_item['product_name']} - Qty: {current_item['quantity']}")
                            elif current_item and current_item.get('product_name'):
                                # Previous item has no quantity, but we're starting a new one
                                # This might be a case where the quantity was on a separate line
                                print(f"  Warning: Previous item had no quantity: {current_item['product_name']}")
                                # Still save it to avoid losing data
                                items.append(current_item)
                                print(f"Extracted item (no quantity): {current_item['product_name']}")

                            # Start new item
                            product_name = ' '.join(parts[1:]).strip()

                            # Check if this line contains embedded HSN/quantity/price data
                            # Pattern: PRODUCT_NAME HSN_CODE QUANTITY NOS PRICE NOS TOTAL
                            # Extract quantity from embedded data
                            qty_match = re.search(r'\b([1-9]\d{0,2}(?:\.\d+)?)\s*(?:NOS|PCS|pcs|nos)\b', product_name)
                            if qty_match:
                                try:
                                    qty_val = float(qty_match.group(1))
                                    if 1 <= qty_val <= 500:
                                        # Remove the embedded data from product name
                                        # Keep only the product name part before HSN code
                                        hsn_match = re.search(r'\b\d{8}\b', product_name)
                                        if hsn_match:
                                            product_name = product_name[:hsn_match.start()].strip()
                                        print(f"  Found embedded quantity: {qty_val}")
                                        current_item = {
                                            'serial': serial,
                                            'product_name': product_name,
                                            'quantity': int(qty_val),
                                            'unit': 'pcs'
                                        }
                                        print(f"Started new item with embedded data: {serial} - {product_name} - Qty: {qty_val}")
                                    else:
                                        current_item = {
                                            'serial': serial,
                                            'product_name': product_name,
                                            'quantity': None,
                                            'unit': 'pcs'
                                        }
                                        print(f"Started new item: {serial} - {product_name}")
                                except ValueError:
                                    current_item = {
                                        'serial': serial,
                                        'product_name': product_name,
                                        'quantity': None,
                                        'unit': 'pcs'
                                    }
                                    print(f"Started new item: {serial} - {product_name}")
                            else:
                                # No embedded quantity, start normal item
                                current_item = {
                                    'serial': serial,
                                    'product_name': product_name,
                                    'quantity': None,
                                    'unit': 'pcs'
                                }
                                print(f"Started new item: {serial} - {product_name}")
                        else:
                            # This looks like a continuation line with wattage (e.g., "15 W B22 6500K")
                            # or a continuation line because previous item has no quantity
                            print(f"  Line starts with number but looks like continuation: {serial_num}")
                            if current_item:
                                # Treat as continuation line for current item
                                print(f"  Treating as continuation line for current item")
                                # Check if it contains quantity with NOS indicator
                                qty_match = re.search(r'\b([1-9]\d{0,2}(?:\.\d+)?)\s*(?:NOS|PCS|pcs|nos)\b', line)
                                if qty_match:
                                    try:
                                        qty_val = float(qty_match.group(1))
                                        if 1 <= qty_val <= 500:
                                            current_item['quantity'] = int(qty_val)
                                            print(f"  Found quantity: {qty_val}")
                                    except ValueError:
                                        pass
                                else:
                                    # Add to product name
                                    current_item['product_name'] += ' ' + line
                                    current_item['product_name'] = re.sub(r'\s+', ' ', current_item['product_name']).strip()
                                    print(f"  Added to product name: {current_item['product_name']}")
                    else:
                        # This is a number but not a valid serial (likely HSN code or other data)
                        print(f"  Line starts with number but not valid serial: {serial_num}")
                        if current_item:
                            # Treat as continuation line for current item
                            print(f"  Treating as continuation line for current item")
                            # Check if it contains quantity with NOS indicator
                            qty_match = re.search(r'\b([1-9]\d{0,2}(?:\.\d+)?)\s*(?:NOS|PCS|pcs|nos)\b', line)
                            if qty_match:
                                try:
                                    qty_val = float(qty_match.group(1))
                                    if 1 <= qty_val <= 500:
                                        current_item['quantity'] = int(qty_val)
                                        print(f"  Found quantity: {qty_val}")
                                except ValueError:
                                    pass
                            else:
                                # Check if this is a small number that should be part of product name
                                # (like wattage: 15 W, 20 W, etc.)
                                is_hsn = re.match(r'^\d{8}$', line.split()[0] if line.split() else '')
                                is_large_number = serial_num >= 1000
                                
                                if not is_hsn and not is_large_number:
                                    # Add to product name
                                    current_item['product_name'] += ' ' + line
                                    current_item['product_name'] = re.sub(r'\s+', ' ', current_item['product_name']).strip()
                                    print(f"  Added to product name: {current_item['product_name']}")
                                else:
                                    print(f"  Skipped (HSN or large number)")
                except ValueError:
                    continue
            elif current_item:
                # This is a continuation line for the current item
                print(f"  Continuation line: {line}")
                
                # Check if this line should be skipped (header/footer text)
                skip_keywords = ['Enterprises', 'From', 'Pune', 'MOB', 'GSTIN', 'UIN', 'State Name', 'Code', 'Consignee', 'Ship to', 'Buyer', 'Bill to', 'NEAR', 'Dated', 'Delivery Note', 'Dispatched through', 'Mode', 'Terms of Payment', 'Other References', 'Destination', 'Terms of Delivery', 'AMBIKA', 'SHREE', 'RAM', 'ELECTRICALS', 'SHIVANE', 'RAVET', 'ADDMART', 'MALL', 'NDA', 'ROAD', 'DESHMUKH', 'WADI', 'P128', 'P174', '26-May', '18-Jun', '26-May-26', '18-Jun-26', 'Shreash']
                if any(keyword.lower() in line.lower() for keyword in skip_keywords) and 'NOS' not in line:
                    print(f"  Skipped continuation line (contains skip keyword)")
                    continue
                
                # Check if it contains quantity with NOS indicator
                # Look for pattern like "20.00 NOS" but avoid HSN codes (8 digits)
                qty_match = re.search(r'\b([1-9]\d{0,2}(?:\.\d+)?)\s*(?:NOS|PCS|pcs|nos)\b', line)
                if qty_match:
                    try:
                        qty_val = float(qty_match.group(1))
                        if 1 <= qty_val <= 500:
                            current_item['quantity'] = int(qty_val)
                            print(f"  Found quantity: {qty_val}")
                    except ValueError:
                        pass
                else:
                    print(f"  No quantity match in this line")
                
                # Add to product name if it doesn't look like HSN/quantity data
                # Skip lines that are just HSN codes (8 digits) or large numbers
                # Allow small numbers that might be part of product specs (like wattage)
                # Also skip lines that look like they contain quantity/rate data
                # Skip lines with ROUND OFF or other non-product terms
                is_hsn = re.match(r'^\d{8}$', line)
                is_large_number = re.match(r'^\d{4,}$', line)  # Numbers with 4+ digits
                is_quantity_line = qty_match
                
                if not is_hsn and not is_large_number and not is_quantity_line and 'NOS' not in line and 'ROUND OFF' not in line:
                    current_item['product_name'] += ' ' + line
                    current_item['product_name'] = re.sub(r'\s+', ' ', current_item['product_name']).strip()
                    print(f"  Added to product name: {current_item['product_name']}")
                else:
                    print(f"  Skipped adding to product name (hsn={is_hsn is not None}, large_num={is_large_number is not None}, qty={is_quantity_line is not None}, ROUND_OFF={'ROUND OFF' in line})")
        
        # Don't forget the last item
        if current_item and current_item.get('product_name') and current_item.get('quantity'):
            items.append(current_item)
            print(f"Extracted final item: {current_item['product_name']} - Qty: {current_item['quantity']}")
        
        # Convert to final format
        final_items = []
        for item in items:
            product_name = re.sub(r'\(cid:\d+\)', '', item['product_name']).strip()
            product_name = re.sub(r'\b\d{8}\b', '', product_name).strip()
            
            if len(product_name) > 5 and item.get('quantity'):
                final_items.append({
                    'product_name': product_name,
                    'product_code': None,
                    'quantity': item['quantity'],
                    'unit': 'pcs'
                })
        
        print(f"Total items extracted from text: {len(final_items)}")
        return final_items
    
    def match_products(self, items: List[Dict], products: List[Dict]) -> List[Dict]:
        """Match extracted items to product catalog"""
        product_map = {p['code']: p for p in products if 'code' in p}
        product_names = {p['name'].lower(): p for p in products if 'name' in p}
        
        for item in items:
            # Try exact code match first
            if item['product_code'] and item['product_code'] in product_map:
                product = product_map[item['product_code']]
                item['matched'] = True
                item['matched_product_id'] = product['id']
                item['matched_product_name'] = product['name']
                item['match_type'] = 'code'
                item['confidence'] = 1.0
                continue
            
            # Try exact name match
            product_name_lower = item['product_name'].lower()
            if product_name_lower in product_names:
                product = product_names[product_name_lower]
                item['matched'] = True
                item['matched_product_id'] = product['id']
                item['matched_product_name'] = product['name']
                item['match_type'] = 'exact_name'
                item['confidence'] = 1.0
                continue
            
            # Try fuzzy matching with RapidFuzz
            catalog_names = [p['name'] for p in products if 'name' in p]
            match_result = process.extractOne(item['product_name'], catalog_names, scorer=fuzz.WRatio)
            
            if match_result and match_result[1] >= 85:  # 85% confidence threshold
                matched_name = match_result[0]
                product = next(p for p in products if p['name'] == matched_name)
                item['matched'] = True
                item['matched_product_id'] = product['id']
                item['matched_product_name'] = product['name']
                item['match_type'] = 'fuzzy'
                item['confidence'] = match_result[1] / 100
            else:
                item['matched'] = False
                item['match_type'] = 'manual_review'
                item['confidence'] = 0.0
        
        return items

# Global parser instance
parser = InvoiceParser()

@app.route('/parse-invoices', methods=['POST'])
def parse_invoices():
    """Parse multiple invoices in parallel"""
    print("=" * 50)
    print("Received request to /parse-invoices")  # Debug log
    print("=" * 50)
    try:
        data = request.json
        print(f"Request data keys: {data.keys() if data else 'None'}")  # Debug log
        print(f"Number of PDF files: {len(data.get('pdf_files', [])) if data else 0}")  # Debug log
        pdf_files = data.get('pdf_files', [])  # List of base64 encoded PDFs
        products = data.get('products', [])    # Product catalog
        existing_invoices = data.get('existing_invoices', [])  # For duplicate detection
        
        print(f"Products received: {len(products)}")
        print(f"Existing invoices: {len(existing_invoices)}")
        
        if not pdf_files:
            print("ERROR: No PDF files provided")
            return jsonify({'success': False, 'error': 'No PDF files provided'}), 400
        
        # Check for duplicates
        duplicate_invoice_numbers = set()
        for inv in existing_invoices:
            duplicate_invoice_numbers.add(inv.get('invoice_number', '').upper())
        
        # Create temporary directory for PDF files
        temp_dir = tempfile.mkdtemp()
        
        # Save PDFs to temporary files
        pdf_paths = []
        for i, pdf_data in enumerate(pdf_files):
            # Remove data URL prefix if present
            if pdf_data.startswith('data:'):
                pdf_data = pdf_data.split(',')[1]
            
            try:
                pdf_bytes = base64.b64decode(pdf_data)
                pdf_path = os.path.join(temp_dir, f'invoice_{i}.pdf')
                with open(pdf_path, 'wb') as f:
                    f.write(pdf_bytes)
                pdf_paths.append(pdf_path)
                print(f"Successfully saved PDF {i} to {pdf_path} ({len(pdf_bytes)} bytes)")
            except Exception as e:
                print(f"Failed to decode/save PDF {i}: {e}")
                continue
        
        # Parse invoices sequentially to avoid interleaved logs and extraction issues
        results = []
        for i, pdf_path in enumerate(pdf_paths):
            try:
                print(f"\n--- Processing PDF {i}: {pdf_path} ---")
                # Read PDF bytes from file
                with open(pdf_path, 'rb') as f:
                    pdf_bytes = f.read()
                result = parser.parse_invoice(pdf_bytes, products)
                
                # Check for duplicate invoice number
                if result.get('invoice_number'):
                    inv_num = result['invoice_number'].upper()
                    if inv_num in duplicate_invoice_numbers:
                        result['duplicate'] = True
                        result['error'] = f'Duplicate invoice number: {inv_num}'
                        result['success'] = False
                    else:
                        duplicate_invoice_numbers.add(inv_num)
                
                results.append(result)
                print(f"--- Completed PDF: {pdf_path} ---\n")
            except Exception as e:
                print(f"Error processing {pdf_path}: {e}")
                results.append({
                    'success': False,
                    'error': str(e),
                    'invoice_number': None
                })
        
        # Clean up temporary files
        for pdf_path in pdf_paths:
            try:
                os.remove(pdf_path)
            except:
                pass
        try:
            os.rmdir(temp_dir)
        except:
            pass
        
        # Calculate summary
        success_count = sum(1 for r in results if r['success'])
        failed_count = len(results) - success_count
        duplicate_count = sum(1 for r in results if r.get('duplicate', False))
        
        return jsonify({
            'success': True,
            'results': results,
            'summary': {
                'total': len(results),
                'success': success_count,
                'failed': failed_count,
                'duplicates': duplicate_count
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'invoice-parser'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
