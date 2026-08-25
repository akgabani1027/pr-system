from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.core.database import get_users_collection
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    users_coll = get_users_collection()
    user = await users_coll.find_one({"_id": user_id})
    if not user:
        # Check by id if string
        user = await users_coll.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user["id"] = str(user.get("_id") or user.get("id"))
    return user

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    users_coll = get_users_collection()
    existing = await users_coll.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user_doc = {
        "_id": user_id,
        "id": user_id,
        "name": user_in.name,
        "email": user_in.email.lower(),
        "department": user_in.department,
        "role": user_in.role.value,
        "hashed_password": get_password_hash(user_in.password),
        "is_active": True,
        "created_at": now.isoformat()
    }
    await users_coll.insert_one(user_doc)
    
    token = create_access_token(subject=user_id, role=user_in.role.value)
    user_res = UserResponse(
        id=user_id,
        name=user_in.name,
        email=user_in.email.lower(),
        department=user_in.department,
        role=user_in.role,
        is_active=True,
        created_at=now
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_res)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_coll = get_users_collection()
    user = await users_coll.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = str(user.get("_id") or user.get("id"))
    token = create_access_token(subject=user_id, role=user.get("role", "employee"))
    
    created_at_val = user.get("created_at")
    if isinstance(created_at_val, str):
        try:
            created_at_val = datetime.fromisoformat(created_at_val)
        except Exception:
            created_at_val = None

    user_res = UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        department=user["department"],
        role=UserRole(user.get("role", "employee")),
        is_active=user.get("is_active", True),
        created_at=created_at_val
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_res)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    created_at_val = current_user.get("created_at")
    if isinstance(created_at_val, str):
        try:
            created_at_val = datetime.fromisoformat(created_at_val)
        except Exception:
            created_at_val = None
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        department=current_user["department"],
        role=UserRole(current_user.get("role", "employee")),
        is_active=current_user.get("is_active", True),
        created_at=created_at_val
    )
