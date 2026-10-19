from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService
from app.services.vendor_service import VendorService
from app.models.workflow import Task

router = APIRouter(tags=["Tasks"])

def serialize_task(task: Task) -> TaskResponse:
    vendor_name = task.vendor.company_name if task.vendor else None
    return TaskResponse(
        id=task.id,
        vendor_id=task.vendor_id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        status=task.status,
        created_at=task.created_at,
        completed_at=task.completed_at,
        vendor_company_name=vendor_name
    )

@router.post("/vendors/{vendor_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_vendor_task(
    vendor_id: int,
    task_in: TaskCreate,
    db: Session = Depends(get_db)
):
    VendorService.get_vendor(db, vendor_id)
    task = TaskService.create_task(db, vendor_id, task_in)
    return serialize_task(task)

@router.get("/tasks", response_model=List[TaskResponse])
def get_all_tasks(
    status: Optional[str] = Query(None, description="PENDING or COMPLETED"),
    priority: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH"),
    vendor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    tasks = TaskService.get_all_tasks(db, status=status, priority=priority, vendor_id=vendor_id)
    return [serialize_task(t) for t in tasks]

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db)
):
    task = TaskService.update_task(db, task_id, task_in)
    return serialize_task(task)
