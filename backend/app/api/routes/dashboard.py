from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.vendor import Vendor
from app.models.workflow import Task, WorkflowHistory
from app.schemas.dashboard import DashboardStatsResponse, RecentActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    total = db.query(Vendor).count()
    draft = db.query(Vendor).filter(Vendor.status == "DRAFT").count()
    under_review = db.query(Vendor).filter(Vendor.status == "UNDER_REVIEW").count()
    action_required = db.query(Vendor).filter(Vendor.status == "ACTION_REQUIRED").count()
    approved = db.query(Vendor).filter(Vendor.status == "APPROVED").count()
    rejected = db.query(Vendor).filter(Vendor.status == "REJECTED").count()

    pending_tasks = db.query(Task).filter(Task.status == "PENDING").count()
    completed_tasks = db.query(Task).filter(Task.status == "COMPLETED").count()

    # Recent activity
    recent_history = db.query(WorkflowHistory).order_by(WorkflowHistory.created_at.desc()).limit(10).all()
    recent_activity = []
    for h in recent_history:
        vendor_name = h.vendor.company_name if h.vendor else f"Vendor #{h.vendor_id}"
        recent_activity.append(
            RecentActivityItem(
                id=h.id,
                vendor_id=h.vendor_id,
                vendor_name=vendor_name,
                action_type=f"{h.previous_status} -> {h.new_status}",
                description=h.reason or "Status transition",
                actor=h.actor,
                timestamp=h.created_at.strftime("%Y-%m-%d %H:%M:%S")
            )
        )

    return DashboardStatsResponse(
        total_vendors=total,
        draft_vendors=draft,
        under_review_vendors=under_review,
        action_required_vendors=action_required,
        approved_vendors=approved,
        rejected_vendors=rejected,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        recent_activity=recent_activity,
        status_distribution={
            "DRAFT": draft,
            "UNDER_REVIEW": under_review,
            "ACTION_REQUIRED": action_required,
            "APPROVED": approved,
            "REJECTED": rejected
        }
    )
