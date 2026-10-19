from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ExtractionField(BaseModel):
    value: Optional[str] = None
    confidence: Optional[float] = None
    source_text: Optional[str] = None

class DocumentExtractionData(BaseModel):
    company_name: Optional[ExtractionField] = None
    registration_number: Optional[ExtractionField] = None
    gst_number: Optional[ExtractionField] = None
    address: Optional[ExtractionField] = None
    bank_account_number: Optional[ExtractionField] = None
    ifsc_code: Optional[ExtractionField] = None

class DocumentExtractionResponse(BaseModel):
    id: int
    document_id: int
    raw_text: Optional[str] = None
    extracted_json: Optional[Dict[str, Any]] = None
    user_edited_json: Optional[Dict[str, Any]] = None
    is_user_corrected: bool
    model_used: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExtractionCorrectionRequest(BaseModel):
    company_name: Optional[str] = None
    registration_number: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    vendor_id: int
    document_type: str
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    processing_status: str
    verification_status: str
    uploaded_at: datetime
    extraction: Optional[DocumentExtractionResponse] = None

    model_config = ConfigDict(from_attributes=True)
