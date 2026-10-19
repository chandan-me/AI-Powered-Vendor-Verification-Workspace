from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.workflow import DocumentChecklist, WorkflowHistory, EmailNotification
from app.schemas.workflow import (
    WorkflowTransitionRequest,
    WorkflowHistoryResponse,
    ChecklistItemResponse,
    ChecklistUpdateRequest,
    EmailNotificationResponse,
    TriggerMissingDocEmailRequest
)
from app.schemas.vendor import VendorResponse
from app.schemas.task import TaskResponse
from app.services.vendor_service import VendorService
from app.services.workflow_service import WorkflowService
from app.services.email_service import EmailService
from app.api.routes.vendors import serialize_vendor

router = APIRouter(prefix="/vendors/{vendor_id}", tags=["Workflow & Checklist"])

@router.get("/checklist", response_model=List[ChecklistItemResponse])
def get_vendor_checklist(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    items = db.query(DocumentChecklist).filter(DocumentChecklist.vendor_id == vendor_id).all()
    if not items:
        items = WorkflowService.initialize_checklist(db, vendor_id)
    return items

@router.patch("/checklist/{checklist_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    vendor_id: int,
    checklist_id: int,
    update_in: ChecklistUpdateRequest,
    db: Session = Depends(get_db)
):
    item = db.query(DocumentChecklist).filter(
        DocumentChecklist.id == checklist_id,
        DocumentChecklist.vendor_id == vendor_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    item.status = update_in.status.upper()
    if update_in.notes is not None:
        item.notes = update_in.notes
    db.commit()
    db.refresh(item)
    return item

@router.patch("/workflow", response_model=VendorResponse)
def transition_vendor_workflow(
    vendor_id: int,
    req: WorkflowTransitionRequest,
    db: Session = Depends(get_db)
):
    vendor = VendorService.get_vendor(db, vendor_id)
    updated_vendor = WorkflowService.transition_status(
        db=db,
        vendor=vendor,
        new_status=req.new_status,
        reason=req.reason,
        actor=req.actor or "Reviewer"
    )
    return serialize_vendor(updated_vendor)

@router.get("/workflow-history", response_model=List[WorkflowHistoryResponse])
def get_workflow_history(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    history = db.query(WorkflowHistory).filter(
        WorkflowHistory.vendor_id == vendor_id
    ).order_by(WorkflowHistory.created_at.desc()).all()
    return history

@router.post("/check-missing", response_model=dict)
def evaluate_missing_documents_and_notify(
    vendor_id: int,
    req: TriggerMissingDocEmailRequest = TriggerMissingDocEmailRequest(),
    db: Session = Depends(get_db)
):
    vendor = VendorService.get_vendor(db, vendor_id)
    missing_docs, task = WorkflowService.evaluate_and_trigger_missing_documents(
        db=db,
        vendor=vendor,
        actor="Compliance Checker"
    )

    latest_email = db.query(EmailNotification).filter(
        EmailNotification.vendor_id == vendor_id
    ).order_by(EmailNotification.sent_at.desc()).first()

    return {
        "missing_documents": missing_docs,
        "action_required_triggered": bool(missing_docs),
        "task_created": bool(task),
        "task_id": task.id if task else None,
        "email_sent": bool(latest_email and latest_email.status in ["SENT", "DEMO_SIMULATED"]),
        "email_status": latest_email.status if latest_email else None
    }

@router.get("/emails", response_model=List[EmailNotificationResponse])
def get_email_notifications(vendor_id: int, db: Session = Depends(get_db)):
    VendorService.get_vendor(db, vendor_id)
    emails = db.query(EmailNotification).filter(
        EmailNotification.vendor_id == vendor_id
    ).order_by(EmailNotification.sent_at.desc()).all()
    return emails

@router.post("/emails/send-notice", response_model=EmailNotificationResponse)
def send_manual_compliance_notice(
    vendor_id: int,
    notice_type: str = Query("MISSING_DOCS", description="MISSING_DOCS, APPROVAL, REJECTION, or ACTION_REQUIRED"),
    reason: Optional[str] = Query(None),
    actor: str = Query("Compliance Reviewer"),
    db: Session = Depends(get_db)
):
    vendor = VendorService.get_vendor(db, vendor_id)
    if notice_type == "APPROVAL":
        email = EmailService.send_approval_notice(db, vendor, actor=actor)
    elif notice_type == "REJECTION":
        email = EmailService.send_rejection_notice(db, vendor, reason=reason, actor=actor)
    elif notice_type == "ACTION_REQUIRED":
        email = EmailService.send_action_required_notice(db, vendor, reason=reason, actor=actor)
    else:
        checklists = db.query(DocumentChecklist).filter(DocumentChecklist.vendor_id == vendor.id).all()
        missing_docs = [item.document_type.replace("_", " ").title() for item in checklists if item.status == "MISSING"] or ["Mandatory Verification Dossier"]
        email = EmailService.send_missing_documents_notice(db, vendor, missing_docs, force=True)
    return email

