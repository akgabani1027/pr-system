from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pymongo import DESCENDING
from app.core.database import get_prs_collection, get_activities_collection
from app.api.auth import get_current_user
from app.models.pr import PRStatus

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    prs_coll = get_prs_collection()
    act_coll = get_activities_collection()
    
    # Retrieve all PRs for aggregation
    cursor = prs_coll.find({})
    all_prs = await cursor.to_list(length=1000)
    
    total_count = len(all_prs)
    status_counts = {
        PRStatus.DRAFT.value: 0,
        PRStatus.PENDING_MANAGER.value: 0,
        PRStatus.PENDING_ADMIN.value: 0,
        PRStatus.APPROVED.value: 0,
        PRStatus.REJECTED.value: 0,
        PRStatus.CANCELLED.value: 0
    }
    
    total_approved_spend = 0.0
    total_pending_spend = 0.0
    total_requested_spend = 0.0
    
    dept_stats: Dict[str, Dict[str, Any]] = {}
    cat_stats: Dict[str, Dict[str, Any]] = {}
    priority_counts = {"Low": 0, "Medium": 0, "High": 0, "Urgent": 0}
    
    user_id = current_user.get("id")
    my_prs_count = 0
    my_pending_count = 0
    
    for pr in all_prs:
        st = pr.get("status", PRStatus.DRAFT.value)
        cost = float(pr.get("estimated_total_cost", 0.0))
        dept = pr.get("department", "General")
        cat = pr.get("category", "General")
        prio = pr.get("priority", "Medium")
        
        # Status counts
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts[st] = 1
            
        # Spend
        total_requested_spend += cost
        if st == PRStatus.APPROVED.value:
            total_approved_spend += cost
        elif st in [PRStatus.PENDING_MANAGER.value, PRStatus.PENDING_ADMIN.value]:
            total_pending_spend += cost
            
        # Dept breakdown
        if dept not in dept_stats:
            dept_stats[dept] = {"count": 0, "total_spend": 0.0, "approved_spend": 0.0}
        dept_stats[dept]["count"] += 1
        dept_stats[dept]["total_spend"] += cost
        if st == PRStatus.APPROVED.value:
            dept_stats[dept]["approved_spend"] += cost
            
        # Category breakdown
        if cat not in cat_stats:
            cat_stats[cat] = {"count": 0, "total_spend": 0.0}
        cat_stats[cat]["count"] += 1
        cat_stats[cat]["total_spend"] += cost
        
        # Priority
        if prio in priority_counts:
            priority_counts[prio] += 1
            
        # User specific
        if pr.get("requester", {}).get("id") == user_id:
            my_prs_count += 1
            if st in [PRStatus.PENDING_MANAGER.value, PRStatus.PENDING_ADMIN.value]:
                my_pending_count += 1

    # Recent activities
    act_cursor = act_coll.find({}).sort("timestamp", DESCENDING).limit(10)
    recent_activities = await act_cursor.to_list(length=10)
    for a in recent_activities:
        a["id"] = str(a.get("_id") or a.get("id"))

    # Convert depts and cats to lists for charting
    departments_list = [
        {"department": k, "count": v["count"], "total_spend": round(v["total_spend"], 2), "approved_spend": round(v["approved_spend"], 2)}
        for k, v in dept_stats.items()
    ]
    categories_list = [
        {"category": k, "count": v["count"], "total_spend": round(v["total_spend"], 2)}
        for k, v in cat_stats.items()
    ]

    return {
        "summary": {
            "total_prs": total_count,
            "total_approved_spend": round(total_approved_spend, 2),
            "total_pending_spend": round(total_pending_spend, 2),
            "total_requested_spend": round(total_requested_spend, 2),
            "pending_manager_approval": status_counts.get(PRStatus.PENDING_MANAGER.value, 0),
            "pending_admin_approval": status_counts.get(PRStatus.PENDING_ADMIN.value, 0),
            "total_pending": status_counts.get(PRStatus.PENDING_MANAGER.value, 0) + status_counts.get(PRStatus.PENDING_ADMIN.value, 0),
            "total_approved": status_counts.get(PRStatus.APPROVED.value, 0),
            "total_rejected": status_counts.get(PRStatus.REJECTED.value, 0),
            "my_prs_count": my_prs_count,
            "my_pending_count": my_pending_count
        },
        "status_distribution": status_counts,
        "priority_distribution": priority_counts,
        "departments": departments_list,
        "categories": categories_list,
        "recent_activities": recent_activities
    }
