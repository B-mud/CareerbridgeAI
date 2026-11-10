from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class ResumeUploadResponse(BaseModel):
    success: bool
    message: str
    file_id: Optional[str] = None
    skills_detected: Optional[List[str]] = None
    analysis: Optional[Dict] = None

# New model for direct text parsing endpoint
class ParseResumeRequest(BaseModel):
    name: str
    role: str
    resume_text: str

class ParseResumeResponse(BaseModel):
    name: str
    role: str
    skills: List[str]
    experience: str
    summary: str
    skill_scores: Dict[str, int]
    recommendations: List[str]

class SkillAnalysis(BaseModel):
    detected_skills: List[str]
    missing_skills: List[str]
    skill_scores: dict
    recommendations: List[str]

class ResumeData(BaseModel):
    file_id: str
    filename: str
    upload_date: datetime
    skills: List[str]
    experience_years: Optional[int] = None
    education: Optional[str] = None

class LearningResource(BaseModel):
    title: str
    platform: str
    duration: Optional[str] = None
    rating: Optional[float] = None
    link: str
    type: str  # course, tutorial, practice, etc.

class LeetCodeProblem(BaseModel):
    title: str
    difficulty: str
    link: str
    tags: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    file_id: str
    target_role: str
    leetcode_problems: List[Dict]
    courses: List[Dict]
    learning_path: List[Dict]
    skill_priorities: Dict[str, List[str]]

class MarketInsights(BaseModel):
    role: str
    job_growth: str
    salary_range: str
    core_skills: List[str]
    trending_skills: List[Dict]
    market_summary: str