"""
Supabase service layer for resumes table
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from .supabase_client import get_supabase_client
import logging
import uuid

logger = logging.getLogger(__name__)

class ResumeService:
    """Service for managing resumes in Supabase"""
    
    def __init__(self):
        try:
            self.client = get_supabase_client()
        except:
            self.client = None
        self.table = "resumes"
    
    def is_available(self) -> bool:
        """Check if Supabase client is available"""
        return self.client is not None
    
    def create_resume(
        self,
        user_id: str,
        role: str,
        raw_text: str,
        filename: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new resume record"""
        if not self.is_available():
            logger.warning("⚠️ Supabase not available, skipping resume creation")
            return None
            
        try:
            resume_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "role": role,
                "raw_text": raw_text,
                "filename": filename,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(resume_data).execute()
            logger.info(f"✅ Resume created for user: {user_id}")
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to create resume: {e}")
            return None
    
    def get_resume_by_id(self, resume_id: str) -> Optional[Dict[str, Any]]:
        """Get resume by ID"""
        if not self.is_available():
            logger.warning("⚠️ Supabase not available, cannot get resume")
            return None
            
        try:
            result = self.client.table(self.table).select("*").eq("id", resume_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to get resume: {e}")
            return None
    
    def get_user_resumes(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all resumes for a user"""
        if not self.is_available():
            logger.warning("⚠️ Supabase not available, cannot get user resumes")
            return []
            
        try:
            result = self.client.table(self.table).select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Failed to get user resumes: {e}")
            return []
    
    def delete_resume(self, resume_id: str) -> bool:
        """Delete a resume"""
        if not self.is_available():
            logger.warning("⚠️ Supabase not available, cannot delete resume")
            return False
            
        try:
            self.client.table(self.table).delete().eq("id", resume_id).execute()
            logger.info(f"✅ Resume deleted: {resume_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete resume: {e}")
            return False
