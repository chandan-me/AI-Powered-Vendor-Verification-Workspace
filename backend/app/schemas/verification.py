from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict

class FieldComparisonResponse(BaseModel):
    id: int
    vendor_id: int
    field_name: str
    vendor_value: Optional[str] = None
    registration_value: Optional[str] = None
    gst_value: Optional[str] = None
    bank_value: Optional[str] = None
    external_api_value: Optional[str] = None
    match_status: str  # MATCH, MISMATCH, MISSING, NOT_CHECKED
    explanation: Optional[str] = None
    review_status: str  # PENDING, RESOLVED, IGNORED
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ResolveDiscrepancyRequest(BaseModel):
    resolution_notes: str
    actor: Optional[str] = "Reviewer / Compliance Officer"

class CompanyVerificationRequest(BaseModel):
    query: Optional[str] = None  # defaults to vendor's company_name or registration_number
    jurisdiction_code: Optional[str] = None  # e.g., 'in', 'us_de', 'gb'

class CompanyVerificationResponse(BaseModel):
    id: int
    vendor_id: int
    provider: str
    search_query: str
    jurisdiction_code: Optional[str] = None
    api_status_code: Optional[int] = None
    raw_response: Optional[Dict[str, Any]] = None
    extracted_company_name: Optional[str] = None
    extracted_reg_number: Optional[str] = None
    extracted_jurisdiction: Optional[str] = None
    extracted_status: Optional[str] = None
    outcome: str  # VERIFIED, MISMATCH, UNABLE_TO_VERIFY
    mismatch_notes: Optional[str] = None
    is_simulated: bool
    verified_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ComparisonSummaryResponse(BaseModel):
    comparisons: List[FieldComparisonResponse]
    has_mismatches: bool
    mismatch_count: int
    match_count: int
    missing_count: int
