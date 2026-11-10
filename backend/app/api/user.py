"""
User profile and activity endpoints for authentication verification
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..auth import get_current_user
from ..database.user_service import UserService
from ..database.resume_service import ResumeService
from ..database.activity_service import ActivityLogService

router = APIRouter()


class ActivityLogRequest(BaseModel):
    action_type: str
    details: Optional[Dict[str, Any]] = None

@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get user profile information (requires authentication)
    Used to verify user is properly authenticated and exists in database
    """
    user_id = current_user["user_id"]
    email = current_user["email"]
    
    # Get user from database
    user_service = UserService()
    user = user_service.get_user_by_email(email)
    
    # Get resume count
    resume_service = ResumeService()
    resumes = resume_service.get_user_resumes(user_id) if user else []
    
    return {
        "status": "authenticated",
        "user_id": user_id,
        "email": email,
        "name": current_user.get("user_metadata", {}).get("name"),
        "id": user["id"] if user else None,
        "database_status": "exists" if user else "not_found",
        "resumes_count": len(resumes),
        "created_at": user["created_at"] if user else None
    }


@router.post("/activity")
async def log_user_activity(
    payload: ActivityLogRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Log authenticated user activity (e.g., dashboard visits)
    """
    user_id = current_user["user_id"]
    email = current_user["email"]

    user_service = UserService()
    activity_service = ActivityLogService()

    user = user_service.get_user_by_email(email)
    db_user_id = user["id"] if user else user_id

    logged = activity_service.log_activity(
        user_id=db_user_id,
        action_type=payload.action_type,
        details=payload.details or {}
    )

    return {
        "success": bool(logged),
        "action_type": payload.action_type,
        "activity_id": logged["id"] if logged else None
    }
