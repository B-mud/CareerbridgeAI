from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
from pathlib import Path
import json
import os
import urllib.parse
import urllib.request
from ..models.resume import SkillAnalysis
from ..services.job_recommendation_service import CURATED_JOBS

router = APIRouter()

# Mock data for demonstration
MOCK_SKILLS_DATA = {
    "trending_skills": [
        {"name": "Python", "demand": 95, "growth": 12},
        {"name": "JavaScript", "demand": 92, "growth": 8},
        {"name": "React", "demand": 88, "growth": 15},
        {"name": "AWS", "demand": 85, "growth": 20},
        {"name": "Docker", "demand": 78, "growth": 25}
    ],
    "skill_categories": {
        "programming": ["Python", "JavaScript", "Java", "C++", "TypeScript"],
        "frameworks": ["React", "Node.js", "Django", "Express", "Vue.js"],
        "databases": ["SQL", "MongoDB", "PostgreSQL", "Redis", "MySQL"],
        "cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes"],
        "tools": ["Git", "Jenkins", "CI/CD", "Linux", "Bash"]
    }
}

@router.get("/trending")
async def get_trending_skills():
    """Get trending skills in the market"""
    return {
        "success": True,
        "data": MOCK_SKILLS_DATA["trending_skills"]
    }


@router.get("/trending-by-role")
async def get_trending_skills_by_role(
    role: str = Query(..., description="Target role, e.g. software_engineer or data_scientist"),
    top_n: int = Query(default=10, ge=3, le=20),
):
    """Return role-specific trending skills using role requirements + curated jobs + optional live market signal."""
    normalized_role = role.strip().lower().replace(" ", "_")

    role_file = Path(__file__).resolve().parent.parent / "data" / "role_requirements.json"
    if not role_file.exists():
        raise HTTPException(status_code=500, detail="role_requirements.json not found")

    with open(role_file, "r", encoding="utf-8") as f:
        role_data = json.load(f)

    selected = role_data.get(normalized_role)
    if not selected:
        raise HTTPException(status_code=404, detail=f"Role '{normalized_role}' not found")

    weighted: Dict[str, float] = {}

    def add_weight(skill: str, weight: float):
        key = skill.lower().strip()
        weighted[key] = weighted.get(key, 0.0) + weight

    for bucket, factor in (("core_skills", 1.0), ("preferred_skills", 0.7), ("nice_to_have", 0.4)):
        for skill, metadata in selected.get(bucket, {}).items():
            add_weight(skill, float(metadata.get("weight", 0.5)) * factor)

    # Add demand signal from curated jobs for this role family
    role_terms = set(normalized_role.replace("_", " ").split())
    for job in CURATED_JOBS:
        title_terms = set(job.get("title", "").lower().split())
        if role_terms.intersection(title_terms):
            opening_boost = min(2.5, max(0.5, float(job.get("openings", 1)) / 100.0))
            for skill in job.get("skills_required", []):
                add_weight(skill, 0.35 * opening_boost)

    # Optional live market signal from JSearch (if key provided)
    rapid_key = os.getenv("RAPIDAPI_KEY")
    if rapid_key:
        try:
            query = urllib.parse.quote(normalized_role.replace("_", " "))
            url = f"https://jsearch.p.rapidapi.com/search?query={query}&num_pages=1"
            req = urllib.request.Request(url)
            req.add_header("X-RapidAPI-Key", rapid_key)
            req.add_header("X-RapidAPI-Host", "jsearch.p.rapidapi.com")
            with urllib.request.urlopen(req, timeout=6) as resp:
                payload = json.loads(resp.read().decode("utf-8"))

            for item in payload.get("data", [])[:20]:
                text = " ".join([
                    item.get("job_title", ""),
                    item.get("job_description", ""),
                    item.get("job_highlights", {}).get("Qualifications", "") if isinstance(item.get("job_highlights"), dict) else "",
                ]).lower()
                for skill in list(weighted.keys()):
                    if skill in text:
                        add_weight(skill, 0.6)
        except Exception:
            pass

    ranked = sorted(weighted.items(), key=lambda x: x[1], reverse=True)[:top_n]
    result = [
        {
            "name": skill.replace("_", " ").title(),
            "demand": round(min(100, 45 + score * 18), 1),
            "growth": round(min(40, 6 + score * 5), 1),
            "score": round(score, 3),
        }
        for skill, score in ranked
    ]

    return {
        "success": True,
        "role": normalized_role,
        "data": result,
        "source": "role_requirements + curated_jobs + optional_live_market",
    }

@router.get("/categories")
async def get_skill_categories():
    """Get skills organized by categories"""
    return {
        "success": True,
        "data": MOCK_SKILLS_DATA["skill_categories"]
    }

@router.get("/recommendations/{role}")
async def get_role_recommendations(role: str):
    """Get skill recommendations for specific role"""
    role_skills = {
        "software_engineer": {
            "core_skills": ["Python", "JavaScript", "Git", "SQL"],
            "advanced_skills": ["React", "Node.js", "AWS", "Docker"],
            "learning_path": [
                "Master programming fundamentals",
                "Learn web development frameworks",
                "Understand database concepts",
                "Explore cloud technologies"
            ]
        },
        "data_scientist": {
            "core_skills": ["Python", "SQL", "Statistics", "Machine Learning"],
            "advanced_skills": ["TensorFlow", "PyTorch", "Spark", "Tableau"],
            "learning_path": [
                "Master Python and statistics",
                "Learn machine learning algorithms",
                "Practice with real datasets",
                "Build end-to-end ML projects"
            ]
        },
        "devops_engineer": {
            "core_skills": ["Linux", "Docker", "CI/CD", "AWS"],
            "advanced_skills": ["Kubernetes", "Terraform", "Monitoring", "Security"],
            "learning_path": [
                "Master Linux and scripting",
                "Learn containerization",
                "Understand infrastructure as code",
                "Implement monitoring solutions"
            ]
        }
    }
    
    if role not in role_skills:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return {
        "success": True,
        "role": role,
        "data": role_skills[role]
    }

@router.post("/gap-analysis")
async def analyze_skill_gap(user_skills: List[str], target_role: str):
    """Analyze skill gap for target role"""
    try:
        role_data = await get_role_recommendations(target_role)
        required_skills = role_data["data"]["core_skills"] + role_data["data"]["advanced_skills"]
        
        user_skills_lower = [skill.lower() for skill in user_skills]
        
        missing_skills = []
        matching_skills = []
        
        for skill in required_skills:
            if skill.lower() in user_skills_lower:
                matching_skills.append(skill)
            else:
                missing_skills.append(skill)
        
        skill_match_percentage = (len(matching_skills) / len(required_skills)) * 100
        
        return {
            "success": True,
            "analysis": {
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "skill_match_percentage": round(skill_match_percentage, 2),
                "recommendations": role_data["data"]["learning_path"][:3]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/courses/{skill}")
async def get_skill_courses(skill: str):
    """Get course recommendations for specific skill"""
    # Mock course data
    courses = {
        "python": [
            {"title": "Python for Beginners", "provider": "Coursera", "duration": "6 weeks"},
            {"title": "Advanced Python Programming", "provider": "Udemy", "duration": "8 weeks"}
        ],
        "javascript": [
            {"title": "JavaScript Fundamentals", "provider": "freeCodeCamp", "duration": "4 weeks"},
            {"title": "Modern JavaScript ES6+", "provider": "Udemy", "duration": "6 weeks"}
        ],
        "react": [
            {"title": "React Complete Guide", "provider": "Udemy", "duration": "10 weeks"},
            {"title": "React Official Tutorial", "provider": "React.dev", "duration": "2 weeks"}
        ]
    }
    
    skill_lower = skill.lower()
    if skill_lower not in courses:
        return {
            "success": True,
            "skill": skill,
            "courses": [
                {"title": f"Learn {skill}", "provider": "Generic Platform", "duration": "4-8 weeks"}
            ]
        }
    
    return {
        "success": True,
        "skill": skill,
        "courses": courses[skill_lower]
    }