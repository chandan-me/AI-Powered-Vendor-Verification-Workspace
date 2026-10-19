from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.workflow import Task
from app.schemas.task import TaskCreate, TaskUpdate

class TaskService:
    @classmethod
    def create_task(cls, db: Session, vendor_id: int, task_in: TaskCreate) -> Task:
        task = Task(
            vendor_id=vendor_id,
            title=task_in.title.strip(),
            description=task_in.description,
            priority=task_in.priority.upper(),
            due_date=task_in.due_date,
            status="PENDING"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def update_task(cls, db: Session, task_id: int, task_in: TaskUpdate) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task_in.title is not None:
            task.title = task_in.title.strip()
        if task_in.description is not None:
            task.description = task_in.description
        if task_in.priority is not None:
            task.priority = task_in.priority.upper()
        if task_in.due_date is not None:
            task.due_date = task_in.due_date
        if task_in.status is not None:
            new_status = task_in.status.upper()
            task.status = new_status
            if new_status == "COMPLETED" and not task.completed_at:
                task.completed_at = datetime.now(timezone.utc)
            elif new_status == "PENDING":
                task.completed_at = None

        db.commit()
        db.refresh(task)
        return task

    @classmethod
    def get_all_tasks(
        cls,
        db: Session,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        vendor_id: Optional[int] = None
    ) -> List[Task]:
        query = db.query(Task)
        if vendor_id:
            query = query.filter(Task.vendor_id == vendor_id)
        if status:
            query = query.filter(Task.status == status.upper())
        if priority:
            query = query.filter(Task.priority == priority.upper())
        return query.order_by(Task.created_at.desc()).all()
