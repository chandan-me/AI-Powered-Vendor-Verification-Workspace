from datetime import datetime, timezone
from typing import List, Tuple, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.vendor import Vendor
from app.models.workflow import DocumentChecklist, WorkflowHistory, Task
from app.models.verification import FieldComparison
from app.services.email_service import EmailService

REQUIRED_DOCUMENT_TYPES = [
    "REGISTRATION_CERTIFICATE",
    "GST_CERTIFICATE",
    "BANK_DOCUMENT"
]

ALLOWED_TRANSITIONS = {
    "DRAFT": ["UNDER_REVIEW"],
    "UNDER_REVIEW": ["ACTION_REQUIRED", "APPROVED", "REJECTED"],
    "ACTION_REQUIRED": ["UNDER_REVIEW", "REJECTED"],
    "APPROVED": ["UNDER_REVIEW"], # allow re-opening if needed
    "REJECTED": ["UNDER_REVIEW", "DRAFT"], # allow re-evaluating
}

class WorkflowService:
    @classmethod
    def initialize_checklist(cls, db: Session, vendor_id: int) -> List[DocumentChecklist]:
        """Creates the initial required document checklist for a vendor."""
        items = []
        for doc_type in REQUIRED_DOCUMENT_TYPES:
            existing = db.query(DocumentChecklist).filter(
                DocumentChecklist.vendor_id == vendor_id,
                DocumentChecklist.document_type == doc_type
            ).first()
            if not existing:
                item = DocumentChecklist(
                    vendor_id=vendor_id,
                    document_type=doc_type,
                    status="MISSING",
                    notes="Mandatory document required for compliance review."
                )
                db.add(item)
                items.append(item)
            else:
                items.append(existing)
        db.commit()
        return items

    @classmethod
    def evaluate_and_trigger_missing_documents(
        cls,
        db: Session,
        vendor: Vendor,
        actor: str = "Automated System"
    ) -> Tuple[List[str], Optional[Task]]:
        """Scans checklist, and if required documents are missing: sets ACTION_REQUIRED, creates task, sends email."""
        checklists = db.query(DocumentChecklist).filter(DocumentChecklist.vendor_id == vendor.id).all()
        missing_docs = [item.document_type.replace("_", " ").title() for item in checklists if item.status == "MISSING"]

        if missing_docs:
            # 1. Update workflow to ACTION_REQUIRED if not already
            if vendor.status != "ACTION_REQUIRED":
                cls.transition_status(
                    db=db,
                    vendor=vendor,
                    new_status="ACTION_REQUIRED",
                    reason=f"Mandatory documents missing: {', '.join(missing_docs)}",
                    actor=actor,
                    bypass_rules=True
                )

            # 2. Prevent duplicate task for missing docs
            task_title = f"Collect Missing Documents: {vendor.company_name}"
            existing_task = db.query(Task).filter(
                Task.vendor_id == vendor.id,
                Task.title == task_title,
                Task.status == "PENDING"
            ).first()

            task = existing_task
            if not existing_task:
                task = Task(
                    vendor_id=vendor.id,
                    title=task_title,
                    description=f"Vendor is missing mandatory compliance documentation:\n- " + "\n- ".join(missing_docs),
                    priority="HIGH",
                    status="PENDING"
                )
                db.add(task)
                db.commit()
                db.refresh(task)

            # 3. Send email notice
            EmailService.send_missing_documents_notice(db, vendor, missing_docs)

            return missing_docs, task

        return [], None

    @classmethod
    def transition_status(
        cls,
        db: Session,
        vendor: Vendor,
        new_status: str,
        reason: Optional[str] = None,
        actor: str = "Reviewer",
        bypass_rules: bool = False
    ) -> Vendor:
        new_status = new_status.upper()
        current_status = vendor.status.upper()

        if current_status == new_status:
            return vendor

        # Validate transition
        if not bypass_rules:
            allowed = ALLOWED_TRANSITIONS.get(current_status, [])
            if new_status not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid workflow transition: Cannot move vendor from '{current_status}' to '{new_status}'. Allowed: {', '.join(allowed) or 'None'}"
                )

            # Special validation for APPROVAL
            if new_status == "APPROVED":
                cls._validate_approval_prerequisites(db, vendor)

        # Record history
        history = WorkflowHistory(
            vendor_id=vendor.id,
            previous_status=current_status,
            new_status=new_status,
            reason=reason or f"Status changed from {current_status} to {new_status}",
            actor=actor
        )
        db.add(history)

        vendor.status = new_status
        db.commit()
        db.refresh(vendor)

        # Automated Email Trigger based on workflow transition
        try:
            if new_status == "APPROVED":
                EmailService.send_approval_notice(db, vendor, actor=actor)
            elif new_status == "REJECTED":
                EmailService.send_rejection_notice(db, vendor, reason=reason, actor=actor)
            elif new_status == "ACTION_REQUIRED":
                EmailService.send_action_required_notice(db, vendor, reason=reason, actor=actor)
        except Exception as email_err:
            from app.core.logging import logger
            logger.error(f"Automated workflow email trigger failed: {email_err}")

        return vendor

    @classmethod
    def _validate_approval_prerequisites(cls, db: Session, vendor: Vendor):
        # 1. All required checklist items must be AVAILABLE or VERIFIED
        checklists = db.query(DocumentChecklist).filter(DocumentChecklist.vendor_id == vendor.id).all()
        for item in checklists:
            if item.document_type in REQUIRED_DOCUMENT_TYPES and item.status == "MISSING":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Approval blocked: Required document '{item.document_type}' is marked MISSING."
                )

        # 2. Check for unresolved high-priority tasks
        pending_high_tasks = db.query(Task).filter(
            Task.vendor_id == vendor.id,
            Task.status == "PENDING",
            Task.priority == "HIGH"
        ).count()
        if pending_high_tasks > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval blocked: There are {pending_high_tasks} pending HIGH priority compliance task(s) for this vendor."
            )
