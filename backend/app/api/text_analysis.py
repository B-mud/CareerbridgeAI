from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from ..database import get_db, Resume
from ..services.resume_parser import ResumeParser
from ..services.web_scraper import WebScraper

router = APIRouter()
parser = ResumeParser()
scraper = WebScraper()

class TextAnalysisRequest(BaseModel):
    resume_text: str
    target_role: str = "software_engineer"

class TextAnalysisResponse(BaseModel):
    success: bool
    file_id: str
    message: str
    analysis: dict = None

@router.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_resume_text(request: TextAnalysisRequest, db: Session = Depends(get_db)):
    """Analyze resume text directly without file upload"""
    try:
        if not request.resume_text.strip():
            raise HTTPException(status_code=400, detail="Resume text cannot be empty")
        
        # Generate unique ID for text analysis
        file_id = f"text_{uuid.uuid4()}"
        
        # Analyze the text using resume parser
        analysis = parser.analyze_resume_text(request.resume_text, request.target_role)
        
        # Save analysis to database
        db_resume = Resume(
            id=file_id,
            filename="text_input.txt",
            file_path="",  # No file path for text input
            file_size=len(request.resume_text),
            detected_skills=analysis.get("detected_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            skill_scores=analysis.get("skill_scores", {}),
            recommendations=analysis.get("recommendations", []),
            extracted_text=request.resume_text,
            target_role=request.target_role,
            analysis_date=datetime.utcnow(),
            personal_info=analysis.get("personal_info", {}),
            experience_data=analysis.get("experience", []),
            education_data=analysis.get("education", {}),
            projects_data=analysis.get("projects", []),
            ai_analysis=analysis.get("ai_analysis", {}),
            learning_resources=analysis.get("learning_resources", {}),
            experience_years=analysis.get("ai_analysis", {}).get("experience_years", 0),
            experience_level=analysis.get("ai_analysis", {}).get("experience_level", "intermediate"),
            overall_match_score=analysis.get("ai_analysis", {}).get("overall_match_score", 0)
        )
        
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        return TextAnalysisResponse(
            success=True,
            file_id=file_id,
            message="Resume text analyzed successfully",
            analysis=analysis
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/dynamic-recommendations/{file_id}")
async def get_dynamic_recommendations(file_id: str, db: Session = Depends(get_db)):
    """Get dynamic recommendations using web scraper"""
    try:
        # Get resume from database
        db_resume = db.query(Resume).filter(Resume.id == file_id).first()
        
        if not db_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        skills = db_resume.detected_skills or []
        target_role = db_resume.target_role or "software_engineer"
        experience_level = db_resume.experience_level or "intermediate"
        
        # Get comprehensive recommendations using web scraper
        recommendations = scraper.get_comprehensive_recommendations(skills, target_role, experience_level)
        
        return {
            "success": True,
            "file_id": file_id,
            "recommendations": recommendations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.post("/update-progress")
async def update_user_progress(progress_data: dict):
    """Update user progress data"""
    try:
        # In a real app, this would update user progress in database
        # For now, we'll just return success
        return {
            "success": True,
            "message": "Progress updated successfully",
            "data": progress_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")