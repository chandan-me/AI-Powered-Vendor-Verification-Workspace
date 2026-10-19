from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    priority: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH")
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None  # PENDING, COMPLETED

class TaskResponse(BaseModel):
    id: int
    vendor_id: int
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[datetime] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    vendor_company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
