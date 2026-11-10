"""
Supabase service layer for activity_logs table
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from .supabase_client import get_supabase_client
import logging
import uuid

logger = logging.getLogger(__name__)

class ActivityLogService:
    """Service for managing activity logs in Supabase"""
    
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "activity_logs"
    
    def log_activity(
        self,
        user_id: str,
        action_type: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new activity log"""
        try:
            log_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "action_type": action_type,
                "details": details or {},
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(log_data).execute()
            logger.info(f"✅ Activity logged: {action_type} for user {user_id}")
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to log activity: {e}")
            return None
    
    def get_user_activities(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get activity logs for a user"""
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Failed to get user activities: {e}")
            return []
    
    def get_recent_activities(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent activity logs"""
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Failed to get recent activities: {e}")
            return []
