from typing import List, Dict, Any
from pydantic import BaseModel

class RecentActivityItem(BaseModel):
    id: int
    vendor_id: int
    vendor_name: str
    action_type: str
    description: str
    actor: str
    timestamp: str

class DashboardStatsResponse(BaseModel):
    total_vendors: int
    draft_vendors: int
    under_review_vendors: int
    action_required_vendors: int
    approved_vendors: int
    rejected_vendors: int
    pending_tasks: int
    completed_tasks: int
    recent_activity: List[RecentActivityItem]
    status_distribution: Dict[str, int]
