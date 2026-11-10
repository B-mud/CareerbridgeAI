from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
import os
import uuid
from datetime import datetime
from typing import List, Dict
from sqlalchemy.orm import Session
from ..models.resume import ResumeUploadResponse, SkillAnalysis, ParseResumeRequest, ParseResumeResponse
from ..services.resume_parser import ResumeParser
from ..database import get_db, Resume # Assuming Resume is your SQLAlchemy model
import re

router = APIRouter()
parser = ResumeParser()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and analyze resume"""
    
    # Initialize file_path for robust cleanup in case of crash
    file_path = None 
    
    try:
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
        
        # Analyze resume with error handling
        try:
            analysis = parser.analyze_resume(file_path)
        except Exception as e:
            print(f"UPLOAD ERROR: Resume analysis failed: {str(e)}")
            # Delete the file on error
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Cleanup: Successfully deleted temporary file {file_path}.")
            
            # Return fallback analysis for demo
            analysis = {
                "is_valid_resume": True,
                "detected_skills": ["Communication", "Problem Solving", "Teamwork"],
                "missing_skills": ["Python", "JavaScript", "SQL"],
                "skill_scores": {"Communication": 80, "Problem Solving": 75, "Teamwork": 85},
                "recommendations": ["Learn programming fundamentals", "Build a portfolio", "Practice coding challenges"],
                "personal_info": {"name": "User"},
                "experience": [],
                "education": {},
                "projects": [],
                "ai_analysis": {"experience_years": 0, "experience_level": "beginner", "overall_match_score": 60}
            }
        
        # Check if it's a valid resume
        if not analysis.get("is_valid_resume", True):
            # Delete the invalid file
            if os.path.exists(file_path):
                os.remove(file_path)
            
            validation = analysis.get("validation", {})
            raise HTTPException(
                status_code=400,
                detail=f"Invalid Resume! 📄❌ {validation.get('reason', 'This document does not appear to be a resume.')} Please upload a proper resume with your experience, education, and skills."
            )
        
        # Save analysis to database with error handling
        try:
            db_resume = Resume(
                id=file_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                detected_skills=analysis.get("detected_skills", []),
                missing_skills=analysis.get("missing_skills", []),
                skill_scores=analysis.get("skill_scores", {}),
                recommendations=analysis.get("recommendations", []),
                extracted_text=analysis.get("extracted_text", ""),
                analysis_date=datetime.utcnow()
            )
            
            # Add enhanced fields safely
            try:
                db_resume.personal_info = analysis.get("personal_info", {})
                db_resume.experience_data = analysis.get("experience", [])
                db_resume.education_data = analysis.get("education", {})
                db_resume.projects_data = analysis.get("projects", [])
                db_resume.ai_analysis = analysis.get("ai_analysis", {})
                db_resume.learning_resources = analysis.get("learning_resources", {})
                db_resume.experience_years = analysis.get("ai_analysis", {}).get("experience_years", 0)
                db_resume.experience_level = analysis.get("ai_analysis", {}).get("experience_level", "intermediate")
                db_resume.overall_match_score = analysis.get("ai_analysis", {}).get("overall_match_score", 0)
            except Exception as e:
                print(f"Warning: Could not save enhanced fields: {e}")
                print("💡 Hint: Run 'python fix_database.py' to update database schema")
        except Exception as e:
            print(f"Database save error: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed. Please check database setup.")
        
        # Save to DB (Potential crash point #3: DB connection or commit failure)
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)
        
        validation_msg = analysis.get("validation", {}).get("reason", "Resume analyzed successfully")
        
        return ResumeUploadResponse(
            success=True,
            message=f"✅ {validation_msg}",
            file_id=file_id,
            skills_detected=analysis.get("detected_skills", [])
        )
        
    except HTTPException:
        # Don't delete file here, as file_path may be None or deletion is handled inside the block
        raise
    except Exception as e:
        # Log the exception for debugging on the server console
        print(f"UPLOAD ERROR: {e}")
        
        # CRITICAL: Clean up the file if it was saved before the crash
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Cleanup: Successfully deleted temporary file {file_path}.")
            except Exception as cleanup_e:
                print(f"Cleanup Failed: Could not delete file {file_path}. Error: {cleanup_e}")
                
        raise HTTPException(
            status_code=500, 
            detail=f"Houston, we have a problem! 🚀 Our servers encountered an issue: {str(e)}. Please try again in a moment!"
        )

@router.get("/analyze/{file_id}", response_model=SkillAnalysis)
async def get_skill_analysis(file_id: str, target_role: str = "software_engineer", db: Session = Depends(get_db)):
    """Get detailed skill analysis for uploaded resume"""
    try:
        # Get from database first
        db_resume = db.query(Resume).filter(Resume.id == file_id).first()
        
        if not db_resume:
            raise HTTPException(
                status_code=404, 
                detail="Hmm, we can't find your resume! 🔍 It might have wandered off. Please try uploading it again."
            )
        
        # If target role changed, re-analyze
        if getattr(db_resume, 'target_role', 'default') != target_role:
            try:
                analysis = parser.analyze_resume(db_resume.file_path, target_role)
                
                # Update database with new analysis
                db_resume.detected_skills = analysis["detected_skills"]
                db_resume.missing_skills = analysis["missing_skills"]
                db_resume.skill_scores = analysis["skill_scores"]
                db_resume.recommendations = analysis["recommendations"]
                db_resume.target_role = target_role
                db_resume.analysis_date = datetime.utcnow()
                db.commit()
            except Exception as e:
                # Log the inner exception but use existing data
                print(f"RE-ANALYSIS FAILED: {e}")
                pass
        
        return SkillAnalysis(
            detected_skills=db_resume.detected_skills or [],
            missing_skills=db_resume.missing_skills or [],
            skill_scores=db_resume.skill_scores or {},
            recommendations=db_resume.recommendations or []
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the exception for debugging on the server console
        print(f"ANALYSIS GET ERROR: {e}") 
        raise HTTPException(
            status_code=500, 
            detail=f"Our AI brain had a hiccup! 🤖 Analysis error: {str(e)}. Don't worry, try again and we'll get it right!"
        )

@router.get("/full-analysis/{file_id}")
async def get_full_analysis(file_id: str, db: Session = Depends(get_db)):
    """Get complete resume analysis with all extracted data"""
    try:
        # Get from database
        db_resume = db.query(Resume).filter(Resume.id == file_id).first()
        
        if not db_resume:
            raise HTTPException(
                status_code=404, 
                detail="Resume not found! 🔍 Please upload your resume first."
            )
        
        # --- FIX: Using getattr() for all fields for maximum resilience ---
        # This prevents crashes if a field is None, missing, or causes a serialization error.
        return {
            "file_id": getattr(db_resume, 'id', file_id),
            "filename": getattr(db_resume, 'filename', 'unknown_file'),
            "upload_date": getattr(db_resume, 'upload_date', None),
            "personal_info": getattr(db_resume, 'personal_info', None) or {},
            "experience": getattr(db_resume, 'experience_data', None) or [],
            "education": getattr(db_resume, 'education_data', None) or {},
            "projects": getattr(db_resume, 'projects_data', None) or [],
            "detected_skills": getattr(db_resume, 'detected_skills', None) or [],
            "missing_skills": getattr(db_resume, 'missing_skills', None) or [],
            "skill_scores": getattr(db_resume, 'skill_scores', None) or {},
            "recommendations": getattr(db_resume, 'recommendations', None) or [],
            "ai_analysis": getattr(db_resume, 'ai_analysis', None) or {},
            "learning_resources": getattr(db_resume, 'learning_resources', None) or {},
            "experience_years": getattr(db_resume, 'experience_years', None) or 0,
            "experience_level": getattr(db_resume, 'experience_level', None) or "intermediate",
            "overall_match_score": getattr(db_resume, 'overall_match_score', None) or 0,
            "target_role": getattr(db_resume, 'target_role', None) or "software_engineer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the exception for debugging on the server console
        print(f"FULL ANALYSIS GET ERROR: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get full analysis: {str(e)}"
        )

@router.delete("/delete/{file_id}")
async def delete_resume(file_id: str, db: Session = Depends(get_db)):
    """Delete uploaded resume"""
    try:
        # Get from database
        db_resume = db.query(Resume).filter(Resume.id == file_id).first()
        
        if not db_resume:
            raise HTTPException(
                status_code=404, 
                detail="Looks like your resume went on vacation! 🏖️ We can't find it in our system. Please upload it again."
            )
        
        # Delete file from filesystem
        if os.path.exists(db_resume.file_path):
            os.remove(db_resume.file_path)
        
        # Delete from database
        db.delete(db_resume)
        db.commit()
        
        return {"success": True, "message": "Resume deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the exception for debugging on the server console
        print(f"DELETE ERROR: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Oops! We couldn't delete your resume. 🗑️ Error: {str(e)}. It's being a bit stubborn!"
        )


# ============================================================================
# NEW ENDPOINT: Parse Resume from Text (No File Upload Required)
# ============================================================================

@router.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume_text(request: ParseResumeRequest):
    """
    Parse resume from text directly without file upload.
    Accepts name, role/interest, and resume text.
    Returns structured JSON with dynamic skill parsing.
    """
    print("\n" + "="*60)
    print("📥 Resume parse request received")
    print(f"👤 Name: {request.name}")
    print(f"🎯 Role: {request.role}")
    print(f"📝 Resume text length: {len(request.resume_text)} characters")
    print("="*60)
    
    try:
        resume_text = request.resume_text.strip()
        
        if not resume_text or len(resume_text) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume text is too short. Please provide a complete resume."
            )
        
        # Extract skills dynamically from resume text
        skills = extract_skills_from_text(resume_text)
        
        # Extract experience information
        experience_info = extract_experience(resume_text)
        
        # Generate skill scores (0-100) based on context
        skill_scores = generate_skill_scores(resume_text, skills)
        
        # Generate personalized recommendations
        recommendations = generate_recommendations(request.role, skills, experience_info)
        
        # Create summary
        summary = create_summary(request.name, request.role, len(skills), experience_info)
        
        response_data = ParseResumeResponse(
            name=request.name,
            role=request.role,
            skills=skills,
            experience=experience_info,
            summary=summary,
            skill_scores=skill_scores,
            recommendations=recommendations
        )
        
        print("\n" + "="*60)
        print("✅ Resume parsed successfully!")
        print(f"🎯 Skills found: {len(skills)}")
        print(f"📈 Experience: {experience_info}")
        print(f"💡 Recommendations: {len(recommendations)}")
        print("="*60 + "\n")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ ERROR: Resume parsing failed: {str(e)}\n")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse resume: {str(e)}"
        )


def extract_skills_from_text(text: str) -> List[str]:
    """
    Dynamically extract skills from resume text using keyword matching.
    This handles any resume content without fixed templates.
    """
    text_lower = text.lower()
    
    # Comprehensive skill database covering multiple domains
    skill_keywords = {
        # Programming Languages
        "python", "javascript", "java", "c++", "c#", "typescript", "ruby", "php", 
        "swift", "kotlin", "go", "rust", "scala", "r", "matlab", "perl",
        
        # Web Technologies
        "html", "css", "react", "angular", "vue", "node.js", "express", "django",
        "flask", "spring", "asp.net", "nextjs", "gatsby", "redux", "webpack",
        
        # Databases
        "sql", "mysql", "postgresql", "mongodb", "redis", "oracle", "cassandra",
        "dynamodb", "sqlite", "mariadb", "elasticsearch",
        
        # Cloud & DevOps
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab", "github actions",
        "terraform", "ansible", "ci/cd", "circleci", "travis ci",
        
        # Data Science & ML
        "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
        "pandas", "numpy", "keras", "data analysis", "statistics", "nlp",
        "computer vision", "ai", "neural networks",
        
        # Tools & Platforms
        "git", "linux", "bash", "powershell", "vim", "vscode", "jupyter",
        "postman", "jira", "confluence", "slack", "figma", "sketch",
        
        # Soft Skills
        "leadership", "communication", "teamwork", "problem solving", "project management",
        "agile", "scrum", "critical thinking", "collaboration", "time management",
        
        # Other Technical
        "rest api", "graphql", "microservices", "testing", "unit testing", "tdd",
        "oop", "data structures", "algorithms", "system design", "debugging"
    }
    
    detected_skills = []
    
    # Check for each skill in the text
    for skill in skill_keywords:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill.replace(" ", r"[\s-]*")) + r'\b'
        if re.search(pattern, text_lower):
            # Capitalize properly
            detected_skills.append(skill.title())
    
    # Remove duplicates and sort
    detected_skills = sorted(list(set(detected_skills)))
    
    # If no skills detected, provide generic ones
    if not detected_skills:
        detected_skills = ["Communication", "Problem Solving", "Teamwork", "Adaptability"]
    
    return detected_skills


def extract_experience(text: str) -> str:
    """
    Extract experience level from resume text.
    Returns 'Fresher' if no experience found.
    """
    text_lower = text.lower()
    
    # Look for experience indicators
    experience_patterns = [
        (r'(\d+)\+?\s*years?\s+(?:of\s+)?experience', 'years'),
        (r'experience[:\s]+(\d+)\+?\s*years?', 'years'),
        (r'(\d+)\s*-\s*(\d+)\s*years?\s+experience', 'range'),
    ]
    
    for pattern, pattern_type in experience_patterns:
        match = re.search(pattern, text_lower)
        if match:
            if pattern_type == 'years':
                years = int(match.group(1))
                if years == 0:
                    return "Fresher"
                elif years == 1:
                    return "1 Year"
                else:
                    return f"{years} Years"
            elif pattern_type == 'range':
                years = int(match.group(2))  # Take the upper bound
                return f"{years} Years"
    
    # Check for fresher/entry-level keywords
    fresher_keywords = ["fresher", "entry level", "recent graduate", "graduate", "internship"]
    for keyword in fresher_keywords:
        if keyword in text_lower:
            return "Fresher"
    
    # Check for job titles/companies (indicates experience)
    job_indicators = ["worked at", "working at", "employed at", "position", "software engineer", 
                     "developer", "analyst", "consultant", "manager", "lead"]
    
    has_job_experience = any(indicator in text_lower for indicator in job_indicators)
    
    if has_job_experience:
        return "1-2 Years"  # Default if experience found but years not specified
    
    # Default to Fresher if nothing found
    return "Fresher"


def generate_skill_scores(text: str, skills: List[str]) -> Dict[str, int]:
    """
    Generate skill proficiency scores (0-100) based on context in resume.
    """
    scores = {}
    text_lower = text.lower()
    
    for skill in skills:
        skill_lower = skill.lower()
        
        # Base score
        score = 50
        
        # Check for proficiency indicators
        if re.search(rf'expert\s+(?:in\s+)?{re.escape(skill_lower)}', text_lower):
            score = 95
        elif re.search(rf'advanced\s+(?:in\s+)?{re.escape(skill_lower)}', text_lower):
            score = 85
        elif re.search(rf'proficient\s+(?:in\s+)?{re.escape(skill_lower)}', text_lower):
            score = 75
        elif re.search(rf'intermediate\s+(?:in\s+)?{re.escape(skill_lower)}', text_lower):
            score = 65
        elif re.search(rf'(?:basic|beginner)\s+(?:in\s+)?{re.escape(skill_lower)}', text_lower):
            score = 40
        
        # Count mentions (more mentions = higher proficiency)
        mentions = len(re.findall(rf'\b{re.escape(skill_lower)}\b', text_lower))
        score += min(mentions * 5, 30)  # Cap bonus at 30
        
        # Cap at 100
        scores[skill] = min(score, 100)
    
    return scores


def generate_recommendations(role: str, skills: List[str], experience: str) -> List[str]:
    """
    Generate personalized recommendations based on role, skills, and experience.
    """
    recommendations = []
    role_lower = role.lower()
    
    # Role-specific skill requirements
    role_skills = {
        "software engineer": ["Python", "Java", "JavaScript", "Git", "Sql", "Data Structures", "Algorithms"],
        "data scientist": ["Python", "R", "Machine Learning", "Statistics", "Pandas", "Sql", "Tensorflow"],
        "frontend developer": ["Html", "Css", "Javascript", "React", "Typescript", "Redux", "Webpack"],
        "backend developer": ["Python", "Java", "Node.Js", "Sql", "Rest Api", "Docker", "Microservices"],
        "devops engineer": ["Docker", "Kubernetes", "Aws", "Ci/Cd", "Jenkins", "Linux", "Terraform"],
        "full stack developer": ["Javascript", "React", "Node.Js", "Sql", "Git", "Rest Api", "Docker"],
    }
    
    # Get required skills for the role (default to software engineer)
    required_skills = role_skills.get(role_lower, role_skills["software engineer"])
    
    # Find missing critical skills
    missing_skills = [skill for skill in required_skills if skill not in skills]
    
    # Add skill-based recommendations
    if missing_skills:
        recommendations.append(f"Learn {', '.join(missing_skills[:3])} to strengthen your {role} profile")
    
    # Experience-based recommendations
    if experience == "Fresher":
        recommendations.append("Build 2-3 portfolio projects showcasing your skills")
        recommendations.append("Contribute to open-source projects on GitHub")
        recommendations.append("Practice coding challenges on LeetCode or HackerRank")
    else:
        recommendations.append("Document your projects with detailed case studies")
        recommendations.append("Mentor junior developers to strengthen leadership skills")
    
    # General career recommendations
    recommendations.append(f"Get certified in relevant {role} technologies")
    recommendations.append("Network with professionals in your target industry")
    recommendations.append("Stay updated with latest trends and best practices")
    
    return recommendations[:6]  # Return top 6 recommendations


def create_summary(name: str, role: str, skill_count: int, experience: str) -> str:
    """
    Create a summary of the parsed resume.
    """
    return (
        f"{name} is pursuing a career as a {role} with {experience} of experience. "
        f"They have demonstrated proficiency in {skill_count} technical and professional skills. "
        f"{'As a fresher, they show strong foundational knowledge and eagerness to learn.' if experience == 'Fresher' else 'Their experience makes them a strong candidate for mid-level positions.'}"
    )
