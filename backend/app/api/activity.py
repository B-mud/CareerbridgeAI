"""Activity tracking API for LeetCode-style heat map."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging
from app.database.supabase_client import get_supabase_client
from app.database.user_service import UserService
from app.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/activity", tags=["activity"])

# Activity types
ACTIVITY_TYPES = {
    "mock_test_completed": "Mock Test Completed",
    "course_started": "Course Started",
    "course_completed": "Course Completed",
    "practice_problem_solved": "Practice Problem Solved",
    "skill_analyzed": "Skill Analyzed",
    "resume_uploaded": "Resume Uploaded",
    "job_viewed": "Job Viewed",
    "learning_path_accessed": "Learning Path Accessed",
}

def _resolve_db_user_id(current_user: Dict[str, Any]) -> Optional[str]:
    """Resolve auth user to internal users.id used by activity_logs foreign key."""
    try:
        user_service = UserService()
        email = current_user.get("email")
        if not email:
            logger.warning(f"Authenticated user has no email: {current_user}")
            return None

        name = current_user.get("user_metadata", {}).get("name") or email.split("@")[0]
        user = user_service.get_or_create_user(name=name, email=email)
        if not user or not user.get("id"):
            logger.warning(f"Could not resolve database user for email: {email}")
            return None

        return user["id"]
    except Exception as e:
        logger.warning(f"⚠️ Error resolving user ID: {e}")
        return None


@router.post("/log")
async def log_activity(
    activity_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Log user activity for heat map tracking
    
    Expected payload:
    {
        "action_type": "mock_test_completed",
        "details": {
            "score": 85,
            "time_spent": 1200
        }
    }
    """
    try:
        user_id = _resolve_db_user_id(current_user)
        action_type = activity_data.get("action_type", "unknown")
        details = activity_data.get("details", {})
        
        # Validate action type
        if action_type not in ACTIVITY_TYPES:
            logger.warning(f"Unknown activity type: {action_type}")
        
        # Log to Supabase
        supabase = get_supabase_client()
        result = supabase.table("activity_logs").insert({
            "user_id": user_id,
            "action_type": action_type,
            "details": details,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        logger.info(f"✅ Activity logged: {action_type} for user {user_id}")
        return {"status": "success", "activity_id": result.data[0]["id"]}
    
    except Exception as e:
        logger.error(f"❌ Error logging activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")


@router.get("/user-history")
async def get_user_activity_history(
    user_id: str = "",
    days: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """Get user's activity history for the past N days"""
    try:
        resolved_user_id = _resolve_db_user_id(current_user)
        
        # Return empty history if user resolution fails
        if not resolved_user_id:
            logger.info("No user ID resolved, returning empty history")
            return {
                "status": "success",
                "activities": [],
                "total": 0
            }
        
        supabase = get_supabase_client()
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query activity logs
        result = supabase.table("activity_logs")\
            .select("*")\
            .eq("user_id", resolved_user_id)\
            .gte("created_at", start_date.isoformat())\
            .lte("created_at", end_date.isoformat())\
            .order("created_at", desc=True)\
            .execute()
        
        return {
            "status": "success",
            "activities": result.data,
            "total": len(result.data)
        }
    
    except Exception as e:
        logger.warning(f"⚠️ Error fetching activity history: {str(e)}")
        # Return empty safe data
        return {
            "status": "success",
            "activities": [],
            "total": 0
        }


@router.get("/heat-map-data")
async def get_heat_map_data(
    user_id: str = "",
    current_user: dict = Depends(get_current_user),
):
    """
    Get heat map data (activity count by date)
    Returns data in format suitable for heat map visualization
    """
    try:
        resolved_user_id = _resolve_db_user_id(current_user)
        
        # Return empty data if user resolution fails
        if not resolved_user_id:
            logger.info("No user ID resolved, returning empty heat map")
            return {
                "status": "success",
                "heat_map": {},
                "stats": {
                    "total_activities": 0,
                    "unique_days": 0,
                    "current_streak": 0,
                    "longest_streak": 0,
                }
            }
        
        supabase = get_supabase_client()
        
        # Get activities from past 365 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=365)
        
        result = supabase.table("activity_logs")\
            .select("created_at")\
            .eq("user_id", resolved_user_id)\
            .gte("created_at", start_date.isoformat())\
            .lte("created_at", end_date.isoformat())\
            .execute()
        
        # Group by date
        heat_map_data = {}
        for activity in result.data:
            date_str = activity["created_at"].split("T")[0]  # YYYY-MM-DD
            heat_map_data[date_str] = heat_map_data.get(date_str, 0) + 1
        
        # Calculate streak
        current_streak = 0
        longest_streak = 0
        previous_date = None
        
        sorted_dates = sorted(heat_map_data.keys())
        for date_str in sorted_dates:
            current_date = datetime.fromisoformat(date_str).date()
            
            if previous_date is None or (current_date - previous_date).days == 1:
                current_streak += 1
            else:
                longest_streak = max(longest_streak, current_streak)
                current_streak = 1
            
            previous_date = current_date
        
        longest_streak = max(longest_streak, current_streak)
        
        return {
            "status": "success",
            "heat_map": heat_map_data,
            "stats": {
                "total_activities": len(result.data),
                "unique_days": len(heat_map_data),
                "current_streak": current_streak,
                "longest_streak": longest_streak,
            }
        }
    
    except Exception as e:
        logger.warning(f"⚠️ Error fetching heat map data: {str(e)}")
        # Return empty safe data instead of erroring
        return {
            "status": "success",
            "heat_map": {},
            "stats": {
                "total_activities": 0,
                "unique_days": 0,
                "current_streak": 0,
                "longest_streak": 0,
            }
        }


@router.get("/activity-types")
async def get_activity_types():
    """Get list of valid activity types"""
    return {
        "status": "success",
        "activity_types": ACTIVITY_TYPES
    }


@router.get("/summary")
async def get_activity_summary(
    user_id: str = "",
    days: int = 7,
    current_user: dict = Depends(get_current_user),
):
    """Get activity summary for dashboard"""
    try:
        resolved_user_id = _resolve_db_user_id(current_user)
        
        # Return empty summary if user resolution fails
        if not resolved_user_id:
            logger.info("No user ID resolved, returning empty summary")
            return {
                "status": "success",
                "period_days": days,
                "total_activities": 0,
                "activities_by_type": {},
                "date_range": {
                    "start": (datetime.utcnow() - timedelta(days=days)).isoformat(),
                    "end": datetime.utcnow().isoformat()
                }
            }
        
        supabase = get_supabase_client()
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        result = supabase.table("activity_logs")\
            .select("action_type, created_at")\
            .eq("user_id", resolved_user_id)\
            .gte("created_at", start_date.isoformat())\
            .execute()
        
        # Summary by activity type
        summary = {}
        for activity in result.data:
            action_type = activity["action_type"]
            summary[action_type] = summary.get(action_type, 0) + 1
        
        return {
            "status": "success",
            "period_days": days,
            "total_activities": len(result.data),
            "activities_by_type": summary,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }
    
    except Exception as e:
        logger.warning(f"⚠️ Error fetching activity summary: {str(e)}")
        # Return empty safe data
        return {
            "status": "success",
            "period_days": days,
            "total_activities": 0,
            "activities_by_type": {},
            "date_range": {
                "start": (datetime.utcnow() - timedelta(days=days)).isoformat(),
                "end": datetime.utcnow().isoformat()
            }
        }
