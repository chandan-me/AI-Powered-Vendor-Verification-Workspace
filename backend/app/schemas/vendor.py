from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

class VendorBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    contact_person: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=50)
    address: str = Field(..., min_length=5)
    registration_number: str = Field(..., min_length=2, max_length=100)
    gst_number: str = Field(..., min_length=5, max_length=100)
    bank_account_number: str = Field(..., min_length=5, max_length=100)
    ifsc_code: str = Field(..., min_length=4, max_length=50)

    @field_validator("bank_account_number")
    @classmethod
    def validate_bank_account(cls, v: str) -> str:
        clean = v.strip()
        if not clean.isalnum():
            raise ValueError("Bank account number must contain alphanumeric characters only")
        return clean

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, v: str) -> str:
        return v.strip().upper()

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_person: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=50)
    address: Optional[str] = Field(None, min_length=5)
    registration_number: Optional[str] = Field(None, min_length=2, max_length=100)
    gst_number: Optional[str] = Field(None, min_length=5, max_length=100)
    bank_account_number: Optional[str] = Field(None, min_length=5, max_length=100)
    ifsc_code: Optional[str] = Field(None, min_length=4, max_length=50)
    change_reason: Optional[str] = "Manual update by reviewer"

class VendorResponse(BaseModel):
    id: int
    company_name: str
    contact_person: str
    email: str
    phone: str
    address: str
    registration_number: str
    gst_number: str
    bank_account_number_masked: str
    bank_account_number: Optional[str] = None
    ifsc_code: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VendorVersionResponse(BaseModel):
    id: int
    vendor_id: int
    version_number: int
    snapshot: Dict[str, Any]
    changed_fields: Optional[Dict[str, Any]] = None
    actor: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VersionRestoreRequest(BaseModel):
    reason: Optional[str] = "Restored from historical version"
