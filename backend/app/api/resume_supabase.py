"""
Updated Resume API with Supabase integration and JWT Authentication
Stores all resume data persistently in Supabase PostgreSQL
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional
from ..models.resume import ResumeUploadResponse, SkillAnalysis, ParseResumeRequest, ParseResumeResponse
from ..services.resume_parser import ResumeParser
from ..services.gemini_analyzer import gemini_analyzer
from ..services.skill_gap_service import get_skill_gap_service
from ..database import (
    UserService, ResumeService, AnalysisService, ActivityLogService
)
from ..auth import get_current_user, get_optional_user
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
parser = ResumeParser()
skill_gap_service = get_skill_gap_service()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize Supabase services
user_service = UserService()
resume_service = ResumeService()
analysis_service = AnalysisService()
activity_service = ActivityLogService()

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    target_role: Optional[str] = Form(None)
):
    """
    Upload and analyze resume - requires authentication
    JWT token must be provided in Authorization header
    Role is auto-extracted from resume by Gemini AI
    """
    
    file_path = None 
    
    try:
        # Get user info from JWT
        user_id = current_user["user_id"]
        user_email = current_user["email"]
        user_name = current_user.get("user_metadata", {}).get("name", user_email.split('@')[0])
        
        # Get or create user in database
        user = user_service.get_or_create_user(user_name, user_email)
        if not user:
            user_id = user_id  # Use JWT user_id as fallback
        else:
            # Use database user_id instead
            db_user_id = user["id"]
        
        # Validate file type
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail="Oops! 📄 We only accept PDF and DOCX files. Your file seems to be a different format. Please try again with a PDF or Word document!"
            )
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
        
        # Save uploaded file
        content = await file.read()
        file_size = len(content)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        logger.info(f"✅ File saved: {file_path}")
        
        # Extract text first
        raw_text = ""
        try:
            raw_text = parser.extract_text(file_path)
            logger.info(f"✅ Text extracted: {len(raw_text)} characters")
        except Exception as e:
            logger.error(f"❌ Text extraction failed: {str(e)}")
        
        # Analyze resume with Gemini AI - role will be auto-extracted
        analysis = None
        try:
            logger.info("🤖 Attempting Gemini AI analysis (auto-extracting role)...")
            analysis = gemini_analyzer.analyze_resume_with_gemini(raw_text, target_role)
            logger.info(f"✅ Gemini analysis complete - Name: {analysis.get('personal_info', {}).get('name', 'N/A')}")
            
            # Get auto-extracted role from analysis
            role = analysis.get("ai_analysis", {}).get("target_role", "software_engineer")
            logger.info(f"🎯 Auto-detected role: {role}")
        except Exception as e:
            logger.error(f"❌ Gemini analysis failed: {str(e)}, falling back to rule-based")
            try:
                analysis = parser.analyze_resume(file_path)
                logger.info(f"✅ Rule-based analysis complete")
            except Exception as e2:
                logger.error(f"❌ All analysis methods failed: {str(e2)}")
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                # Return minimal fallback
                analysis = {
                    "is_valid_resume": True,
                    "detected_skills": ["Communication", "Problem Solving", "Teamwork"],
                    "missing_skills": ["Python", "JavaScript", "SQL"],
                    "skill_scores": {"Communication": 80, "Problem Solving": 75, "Teamwork": 85},
                    "recommendations": ["Learn programming fundamentals", "Build a portfolio"],
                    "personal_info": {"name": user_name, "email": user_email},
                    "experience": [],
                    "education": {},
                    "projects": [],
                    "ai_analysis": {"experience_years": 0, "experience_level": "beginner", "overall_match_score": 60}
                }
        
        # Check if valid resume
        if not analysis.get("is_valid_resume", True):
            if os.path.exists(file_path):
                os.remove(file_path)
            
            validation = analysis.get("validation", {})
            raise HTTPException(
                status_code=400,
                detail=f"Invalid Resume! 📄❌ {validation.get('reason', 'This does not appear to be a resume.')} Please upload a proper resume."
            )
        
        # Extract text content (update if not already set)
        if not raw_text:
            raw_text = analysis.get("extracted_text", "")
        
        # Save resume to Supabase
        resume_record = resume_service.create_resume(
            user_id=db_user_id if user else user_id,
            role=role,
            raw_text=raw_text[:5000],  # Limit text length
            filename=file.filename
        )
        
        if not resume_record:
            raise HTTPException(status_code=500, detail="Failed to save resume to database")
        
        resume_id = resume_record["id"]
        logger.info(f"✅ Resume saved to Supabase: {resume_id}")
        
        # Get detected skills
        detected_skills = analysis.get("detected_skills", [])
        experience_level = analysis.get("ai_analysis", {}).get("experience_level", "intermediate")
        
        # ⭐ SKILL GAP ENGINE: Calculate real skill gap and match score
        skill_gap_analysis = skill_gap_service.calculate_skill_gap(
            detected_skills=detected_skills,
            target_role=role
        )
        
        # Extract results from skill gap engine
        match_score = skill_gap_analysis["match_score"]
        missing_skills = [skill["name"] for skill in skill_gap_analysis["missing_skills"]]
        possessed_skills = [skill["name"] for skill in skill_gap_analysis["possessed_skills"]]
        recommendations = skill_gap_analysis["recommendations"]
        
        logger.info(f"🎯 Skill Gap Analysis: {match_score}% match, {len(missing_skills)} skills missing")
        
        # Save analysis to Supabase with skill gap data
        analysis_record = analysis_service.create_analysis(
            resume_id=resume_id,
            skills=detected_skills,
            possessed_skills=possessed_skills,
            missing_skills=missing_skills,
            experience=experience_level,
            match_score=match_score,
            recommendations=[{"text": rec["message"], "priority": rec["priority"]} for rec in recommendations],
            metadata={
                "personal_info": analysis.get("personal_info", {}),
                "work_experience": analysis.get("work_experience", analysis.get("experience", [])),
                "education": analysis.get("education", {}),
                "experience_years": analysis.get("ai_analysis", {}).get("experience_years", 0),
                "target_role": role,
            }
        )
        
        if analysis_record:
            logger.info(f"✅ Analysis saved to Supabase: {analysis_record['id']}")
        
        # Log activity
        activity_service.log_activity(
            user_id=db_user_id if user else user_id,
            action_type="resume_upload",
            details={"resume_id": resume_id, "filename": file.filename}
        )
        
        validation_msg = analysis.get("validation", {}).get("reason", "Resume analyzed successfully")
        
        return ResumeUploadResponse(
            success=True,
            message=f"✅ {validation_msg}",
            file_id=resume_id,  # Return resume_id for frontend
            skills_detected=detected_skills,
            analysis=analysis  # Return full analysis for frontend to save in session
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Upload error: {e}")
        
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"✅ Cleaned up file: {file_path}")
            except Exception as cleanup_e:
                logger.error(f"❌ Cleanup failed: {cleanup_e}")
                
        raise HTTPException(
            status_code=500, 
            detail=f"Houston, we have a problem! 🚀 Server error: {str(e)}. Please try again!"
        )

@router.get("/latest")
async def get_latest_resume(current_user: dict = Depends(get_current_user)):
    """Get the latest resume for the authenticated user"""
    try:
        user_id = current_user["user_id"]
        user_email = current_user["email"]
        
        # Get user from database
        user = user_service.get_or_create_user(current_user.get("user_metadata", {}).get("name", user_email.split('@')[0]), user_email)
        db_user_id = user["id"] if user else user_id
        
        # Get user's resumes
        resumes = resume_service.get_user_resumes(db_user_id)
        
        if not resumes or len(resumes) == 0:
            return {"has_resume": False}
            
        latest_resume = resumes[0]
        return {
            "has_resume": True,
            "file_id": latest_resume["id"],
            "role": latest_resume.get("role", "software_engineer")
        }
    except Exception as e:
        logger.error(f"❌ Failed to get latest resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get latest resume: {str(e)}")

@router.get("/analyze/{resume_id}", response_model=SkillAnalysis)
async def get_skill_analysis(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed skill analysis from Supabase - requires authentication"""
    try:
        # Get analysis from Supabase
        analysis_record = analysis_service.get_analysis_by_resume_id(resume_id)
        
        if not analysis_record:
            raise HTTPException(
                status_code=404, 
                detail="Analysis not found! 🔍 Please upload your resume first."
            )
        
        possessed_skills = analysis_record.get("possessed_skills", analysis_record.get("skills", []))
        missing_skills = analysis_record.get("missing_skills", [])
        
        return SkillAnalysis(
            detected_skills=possessed_skills,
            missing_skills=missing_skills,
            skill_scores={skill: 75 for skill in possessed_skills},
            recommendations=[rec.get("text", "") if isinstance(rec, dict) else str(rec) 
                           for rec in analysis_record.get("recommendations", [])]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Analysis get error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get analysis: {str(e)}"
        )

@router.get("/full-analysis/{resume_id}")
async def get_full_analysis(
    resume_id: str
):
    """Get complete resume analysis from Supabase"""
    try:
        # Get resume from Supabase
        resume_record = resume_service.get_resume_by_id(resume_id)
        
        if not resume_record:
            raise HTTPException(
                status_code=404, 
                detail="Resume not found! 🔍 Please upload your resume first."
            )
        
        # Get analysis
        analysis_record = analysis_service.get_analysis_by_resume_id(resume_id)
        
        possessed_skills = analysis_record.get("possessed_skills", analysis_record.get("skills", [])) if analysis_record else []
        missing_skills = analysis_record.get("missing_skills", []) if analysis_record else []
        match_score = analysis_record.get("match_score", 0) if analysis_record else 0
        
        # Extract stored metadata (personal_info, work_experience, education, experience_years)
        metadata = analysis_service.extract_metadata(analysis_record) if analysis_record else {}
        plain_recs = analysis_service.get_plain_recommendations(analysis_record) if analysis_record else []
        
        # Build clean recommendations list
        recommendations = []
        for rec in plain_recs:
            if isinstance(rec, dict):
                recommendations.append(rec.get("text", str(rec)))
            else:
                recommendations.append(str(rec))
        
        # Use stored metadata for rich fields, fall back to defaults only if missing
        personal_info = metadata.get("personal_info") or {"name": "User", "email": "", "phone": ""}
        work_experience = metadata.get("work_experience") or []
        education_raw = metadata.get("education") or {}
        experience_years = metadata.get("experience_years", 0)
        target_role = metadata.get("target_role") or resume_record.get("role", "software_engineer")

        # Normalise education to frontend format
        if isinstance(education_raw, dict):
            education = {
                "level": education_raw.get("highest_degree") or education_raw.get("level") or "Not specified",
                "institutions": [
                    inst for inst in [
                        education_raw.get("institution"),
                        education_raw.get("field_of_study")
                    ] if inst
                ]
            }
        else:
            education = {"level": "Not specified", "institutions": []}

        # Normalise work experience to frontend format
        experience_list = []
        for exp in work_experience:
            if isinstance(exp, dict):
                experience_list.append({
                    "title": exp.get("position") or exp.get("title") or "Role",
                    "company": exp.get("company") or "Company",
                    "duration": exp.get("duration") or "",
                    "description": exp.get("description") or "",
                })

        return {
            "file_id": resume_record["id"],
            "filename": resume_record.get("filename", "unknown"),
            "upload_date": resume_record.get("created_at"),
            "role": target_role,
            "detected_skills": possessed_skills,
            "missing_skills": missing_skills,
            "skill_scores": {skill: 75 for skill in possessed_skills},
            "recommendations": recommendations,
            "personal_info": personal_info,
            "experience": experience_list,
            "education": education,
            "target_role": target_role,
            "ai_analysis": {
                "experience_years": experience_years,
                "experience_level": analysis_record.get("experience") if analysis_record else "intermediate",
                "overall_match_score": match_score,
                "target_role": target_role,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Full analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get analysis: {str(e)}"
        )

@router.delete("/delete/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete resume from Supabase - requires authentication"""
    try:
        # Delete from Supabase (cascade will delete related analysis)
        success = resume_service.delete_resume(resume_id)
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Resume not found!"
            )
        
        logger.info(f"✅ Resume deleted: {resume_id}")
        
        return {"success": True, "message": "Resume deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Delete error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete resume: {str(e)}"
        )

@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume_text(
    request: ParseResumeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Parse resume from text - requires authentication
    """
    logger.info(f"📥 Parse request: {request.name}, role: {request.role}")
    
    try:
        resume_text = request.resume_text.strip()
        
        if not resume_text or len(resume_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is too short! Please provide more details."
            )
        
        # Get user info from JWT
        user_id = current_user["user_id"]
        user_email = current_user["email"]
        user_name = current_user.get("user_metadata", {}).get("name", user_email.split('@')[0])
        
        # Get or create user in database
        user = user_service.get_or_create_user(user_name, user_email)
        db_user_id = user["id"] if user else user_id
        
        # Parse the resume text
        analysis = parser.parse_text_resume(resume_text, request.role)
        
        # Save to Supabase
        resume_record = resume_service.create_resume(
            user_id=db_user_id,
            role=request.role,
            raw_text=resume_text[:5000],
            filename=f"{request.name}_resume.txt"
        )
        
        if not resume_record:
            raise HTTPException(status_code=500, detail="Failed to save resume")
        
        resume_id = resume_record["id"]
        
        # Get detected skills
        detected_skills = analysis.get("detected_skills", [])
        experience_level = analysis.get("ai_analysis", {}).get("experience_level", "intermediate")
        
        # ⭐ SKILL GAP ENGINE: Calculate real skill gap and match score
        skill_gap_analysis = skill_gap_service.calculate_skill_gap(
            detected_skills=detected_skills,
            target_role=request.role
        )
        
        # Extract results
        match_score = skill_gap_analysis["match_score"]
        missing_skills = [skill["name"] for skill in skill_gap_analysis["missing_skills"]]
        possessed_skills = [skill["name"] for skill in skill_gap_analysis["possessed_skills"]]
        recommendations = skill_gap_analysis["recommendations"]
        
        logger.info(f"🎯 Skill Gap (parse): {match_score}% match, {len(missing_skills)} skills missing")
        
        # Save analysis with skill gap data
        analysis_service.create_analysis(
            resume_id=resume_id,
            skills=detected_skills,
            possessed_skills=possessed_skills,
            missing_skills=missing_skills,
            experience=experience_level,
            match_score=match_score,
            recommendations=[{"text": rec["message"], "priority": rec["priority"]} for rec in recommendations]
        )
        
        # Log activity
        activity_service.log_activity(
            user_id=db_user_id,
            action_type="resume_parse",
            details={"resume_id": resume_id, "role": request.role}
        )
        
        logger.info(f"✅ Resume parsed and saved: {resume_id}")
        
        return ParseResumeResponse(
            success=True,
            message="✅ Resume parsed successfully",
            file_id=resume_id,
            personal_info=analysis.get("personal_info", {}),
            experience=analysis.get("experience", []),
            education=analysis.get("education", {}),
            projects=analysis.get("projects", []),
            detected_skills=detected_skills,
            missing_skills=analysis.get("missing_skills", []),
            skill_scores=analysis.get("skill_scores", {}),
            recommendations=recommendations,
            ai_analysis=analysis.get("ai_analysis", {}),
            learning_resources=analysis.get("learning_resources", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Parse error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume: {str(e)}"
        )

@router.get("/user-resumes")
async def get_user_resumes(current_user: dict = Depends(get_current_user)):
    """Get all resumes for authenticated user"""
    try:
        user_id = current_user["user_id"]
        user_email = current_user["email"]
        
        # Get user from database
        user = user_service.get_user_by_email(user_email)
        
        if not user:
            return {"resumes": []}
        
        resumes = resume_service.get_user_resumes(user["id"])
        
        return {"resumes": resumes}
        
    except Exception as e:
        logger.error(f"❌ Get user resumes error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get resumes: {str(e)}"
        )
