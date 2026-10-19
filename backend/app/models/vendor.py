from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    registration_number = Column(String(100), nullable=False, index=True)
    gst_number = Column(String(100), nullable=False, index=True)
    bank_account_number = Column(String(100), nullable=False)
    ifsc_code = Column(String(50), nullable=False)
    
    # Workflow status: DRAFT, UNDER_REVIEW, ACTION_REQUIRED, APPROVED, REJECTED
    status = Column(String(50), nullable=False, default="DRAFT", index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    documents = relationship("Document", back_populates="vendor", cascade="all, delete-orphan")
    versions = relationship("VendorVersion", back_populates="vendor", cascade="all, delete-orphan", order_by="desc(VendorVersion.version_number)")
    checklists = relationship("DocumentChecklist", back_populates="vendor", cascade="all, delete-orphan")
    workflow_history = relationship("WorkflowHistory", back_populates="vendor", cascade="all, delete-orphan", order_by="desc(WorkflowHistory.created_at)")
    comparisons = relationship("FieldComparison", back_populates="vendor", cascade="all, delete-orphan")
    company_verifications = relationship("CompanyVerification", back_populates="vendor", cascade="all, delete-orphan", order_by="desc(CompanyVerification.verified_at)")
    tasks = relationship("Task", back_populates="vendor", cascade="all, delete-orphan", order_by="desc(Task.created_at)")
    email_notifications = relationship("EmailNotification", back_populates="vendor", cascade="all, delete-orphan", order_by="desc(EmailNotification.sent_at)")

class VendorVersion(Base):
    __tablename__ = "vendor_versions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    snapshot = Column(JSON, nullable=False)  # Full snapshot of vendor attributes
    changed_fields = Column(JSON, nullable=True)  # Dict of {field: {"old": ..., "new": ...}}
    actor = Column(String(100), default="Reviewer")
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="versions")
