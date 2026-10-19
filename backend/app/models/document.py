from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    # Types: REGISTRATION_CERTIFICATE, GST_CERTIFICATE, BANK_DOCUMENT, OTHER
    document_type = Column(String(100), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # Statuses: PENDING, PROCESSING, EXTRACTED, FAILED
    processing_status = Column(String(50), default="PENDING", nullable=False)
    # Verification: UNVERIFIED, VERIFIED, REJECTED
    verification_status = Column(String(50), default="UNVERIFIED", nullable=False)
    
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="documents")
    extraction = relationship("DocumentExtraction", back_populates="document", uselist=False, cascade="all, delete-orphan")

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    raw_text = Column(Text, nullable=True)
    # Extracted structured fields: {field: {"value": ..., "confidence": ..., "source_text": ...}}
    extracted_json = Column(JSON, nullable=True)
    # Overridden user corrections: {field: "new_value"}
    user_edited_json = Column(JSON, nullable=True)
    is_user_corrected = Column(Boolean, default=False, nullable=False)
    model_used = Column(String(100), default="gpt-4o-mini", nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    document = relationship("Document", back_populates="extraction")
