from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base

class DocumentChecklist(Base):
    __tablename__ = "document_checklists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100), nullable=False) # REGISTRATION_CERTIFICATE, GST_CERTIFICATE, BANK_DOCUMENT
    # Status: MISSING, AVAILABLE, VERIFIED
    status = Column(String(50), default="MISSING", nullable=False)
    notes = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="checklists")

class WorkflowHistory(Base):
    __tablename__ = "workflow_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    actor = Column(String(100), default="Reviewer", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="workflow_history")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    # Priority: LOW, MEDIUM, HIGH
    priority = Column(String(20), default="MEDIUM", nullable=False)
    due_date = Column(DateTime, nullable=True)
    # Status: PENDING, COMPLETED
    status = Column(String(50), default="PENDING", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    vendor = relationship("Vendor", back_populates="tasks")

class EmailNotification(Base):
    __tablename__ = "email_notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body_text = Column(Text, nullable=False)
    missing_documents = Column(JSON, nullable=True)
    provider = Column(String(50), default="demo", nullable=False) # resend, smtp, demo
    # Status: SENT, FAILED, DEMO_SIMULATED
    status = Column(String(50), default="SENT", nullable=False)
    provider_message_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vendor = relationship("Vendor", back_populates="email_notifications")
