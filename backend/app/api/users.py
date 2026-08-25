from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_users_collection
from app.api.auth import get_current_user, require_roles
from app.models.user import UserResponse, UserRole

router = APIRouter(prefix="/users", tags=["Users Management"])

@router.get("", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))):
    users_coll = get_users_collection()
    cursor = users_coll.find({})
    users = await cursor.to_list(length=100)
    for u in users:
        u["id"] = str(u.get("_id") or u.get("id"))
    return users
