from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

import re

class VendorBase(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    contact_person: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=50)
    address: str = Field(..., min_length=5)
    registration_number: str = Field(..., min_length=7, max_length=100)
    gst_number: str = Field(..., min_length=9, max_length=100)
    bank_account_number: str = Field(..., min_length=9, max_length=100)
    ifsc_code: str = Field(..., min_length=11, max_length=50)

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[a-zA-Z0-9\s]+$", clean):
            raise ValueError("Company name must contain letters, numbers, and spaces only. No special characters allowed.")
        if len(clean.split()) < 2:
            raise ValueError("Company legal name must contain at least 2 words (e.g. Acme Technologies Pvt Ltd). Single words not accepted.")
        return clean

    @field_validator("contact_person")
    @classmethod
    def validate_contact_person(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[a-zA-Z\s]+$", clean):
            raise ValueError("Contact person name must contain letters and spaces only. No numbers or special characters allowed.")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^\+?[0-9\s]+$", clean):
            raise ValueError("Phone number must contain digits only. No special characters allowed.")
        digits = re.sub(r"\D", "", clean)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Phone number must contain between 10 and 15 digits.")
        return clean

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[a-zA-Z0-9\s,.-]+$", clean):
            raise ValueError("Address must not contain special characters. Only letters, numbers, spaces, commas, and dots are allowed.")
        return clean

    @field_validator("registration_number")
    @classmethod
    def validate_registration_number(cls, v: str) -> str:
        clean = v.strip().upper().replace(" ", "")
        pattern = r"^(?:[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}|(?=.*[0-9])(?=.*[A-Z])[A-Z0-9]{7,25})$"
        if not re.match(pattern, clean):
            raise ValueError("Must be a valid 21-character CIN (e.g. U72900KA2021PTC145678) or alphanumeric Registration Number without special characters. Single words not accepted.")
        return clean

    @field_validator("gst_number")
    @classmethod
    def validate_gst_number(cls, v: str) -> str:
        clean = v.strip().upper().replace(" ", "")
        pattern = r"^(?:[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|(?=.*[0-9])(?=.*[A-Z])[A-Z0-9]{9,18})$"
        if not re.match(pattern, clean):
            raise ValueError("Must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5) or alphanumeric Tax ID without special characters. Single words not accepted.")
        return clean

    @field_validator("bank_account_number")
    @classmethod
    def validate_bank_account(cls, v: str) -> str:
        clean = v.strip()
        if not clean.isdigit() or len(clean) < 9 or len(clean) > 18:
            raise ValueError("Bank account number must be between 9 and 18 numeric digits only (e.g. 987654321098). Letters and special characters are not accepted.")
        return clean

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, v: str) -> str:
        clean = v.strip().upper().replace(" ", "")
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean):
            raise ValueError("Must be a valid 11-character IFSC code (e.g. HDFC0001234) without special characters. Single words not accepted.")
        return clean

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_person: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=50)
    address: Optional[str] = Field(None, min_length=5)
    registration_number: Optional[str] = Field(None, min_length=7, max_length=100)
    gst_number: Optional[str] = Field(None, min_length=9, max_length=100)
    bank_account_number: Optional[str] = Field(None, min_length=9, max_length=100)
    ifsc_code: Optional[str] = Field(None, min_length=11, max_length=50)
    change_reason: Optional[str] = "Manual update by reviewer"

    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip()
        if not re.match(r"^[a-zA-Z0-9\s]+$", clean):
            raise ValueError("Company name must contain letters, numbers, and spaces only. No special characters allowed.")
        if len(clean.split()) < 2:
            raise ValueError("Company legal name must contain at least 2 words. Single words not accepted.")
        return clean

    @field_validator("contact_person")
    @classmethod
    def validate_contact_person(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip()
        if not re.match(r"^[a-zA-Z\s]+$", clean):
            raise ValueError("Contact person name must contain letters and spaces only. No numbers or special characters allowed.")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip()
        if not re.match(r"^\+?[0-9\s]+$", clean):
            raise ValueError("Phone number must contain digits only. No special characters allowed.")
        digits = re.sub(r"\D", "", clean)
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Phone number must contain between 10 and 15 digits.")
        return clean

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip()
        if not re.match(r"^[a-zA-Z0-9\s,.-]+$", clean):
            raise ValueError("Address must not contain special characters. Only letters, numbers, spaces, commas, and dots are allowed.")
        return clean

    @field_validator("registration_number")
    @classmethod
    def validate_registration_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip().upper().replace(" ", "")
        pattern = r"^(?:[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}|(?=.*[0-9])(?=.*[A-Z])[A-Z0-9]{7,25})$"
        if not re.match(pattern, clean):
            raise ValueError("Must be a valid 21-character CIN or alphanumeric Registration Number without special characters. Single words not accepted.")
        return clean

    @field_validator("gst_number")
    @classmethod
    def validate_gst_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip().upper().replace(" ", "")
        pattern = r"^(?:[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}|(?=.*[0-9])(?=.*[A-Z])[A-Z0-9]{9,18})$"
        if not re.match(pattern, clean):
            raise ValueError("Must be a valid 15-character GSTIN or alphanumeric Tax ID without special characters. Single words not accepted.")
        return clean

    @field_validator("bank_account_number")
    @classmethod
    def validate_bank_account(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip()
        if not clean.isdigit() or len(clean) < 9 or len(clean) > 18:
            raise ValueError("Bank account number must be between 9 and 18 numeric digits only. Letters and special characters are not accepted.")
        return clean

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        clean = v.strip().upper().replace(" ", "")
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean):
            raise ValueError("Must be a valid 11-character IFSC code without special characters. Single words not accepted.")
        return clean

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
