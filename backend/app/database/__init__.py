from .config import engine, SessionLocal, get_db, Base
from .models import Resume, User, SkillTrend

# Supabase services
from .supabase_client import get_supabase_client, test_connection
from .user_service import UserService
from .resume_service import ResumeService
from .analysis_service import AnalysisService
from .activity_service import ActivityLogService

# Create all tables (for SQLite fallback)
def create_tables():
    Base.metadata.create_all(bind=engine)

__all__ = [
    "engine", "SessionLocal", "get_db", "Base", 
    "Resume", "User", "SkillTrend", "create_tables",
    "get_supabase_client", "test_connection",
    "UserService", "ResumeService", "AnalysisService", "ActivityLogService"
]