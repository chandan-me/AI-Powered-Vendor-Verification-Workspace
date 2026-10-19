import json
import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from openai import OpenAI

from app.core.config import settings
from app.core.logging import logger
from app.models.document import Document, DocumentExtraction
from app.services.document_service import DocumentService

EXTRACTION_SYSTEM_PROMPT = """
You are an expert AI document parser for enterprise vendor verification.
Analyze the provided document text and extract the following entity fields:
- company_name: Official registered name of the business or vendor.
- registration_number: Company registration number (CIN, LLPIN, Business ID, Registration No).
- gst_number: GST / Tax Identification Number (e.g. 15-character GSTIN, VAT, or Tax ID).
- address: Registered office or operating address.
- bank_account_number: Bank account number.
- ifsc_code: Bank routing code or IFSC code.

Rules:
1. Return ONLY a valid JSON object matching this exact schema:
{
  "company_name": {"value": string or null, "confidence": float or null, "source_text": string or null},
  "registration_number": {"value": string or null, "confidence": float or null, "source_text": string or null},
  "gst_number": {"value": string or null, "confidence": float or null, "source_text": string or null},
  "address": {"value": string or null, "confidence": float or null, "source_text": string or null},
  "bank_account_number": {"value": string or null, "confidence": float or null, "source_text": string or null},
  "ifsc_code": {"value": string or null, "confidence": float or null, "source_text": string or null}
}
2. Do NOT invent missing values. If a field cannot be found in the document, set value, confidence, and source_text to null.
3. For confidence, use a float between 0.0 and 1.0 based on how clearly and unambiguously the field appears.
4. For source_text, quote the exact snippet or line from the document where the value was found.
"""

class AIExtractionService:
    @classmethod
    def extract_document(cls, db: Session, doc: Document) -> DocumentExtraction:
        # 1. Extract raw text from file
        raw_text = DocumentService.extract_text_from_file(doc.file_path, doc.mime_type)
        if not raw_text.strip():
            raw_text = f"[No readable text found in document {doc.original_filename}]"

        extracted_data: Dict[str, Any] = {}
        model_used = "local-parser"

        # 2. Check if OpenAI is configured
        if settings.is_openai_configured:
            try:
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                        {"role": "user", "content": f"Document Type: {doc.document_type}\nFilename: {doc.original_filename}\n\nDocument Text:\n{raw_text[:4000]}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0
                )
                raw_json = response.choices[0].message.content or "{}"
                extracted_data = json.loads(raw_json)
                model_used = f"openai-{settings.OPENAI_MODEL}"
            except Exception as e:
                logger.error(f"OpenAI extraction failed: {e}. Falling back to local document parser.")
                extracted_data = cls._local_smart_extract(raw_text, doc.document_type)
                model_used = "local-smart-fallback"
        else:
            # Intelligent local parsing from real document text
            extracted_data = cls._local_smart_extract(raw_text, doc.document_type)
            model_used = "local-smart-parser (demo mode)"

        # 3. Create or update DocumentExtraction record
        extraction = db.query(DocumentExtraction).filter(DocumentExtraction.document_id == doc.id).first()
        if not extraction:
            extraction = DocumentExtraction(
                document_id=doc.id,
                raw_text=raw_text,
                extracted_json=extracted_data,
                user_edited_json=None,
                is_user_corrected=False,
                model_used=model_used
            )
            db.add(extraction)
        else:
            extraction.raw_text = raw_text
            extraction.extracted_json = extracted_data
            extraction.model_used = model_used

        doc.processing_status = "EXTRACTED"
        db.commit()
        db.refresh(extraction)
        return extraction

    @staticmethod
    def _local_smart_extract(text: str, document_type: str) -> Dict[str, Any]:
        """Parses actual text from document using regex and entity rules."""
        results: Dict[str, Any] = {
            "company_name": {"value": None, "confidence": None, "source_text": None},
            "registration_number": {"value": None, "confidence": None, "source_text": None},
            "gst_number": {"value": None, "confidence": None, "source_text": None},
            "address": {"value": None, "confidence": None, "source_text": None},
            "bank_account_number": {"value": None, "confidence": None, "source_text": None},
            "ifsc_code": {"value": None, "confidence": None, "source_text": None},
        }

        lines = [line.strip() for line in text.split("\n") if line.strip()]

        # 1. Company Name patterns
        name_patterns = [
            r'(?:Company\s*Name|Legal\s*Name(?:\s*of\s*Company)?|Account\s*Holder(?:\s*Name)?|Trade\s*Name|Business\s*Name)[\s:=]+([^\r\n]+)',
            r'([A-Za-z0-9\s&]+(?:Private Limited|Pvt\.?\s*Ltd\.?|Limited|LLP|Corporation|Corp\.?|Inc\.?))',
        ]
        for pattern in name_patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                found_val = m.group(1).strip()
                # Clean prefix / trailing noise
                found_val = re.sub(r'^(?:of\s*Company|Name)[\s:=]+', '', found_val, flags=re.IGNORECASE).strip()
                found_val = re.split(r'\s+(?:Trade\s*Name|Date|Account|IFSC|GSTIN|Address|Jurisdiction):', found_val, flags=re.IGNORECASE)[0].strip()
                found_val = re.sub(r'\s+', ' ', found_val).strip()
                if len(found_val) > 3 and not found_val.lower().startswith("is hereby"):
                    results["company_name"] = {
                        "value": found_val,
                        "confidence": 0.96,
                        "source_text": m.group(0).strip()
                    }
                    break

        # 2. Registration / CIN / Incorporation Number
        cin_pattern = r'(?:Corporate\s*Identity\s*Number(?:\s*\(CIN\))?|CIN|Registration\s*Number|Registration\s*No\.?|Corporate\s*ID|LLPIN)[\s:=]+([A-Z0-9]{5,25})'
        cin_match = re.search(cin_pattern, text, re.IGNORECASE)
        if cin_match:
            results["registration_number"] = {
                "value": cin_match.group(1).strip().upper(),
                "confidence": 0.96,
                "source_text": cin_match.group(0).strip()
            }
        else:
            standalone_cin = re.search(r'\b([LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6})\b', text)
            if standalone_cin:
                results["registration_number"] = {
                    "value": standalone_cin.group(1).strip().upper(),
                    "confidence": 0.97,
                    "source_text": standalone_cin.group(0).strip()
                }

        # 3. GST Number / Tax ID
        gst_pattern = r'(?:Registration\s*Number\s*\(GSTIN\)|GSTIN|GST\s*Number|GST\s*No\.?|Tax\s*ID)[\s:=]+([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|[A-Z0-9\-]{8,18})'
        gst_match = re.search(gst_pattern, text, re.IGNORECASE)
        if gst_match:
            results["gst_number"] = {
                "value": gst_match.group(1).strip().upper(),
                "confidence": 0.97,
                "source_text": gst_match.group(0).strip()
            }
        else:
            standalone_gst = re.search(r'\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b', text)
            if standalone_gst:
                results["gst_number"] = {
                    "value": standalone_gst.group(1).strip().upper(),
                    "confidence": 0.98,
                    "source_text": standalone_gst.group(0).strip()
                }

        # 4. Bank Account Number
        acc_pattern = r'(?:Account\s*Number|A/c\s*No\.?|Bank\s*Account\s*No\.?|Account\s*#)[\s:=]+([0-9]{9,18})'
        acc_match = re.search(acc_pattern, text, re.IGNORECASE)
        if acc_match:
            results["bank_account_number"] = {
                "value": acc_match.group(1).strip(),
                "confidence": 0.95,
                "source_text": acc_match.group(0).strip()
            }

        # 5. IFSC Code
        ifsc_pattern = r'(?:IFSC|IFSC\s*Code|RTGS/NEFT\s*IFSC)[\s:=]+([A-Z]{4}0[A-Z0-9]{6})'
        ifsc_match = re.search(ifsc_pattern, text, re.IGNORECASE)
        if ifsc_match:
            results["ifsc_code"] = {
                "value": ifsc_match.group(1).strip().upper(),
                "confidence": 0.98,
                "source_text": ifsc_match.group(0).strip()
            }
        else:
            standalone_ifsc = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text)
            if standalone_ifsc:
                results["ifsc_code"] = {
                    "value": standalone_ifsc.group(1).strip().upper(),
                    "confidence": 0.95,
                    "source_text": standalone_ifsc.group(0).strip()
                }

        # 6. Address
        addr_pattern = r'(?:Registered\s*(?:Office\s*)?Address|Registered\s*Office|Principal\s*Place\s*of\s*Business|Branch\s*Address|Address)[\s:=]+([^\r\n]+)'
        addr_match = re.search(addr_pattern, text, re.IGNORECASE)
        if addr_match:
            clean_addr = addr_match.group(1).strip()
            clean_addr = re.sub(r'^(?:Address|Office Address|Registered Office)[\s:=]+', '', clean_addr, flags=re.IGNORECASE).strip()
            clean_addr = re.split(r'\s+(?:Jurisdiction|Date\s*of\s*Liability|Account\s*Operational|Period|Authorized):', clean_addr, flags=re.IGNORECASE)[0].strip()
            clean_addr = re.sub(r'\s+', ' ', clean_addr).strip()
            if len(clean_addr) > 5:
                results["address"] = {
                    "value": clean_addr[:250],
                    "confidence": 0.92,
                    "source_text": addr_match.group(0).strip()[:150]
                }

        return results

    @staticmethod
    def update_corrections(
        db: Session,
        extraction_id: int,
        corrections: Dict[str, Optional[str]]
    ) -> DocumentExtraction:
        extraction = db.query(DocumentExtraction).filter(DocumentExtraction.id == extraction_id).first()
        if not extraction:
            raise ValueError("Document extraction record not found")
        
        current_corrections = extraction.user_edited_json or {}
        for key, val in corrections.items():
            if val is not None:
                current_corrections[key] = val.strip()
            elif key in current_corrections:
                del current_corrections[key]

        extraction.user_edited_json = current_corrections
        extraction.is_user_corrected = bool(current_corrections)
        db.commit()
        db.refresh(extraction)
        return extraction
