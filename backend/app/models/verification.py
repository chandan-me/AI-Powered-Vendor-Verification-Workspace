from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class FieldComparison(Base):
    __tablename__ = "field_comparisons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False)  # company_name, registration_number, gst_number, etc.
    
    vendor_value = Column(Text, nullable=True)
    registration_value = Column(Text, nullable=True)
    gst_value = Column(Text, nullable=True)
    bank_value = Column(Text, nullable=True)
    external_api_value = Column(Text, nullable=True)

    # Status: MATCH, MISMATCH, MISSING, NOT_CHECKED
    match_status = Column(String(50), nullable=False, default="NOT_CHECKED")
    explanation = Column(Text, nullable=True)
    # Review: PENDING, RESOLVED, IGNORED
    review_status = Column(String(50), default="PENDING", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="comparisons")

class CompanyVerification(Base):
    __tablename__ = "company_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(100), default="opencorporates", nullable=False)
    search_query = Column(String(255), nullable=False)
    jurisdiction_code = Column(String(50), nullable=True)
    api_status_code = Column(Integer, nullable=True)
    raw_response = Column(JSON, nullable=True)
    
    extracted_company_name = Column(String(255), nullable=True)
    extracted_reg_number = Column(String(100), nullable=True)
    extracted_jurisdiction = Column(String(100), nullable=True)
    extracted_status = Column(String(100), nullable=True)
    
    # Outcome: VERIFIED, MISMATCH, UNABLE_TO_VERIFY
    outcome = Column(String(50), nullable=False, default="UNABLE_TO_VERIFY")
    mismatch_notes = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=False, nullable=False)

    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="company_verifications")
