from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

class PRStatus(str, Enum):
    DRAFT = "Draft"
    PENDING_MANAGER = "Pending Manager Approval"
    PENDING_ADMIN = "Pending Admin Approval"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"

class PRPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class PRItem(BaseModel):
    item_name: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(default=0.0, ge=0.0)
    total_price: float = Field(default=0.0, ge=0.0)
    specification: Optional[str] = ""

class PRAttachment(BaseModel):
    file_name: str
    file_url: str
    file_size: Optional[int] = 0
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PRActivity(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_role: str
    action: str
    comment: Optional[str] = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RequesterInfo(BaseModel):
    id: str
    name: str
    email: str
    department: str
    role: str

class PRBase(BaseModel):
    title: str
    description: str
    department: str
    category: str
    priority: PRPriority = PRPriority.MEDIUM
    currency: str = "USD"
    items: List[PRItem] = []
    justification: Optional[str] = ""
    vendor_name: Optional[str] = ""
    required_by_date: Optional[str] = None

class PRCreate(PRBase):
    is_draft: bool = False

class PRUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[PRPriority] = None
    currency: Optional[str] = None
    items: Optional[List[PRItem]] = None
    justification: Optional[str] = None
    vendor_name: Optional[str] = None
    required_by_date: Optional[str] = None

class PRApprovalAction(BaseModel):
    action: str # "approve", "reject", "cancel", "submit"
    comment: Optional[str] = ""

class PRCommentCreate(BaseModel):
    comment: str

class PRResponse(PRBase):
    id: str
    pr_number: str
    status: PRStatus
    estimated_total_cost: float
    requester: RequesterInfo
    manager_approval: Optional[dict] = None
    admin_approval: Optional[dict] = None
    rejection_reason: Optional[str] = None
    attachments: List[PRAttachment] = []
    activities: List[PRActivity] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PRListResponse(BaseModel):
    prs: List[PRResponse]
    total: int
    page: int
    limit: int
    pages: int
