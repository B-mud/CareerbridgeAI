from sqlalchemy import Column, String, DateTime, JSON, Text, Integer
from sqlalchemy.sql import func
from .config import Base
import uuid

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, server_default=func.now())
    file_size = Column(Integer)
    
    # Analysis results stored as JSON
    detected_skills = Column(JSON)
    missing_skills = Column(JSON)
    skill_scores = Column(JSON)
    recommendations = Column(JSON)
    
    # Enhanced analysis data
    personal_info = Column(JSON)  # name, email, phone, etc.
    experience_data = Column(JSON)  # work experience details
    education_data = Column(JSON)  # education information
    projects_data = Column(JSON)  # project details
    ai_analysis = Column(JSON)  # AI insights and market data
    learning_resources = Column(JSON)  # courses, leetcode, etc.
    
    # Raw extracted text (optional, for future ML training)
    extracted_text = Column(Text)
    
    # Analysis metadata
    target_role = Column(String, default="software_engineer")
    experience_years = Column(Integer, default=0)
    experience_level = Column(String, default="intermediate")
    overall_match_score = Column(Integer, default=0)
    analysis_date = Column(DateTime)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)
    
    # User preferences
    preferred_role = Column(String, default="software_engineer")
    experience_level = Column(String, default="intermediate")  # beginner, intermediate, advanced

class SkillTrend(Base):
    __tablename__ = "skill_trends"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    skill_name = Column(String, nullable=False, index=True)
    demand_score = Column(Integer, default=0)
    growth_rate = Column(Integer, default=0)
    category = Column(String)  # programming, cloud, database, etc.
    last_updated = Column(DateTime, server_default=func.now())