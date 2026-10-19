from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class WorkflowTransitionRequest(BaseModel):
    new_status: str = Field(..., description="Target status: DRAFT, UNDER_REVIEW, ACTION_REQUIRED, APPROVED, REJECTED")
    reason: Optional[str] = None
    actor: Optional[str] = "Reviewer"

class WorkflowHistoryResponse(BaseModel):
    id: int
    vendor_id: int
    previous_status: str
    new_status: str
    reason: Optional[str] = None
    actor: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChecklistItemResponse(BaseModel):
    id: int
    vendor_id: int
    document_type: str
    status: str  # MISSING, AVAILABLE, VERIFIED
    notes: Optional[str] = None
    checked_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChecklistUpdateRequest(BaseModel):
    status: str = Field(..., description="MISSING, AVAILABLE, VERIFIED")
    notes: Optional[str] = None

class EmailNotificationResponse(BaseModel):
    id: int
    vendor_id: int
    recipient_email: str
    subject: str
    body_text: str
    missing_documents: Optional[List[str]] = None
    provider: str
    status: str
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TriggerMissingDocEmailRequest(BaseModel):
    force_resend: bool = False
