from datetime import datetime, timezone
import uuid
import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pymongo import DESCENDING, ASCENDING
from app.core.config import settings
from app.core.database import get_prs_collection, get_activities_collection
from app.api.auth import get_current_user, require_roles
from app.models.user import UserRole
from app.models.pr import (
    PRCreate, PRUpdate, PRResponse, PRListResponse, 
    PRStatus, PRPriority, PRItem, PRAttachment, PRActivity, 
    RequesterInfo, PRApprovalAction, PRCommentCreate
)

router = APIRouter(prefix="/prs", tags=["Purchase Requisitions"])

async def get_next_pr_number() -> str:
    prs_coll = get_prs_collection()
    count = await prs_coll.count_documents({})
    current_year = datetime.now().year
    return f"PR-{current_year}-{(count + 1):04d}"

def calculate_pr_costs(items: List[PRItem]) -> (List[dict], float):
    processed_items = []
    total = 0.0
    for item in items:
        item_total = round(item.quantity * item.unit_price, 2)
        total += item_total
        processed_items.append({
            "item_name": item.item_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item_total,
            "specification": item.specification or ""
        })
    return processed_items, round(total, 2)

@router.post("", response_model=PRResponse, status_code=status.HTTP_201_CREATED)
async def create_pr(pr_in: PRCreate, current_user: dict = Depends(get_current_user)):
    prs_coll = get_prs_collection()
    act_coll = get_activities_collection()
    
    pr_id = str(uuid.uuid4())
    pr_number = await get_next_pr_number()
    now = datetime.now(timezone.utc)
    
    items_data, total_cost = calculate_pr_costs(pr_in.items)
    initial_status = PRStatus.DRAFT if pr_in.is_draft else PRStatus.PENDING_MANAGER
    
    requester_info = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "department": current_user.get("department", pr_in.department),
        "role": current_user.get("role", "employee")
    }
    
    activity_entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_role": current_user.get("role", "employee"),
        "action": "Created Draft" if pr_in.is_draft else "Submitted Requisition",
        "comment": f"Initial requisition total: ${total_cost:.2f}",
        "timestamp": now.isoformat()
    }
    
    pr_doc = {
        "_id": pr_id,
        "id": pr_id,
        "pr_number": pr_number,
        "title": pr_in.title,
        "description": pr_in.description,
        "department": pr_in.department,
        "category": pr_in.category,
        "priority": pr_in.priority.value,
        "currency": pr_in.currency,
        "items": items_data,
        "estimated_total_cost": total_cost,
        "justification": pr_in.justification or "",
        "vendor_name": pr_in.vendor_name or "",
        "required_by_date": pr_in.required_by_date,
        "status": initial_status.value,
        "requester": requester_info,
        "manager_approval": None,
        "admin_approval": None,
        "rejection_reason": None,
        "attachments": [],
        "activities": [activity_entry],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await prs_coll.insert_one(pr_doc)
    await act_coll.insert_one({
        **activity_entry,
        "pr_id": pr_id,
        "pr_number": pr_number
    })
    
    return pr_doc

@router.get("", response_model=PRListResponse)
async def list_prs(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    department: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    my_prs: Optional[bool] = False,
    awaiting_my_approval: Optional[bool] = False,
    min_cost: Optional[float] = None,
    max_cost: Optional[float] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    prs_coll = get_prs_collection()
    query = {}
    
    # Text search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"pr_number": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"vendor_name": {"$regex": search, "$options": "i"}},
            {"requester.name": {"$regex": search, "$options": "i"}}
        ]
        
    if status_filter:
        query["status"] = status_filter
    if department:
        query["department"] = department
    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority
    if min_cost is not None:
        query.setdefault("estimated_total_cost", {})["$gte"] = min_cost
    if max_cost is not None:
        query.setdefault("estimated_total_cost", {})["$lte"] = max_cost
        
    if my_prs:
        query["requester.id"] = current_user["id"]
        
    if awaiting_my_approval:
        user_role = current_user.get("role")
        if user_role == UserRole.MANAGER.value:
            query["status"] = PRStatus.PENDING_MANAGER.value
        elif user_role == UserRole.ADMIN.value:
            query["status"] = PRStatus.PENDING_ADMIN.value
            
    total_count = await prs_coll.count_documents(query)
    direction = DESCENDING if sort_order.lower() == "desc" else ASCENDING
    skip_val = (page - 1) * limit
    
    cursor = prs_coll.find(query).sort(sort_by, direction).skip(skip_val).limit(limit)
    docs = await cursor.to_list(length=limit)
    
    for d in docs:
        d["id"] = str(d.get("_id") or d.get("id"))
        
    pages = (total_count + limit - 1) // limit if limit > 0 else 1
    return PRListResponse(
        prs=docs,
        total=total_count,
        page=page,
        limit=limit,
        pages=pages
    )

@router.get("/{pr_id}", response_model=PRResponse)
async def get_pr_by_id(pr_id: str, current_user: dict = Depends(get_current_user)):
    prs_coll = get_prs_collection()
    pr = await prs_coll.find_one({"_id": pr_id})
    if not pr:
        pr = await prs_coll.find_one({"id": pr_id})
    if not pr:
        pr = await prs_coll.find_one({"pr_number": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    pr["id"] = str(pr.get("_id") or pr.get("id"))
    return pr

@router.put("/{pr_id}", response_model=PRResponse)
async def update_pr(pr_id: str, pr_in: PRUpdate, current_user: dict = Depends(get_current_user)):
    prs_coll = get_prs_collection()
    pr = await prs_coll.find_one({"_id": pr_id}) or await prs_coll.find_one({"id": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    # Permission check: Only author (or admin) can edit, and only if in Draft or Pending Manager
    is_author = pr.get("requester", {}).get("id") == current_user["id"]
    is_admin = current_user.get("role") == UserRole.ADMIN.value
    if not is_author and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit someone else's requisition")
        
    current_status = pr.get("status")
    if current_status not in [PRStatus.DRAFT.value, PRStatus.PENDING_MANAGER.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Requisition cannot be edited while in status '{current_status}'"
        )
        
    update_data = {}
    if pr_in.title is not None:
        update_data["title"] = pr_in.title
    if pr_in.description is not None:
        update_data["description"] = pr_in.description
    if pr_in.department is not None:
        update_data["department"] = pr_in.department
    if pr_in.category is not None:
        update_data["category"] = pr_in.category
    if pr_in.priority is not None:
        update_data["priority"] = pr_in.priority.value
    if pr_in.currency is not None:
        update_data["currency"] = pr_in.currency
    if pr_in.justification is not None:
        update_data["justification"] = pr_in.justification
    if pr_in.vendor_name is not None:
        update_data["vendor_name"] = pr_in.vendor_name
    if pr_in.required_by_date is not None:
        update_data["required_by_date"] = pr_in.required_by_date
        
    if pr_in.items is not None:
        items_data, total_cost = calculate_pr_costs(pr_in.items)
        update_data["items"] = items_data
        update_data["estimated_total_cost"] = total_cost
        
    now = datetime.now(timezone.utc)
    update_data["updated_at"] = now.isoformat()
    
    activity_entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_role": current_user.get("role", "employee"),
        "action": "Updated Requisition",
        "comment": "Requisition details updated",
        "timestamp": now.isoformat()
    }
    
    await prs_coll.update_one(
        {"_id": pr.get("_id")},
        {"$set": update_data, "$push": {"activities": activity_entry}}
    )
    
    updated_pr = await prs_coll.find_one({"_id": pr.get("_id")})
    updated_pr["id"] = str(updated_pr.get("_id") or updated_pr.get("id"))
    return updated_pr

@router.post("/{pr_id}/action", response_model=PRResponse)
async def perform_pr_action(
    pr_id: str, 
    action_in: PRApprovalAction, 
    current_user: dict = Depends(get_current_user)
):
    prs_coll = get_prs_collection()
    act_coll = get_activities_collection()
    
    pr = await prs_coll.find_one({"_id": pr_id}) or await prs_coll.find_one({"id": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    user_id = current_user["id"]
    user_name = current_user["name"]
    user_role = current_user.get("role", "employee")
    current_status = pr.get("status")
    action = action_in.action.lower()
    now = datetime.now(timezone.utc)
    
    set_fields = {"updated_at": now.isoformat()}
    activity_action = ""
    activity_comment = action_in.comment or ""
    
    if action == "submit":
        if pr.get("requester", {}).get("id") != user_id and user_role != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only requester can submit this draft")
        if current_status != PRStatus.DRAFT.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requisition is already submitted")
            
        set_fields["status"] = PRStatus.PENDING_MANAGER.value
        activity_action = "Submitted for Approval"
        
    elif action == "cancel":
        if pr.get("requester", {}).get("id") != user_id and user_role != UserRole.ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only requester can cancel this requisition")
        if current_status in [PRStatus.APPROVED.value, PRStatus.REJECTED.value, PRStatus.CANCELLED.value]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel requisition with status {current_status}")
            
        set_fields["status"] = PRStatus.CANCELLED.value
        activity_action = "Cancelled Requisition"
        
    elif action == "approve":
        if current_status == PRStatus.PENDING_MANAGER.value:
            if user_role not in [UserRole.MANAGER.value, UserRole.ADMIN.value]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or Admin role required for Tier 1 approval")
            
            # Tier 1 Approval -> moves to Pending Admin Approval
            set_fields["status"] = PRStatus.PENDING_ADMIN.value
            set_fields["manager_approval"] = {
                "user_id": user_id,
                "user_name": user_name,
                "user_role": user_role,
                "timestamp": now.isoformat(),
                "comment": action_in.comment or "Manager approval granted"
            }
            activity_action = "Manager Approved (Tier 1)"
            
        elif current_status == PRStatus.PENDING_ADMIN.value:
            if user_role != UserRole.ADMIN.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required for Final approval")
                
            # Tier 2 Approval -> Fully Approved
            set_fields["status"] = PRStatus.APPROVED.value
            set_fields["admin_approval"] = {
                "user_id": user_id,
                "user_name": user_name,
                "timestamp": now.isoformat(),
                "comment": action_in.comment or "Final Admin approval granted"
            }
            activity_action = "Final Admin Approval Granted"
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot approve requisition in status '{current_status}'")
            
    elif action == "reject":
        if user_role not in [UserRole.MANAGER.value, UserRole.ADMIN.value]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or Admin role required to reject")
        if current_status in [PRStatus.APPROVED.value, PRStatus.REJECTED.value, PRStatus.CANCELLED.value]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot reject requisition in status '{current_status}'")
            
        set_fields["status"] = PRStatus.REJECTED.value
        set_fields["rejection_reason"] = action_in.comment or "Rejected without specific comment"
        activity_action = f"Rejected by {user_role.capitalize()}"
        
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown workflow action: {action}")
        
    activity_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "action": activity_action,
        "comment": activity_comment,
        "timestamp": now.isoformat()
    }
    
    await prs_coll.update_one(
        {"_id": pr.get("_id")},
        {"$set": set_fields, "$push": {"activities": activity_entry}}
    )
    
    await act_coll.insert_one({
        **activity_entry,
        "pr_id": str(pr.get("_id") or pr.get("id")),
        "pr_number": pr.get("pr_number")
    })
    
    updated_pr = await prs_coll.find_one({"_id": pr.get("_id")})
    updated_pr["id"] = str(updated_pr.get("_id") or updated_pr.get("id"))
    return updated_pr

@router.post("/{pr_id}/comments", response_model=PRResponse)
async def add_pr_comment(
    pr_id: str, 
    comment_in: PRCommentCreate, 
    current_user: dict = Depends(get_current_user)
):
    prs_coll = get_prs_collection()
    act_coll = get_activities_collection()
    
    pr = await prs_coll.find_one({"_id": pr_id}) or await prs_coll.find_one({"id": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    now = datetime.now(timezone.utc)
    activity_entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_role": current_user.get("role", "employee"),
        "action": "Added Comment",
        "comment": comment_in.comment,
        "timestamp": now.isoformat()
    }
    
    await prs_coll.update_one(
        {"_id": pr.get("_id")},
        {"$set": {"updated_at": now.isoformat()}, "$push": {"activities": activity_entry}}
    )
    
    await act_coll.insert_one({
        **activity_entry,
        "pr_id": str(pr.get("_id") or pr.get("id")),
        "pr_number": pr.get("pr_number")
    })
    
    updated_pr = await prs_coll.find_one({"_id": pr.get("_id")})
    updated_pr["id"] = str(updated_pr.get("_id") or updated_pr.get("id"))
    return updated_pr

@router.post("/{pr_id}/attachments", response_model=PRResponse)
async def upload_attachment(
    pr_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    prs_coll = get_prs_collection()
    pr = await prs_coll.find_one({"_id": pr_id}) or await prs_coll.find_one({"id": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()[:8]}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    now = datetime.now(timezone.utc)
    
    attachment_entry = {
        "file_name": file.filename,
        "file_url": f"/uploads/{safe_filename}",
        "file_size": file_size,
        "uploaded_at": now.isoformat()
    }
    
    activity_entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_role": current_user.get("role", "employee"),
        "action": "Attached Document",
        "comment": f"Uploaded {file.filename} ({file_size // 1024} KB)",
        "timestamp": now.isoformat()
    }
    
    await prs_coll.update_one(
        {"_id": pr.get("_id")},
        {
            "$set": {"updated_at": now.isoformat()},
            "$push": {
                "attachments": attachment_entry,
                "activities": activity_entry
            }
        }
    )
    
    updated_pr = await prs_coll.find_one({"_id": pr.get("_id")})
    updated_pr["id"] = str(updated_pr.get("_id") or updated_pr.get("id"))
    return updated_pr

@router.delete("/{pr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pr(pr_id: str, current_user: dict = Depends(get_current_user)):
    prs_coll = get_prs_collection()
    pr = await prs_coll.find_one({"_id": pr_id}) or await prs_coll.find_one({"id": pr_id})
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requisition not found")
        
    is_author = pr.get("requester", {}).get("id") == current_user["id"]
    is_admin = current_user.get("role") == UserRole.ADMIN.value
    
    if not is_admin and not (is_author and pr.get("status") == PRStatus.DRAFT.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Only draft requisitions can be deleted by authors, or any by admin"
        )
        
    await prs_coll.delete_one({"_id": pr.get("_id")})
    return None
