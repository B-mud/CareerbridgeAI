"""
Supabase service layer for users table
"""
from datetime import datetime
from typing import Optional, Dict, Any
from .supabase_client import get_supabase_client
import logging
import uuid

logger = logging.getLogger(__name__)

class UserService:
    """Service for managing users in Supabase"""
    
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "users"
    
    def create_user(self, name: str, email: str) -> Optional[Dict[str, Any]]:
        """Create a new user"""
        try:
            user_data = {
                "id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(user_data).execute()
            logger.info(f"✅ User created: {email}")
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to create user: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            result = self.client.table(self.table).select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to get user by email: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.table(self.table).select("*").eq("id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to get user by ID: {e}")
            return None
    
    def get_or_create_user(self, name: str, email: str) -> Optional[Dict[str, Any]]:
        """Get existing user or create new one"""
        user = self.get_user_by_email(email)
        if user:
            return user
        return self.create_user(name, email)
