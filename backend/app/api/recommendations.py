from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Optional
import json
import os
import asyncio
from datetime import datetime, timedelta
from ..services.web_scraper import WebScraper
from ..services.resume_parser import ResumeParser
from ..services.gemini_analyzer import gemini_analyzer
from ..database import ResumeService, AnalysisService

router = APIRouter()

# Initialize services
web_scraper = WebScraper()
resume_parser = ResumeParser()
resume_service = ResumeService()
analysis_service = AnalysisService()

# Simple in-memory cache for recommendations (TTL: 30 minutes)
_recommendations_cache: Dict[str, Dict] = {}
_cache_timestamps: Dict[str, datetime] = {}

def _get_cached(key: str) -> Optional[Dict]:
    """Get cached data if not expired"""
    if key in _recommendations_cache:
        if key in _cache_timestamps:
            age = datetime.now() - _cache_timestamps[key]
            if age > timedelta(minutes=30):
                del _recommendations_cache[key]
                del _cache_timestamps[key]
                return None
        return _recommendations_cache[key]
    return None

def _set_cache(key: str, value: Dict):
    """Cache a value with timestamp"""
    _recommendations_cache[key] = value
    _cache_timestamps[key] = datetime.now()


# ===== FALLBACK DATA =====
FALLBACK_COURSES = [
    {
        "title": "Career Essentials",
        "platform": "Google Career Certificates",
        "duration": "3-6 months",
        "rating": 4.7,
        "link": "https://grow.google/certificates/",
        "cost_efficiency": "Low cost / Aid available"
    },
    {
        "title": "Free Programming for Beginners",
        "platform": "freeCodeCamp",
        "duration": "Self-paced",
        "rating": 4.8,
        "link": "https://www.freecodecamp.org/",
        "cost_efficiency": "FREE"
    },
    {
        "title": "Verified Courses",
        "platform": "edX",
        "duration": "6-12 weeks",
        "rating": 4.8,
        "link": "https://www.edx.org/",
        "cost_efficiency": "Audit FREE"
    },
    {
        "title": "Curated Courses",
        "platform": "Class Central",
        "duration": "Varies",
        "rating": 4.6,
        "link": "https://www.classcentral.com/",
        "cost_efficiency": "Mostly FREE"
    },
    {
        "title": "Core Fundamentals", 
        "platform": "Khan Academy",
        "duration": "Self-paced",
        "rating": 4.8,
        "link": "https://www.khanacademy.org/",
        "cost_efficiency": "FREE"
    },
    {
        "title": "Professional Skills",
        "platform": "Alison",
        "duration": "2-8 weeks",
        "rating": 4.5,
        "link": "https://alison.com/",
        "cost_efficiency": "FREE / Certificate optional"
    }
]

FALLBACK_LEETCODE = [
    {
        "title": "Most Common Interview Questions",
        "difficulty": "Easy",
        "link": "https://leetcode.com/problemset/?difficulty=Easy",
        "platform": "LeetCode"
    },
    {
        "title": "Medium Level Challenges",
        "difficulty": "Medium",
        "link": "https://leetcode.com/problemset/?difficulty=Medium",
        "platform": "LeetCode"
    },
    {
        "title": "30 Days Coding Challenge",
        "difficulty": "Easy",
        "link": "https://leetcode.com/problem-list/30-days/",
        "platform": "LeetCode"
    },
    {
        "title": "Top Interview Questions",
        "difficulty": "Medium",
        "link": "https://leetcode.com/problem-list/top-interview-questions/",
        "platform": "LeetCode"
    },
    {
        "title": "Data Structures Review",
        "difficulty": "Easy",
        "link": "https://leetcode.com/explore/learn/",
        "platform": "LeetCode"
    },
    {
        "title": "HackerRank Challenges",
        "difficulty": "Medium",
        "link": "https://www.hackerrank.com/challenges",
        "platform": "HackerRank"
    }
]

FALLBACK_PERSONALIZED = {
    "learning_path": [
        {
            "phase": "Phase 1: Foundations",
            "duration": "2-3 months",
            "skills_to_learn": ["Programming Fundamentals", "Problem Solving"],
            "milestones": ["Complete fundamentals course", "Build first project"]
        },
        {
            "phase": "Phase 2: Core Skills",
            "duration": "3-4 months",
            "skills_to_learn": ["Core Technologies", "Best Practices"],
            "milestones": ["Master core concepts", "Build intermediate projects"],
            "resource": "https://www.coursera.org/specializations/software-engineering-fundamentals"
        },
        {
            "phase": "Phase 3: Advanced Topics",
            "duration": "2-3 months",
            "skills_to_learn": ["Advanced Concepts", "System Design"],
            "milestones": ["Build advanced projects", "Prepare for interviews"],
            "resource": "https://www.udemy.com/course/complete-software-engineering-course-build-develop-better-software/"
        }
    ],
    "priority_skills": [
        {
            "skill": "Programming Fundamentals",
            "priority": "critical",
            "reason": "Essential foundation for all developer roles",
            "estimated_time": "4-6 weeks"
        },
        {
            "skill": "Problem Solving",
            "priority": "high",
            "reason": "Key skill for technical interviews",
            "estimated_time": "3-4 weeks"
        }
    ],
    "career_advice": [
        "Start with fundamentals and don't rush",
        "Build projects while learning - apply knowledge immediately",
        "Contribute to open source projects",
        "Network with professionals in your target role"
    ]
}


@router.get("/courses/{file_id}")
async def get_course_recommendations(
    file_id: str,
    timeout: int = Query(default=4, ge=1, le=10, description="Max seconds to wait for Gemini")
):
    """Get fast course recommendations with smart fallback"""
    try:
        # Check cache first
        cache_key = f"courses_{file_id}"
        cached = _get_cached(cache_key)
        if cached:
            print(f"✅ Cache hit for {cache_key}")
            return cached
        
        # Try to get analysis quickly
        try:
            analysis = analysis_service.get_analysis_by_resume_id(file_id)
            if not analysis:
                print(f"⚠️ No analysis for {file_id}, returning fallback")
                _set_cache(cache_key, FALLBACK_COURSES)
                return FALLBACK_COURSES
        except Exception as e:
            print(f"⚠️ Analysis fetch failed: {e}, returning fallback")
            _set_cache(cache_key, FALLBACK_COURSES)
            return FALLBACK_COURSES
        
        # Extract skills quickly
        missing_skills = analysis.get('missing_skills', analysis.get('missing_skills_for_role', []))[:6]
        target_role = analysis.get('target_role', 'software_engineer')
        
        if not missing_skills:
            print("⚠️ No missing skills, returning standard courses")
            _set_cache(cache_key, FALLBACK_COURSES)
            return FALLBACK_COURSES
        
        # Try Gemini with timeout
        try:
            def get_gemini_courses():
                try:
                    result = gemini_analyzer.generate_learning_recommendations(
                        possessed_skills=analysis.get('detected_skills', [])[:5],
                        missing_skills=missing_skills[:4],
                        target_role=target_role,
                        experience_level=analysis.get('experience_level', 'intermediate')
                    )
                    courses = result.get('recommended_courses', [])
                    if isinstance(courses, list) and len(courses) > 0:
                        return courses
                except Exception as e:
                    print(f"⏱️ Gemini course error: {e}")
                return None
            
            # Wait for Gemini with timeout
            courses = await asyncio.wait_for(
                asyncio.to_thread(get_gemini_courses),
                timeout=float(timeout)
            )
            
            if courses:
                print(f"✅ Got {len(courses)} courses from Gemini")
                _set_cache(cache_key, courses)
                return courses
        except asyncio.TimeoutError:
            print(f"⏱️ Gemini course timeout after {timeout}s, using fallback")
        except Exception as e:
            print(f"❌ Gemini course error: {e}")
        
        # Return fallback if Gemini fails/times out
        _set_cache(cache_key, FALLBACK_COURSES)
        return FALLBACK_COURSES
        
    except Exception as e:
        print(f"❌ Course API error: {e}")
        return FALLBACK_COURSES


@router.get("/leetcode/{file_id}")
async def get_leetcode_problems(
    file_id: str,
    timeout: int = Query(default=3, ge=1, le=10)
):
    """Get fast LeetCode problem recommendations"""
    try:
        # Check cache first
        cache_key = f"leetcode_{file_id}"
        cached = _get_cached(cache_key)
        if cached:
            print(f"✅ Cache hit for {cache_key}")
            return cached
        
        # Return fallback quickly (LeetCode doesn't need ML)
        _set_cache(cache_key, FALLBACK_LEETCODE)
        return FALLBACK_LEETCODE
        
    except Exception as e:
        print(f"❌ LeetCode API error: {e}")
        return FALLBACK_LEETCODE


@router.get("/personalized/{file_id}")
async def get_personalized_recommendations(
    file_id: str,
    timeout: int = Query(default=10, ge=1, le=20, description="Max seconds to wait for Gemini")
):
    """Get Gemini-powered personalized learning path with fast fallback"""
    try:
        # Check cache first
        cache_key = f"personalized_{file_id}"
        cached = _get_cached(cache_key)
        if cached:
            print(f"✅ Cache hit for {cache_key}")
            return cached
        
        # Try to get analysis
        try:
            analysis = analysis_service.get_analysis_by_resume_id(file_id)
            if not analysis:
                print(f"⚠️ No analysis for {file_id}, returning fallback")
                _set_cache(cache_key, FALLBACK_PERSONALIZED)
                return FALLBACK_PERSONALIZED
        except Exception as e:
            print(f"⚠️ Analysis fetch failed: {e}")
            _set_cache(cache_key, FALLBACK_PERSONALIZED)
            return FALLBACK_PERSONALIZED
        
        # Extract data
        possessed_skills = analysis.get('detected_skills', [])[:8]
        missing_skills = analysis.get('missing_skills', analysis.get('missing_skills_for_role', []))[:6]
        target_role = analysis.get('target_role', 'software_engineer')
        experience_level = analysis.get('experience_level', 'intermediate')
        
        # Try Gemini with timeout
        try:
            def get_gemini_path():
                try:
                    result = gemini_analyzer.generate_learning_recommendations(
                        possessed_skills=possessed_skills,
                        missing_skills=missing_skills,
                        target_role=target_role,
                        experience_level=experience_level
                    )
                    return {
                        "learning_path": result.get("learning_path", []),
                        "priority_skills": result.get("priority_skills", []),
                        "career_advice": result.get("career_advice", [])
                    }
                except Exception as e:
                    print(f"⏱️ Gemini personalized error: {e}")
                return None
            
            # Wait for Gemini with timeout
            result = await asyncio.wait_for(
                asyncio.to_thread(get_gemini_path),
                timeout=float(timeout)
            )
            
            if result:
                print(f"✅ Got personalized path from Gemini")
                _set_cache(cache_key, result)
                return result
        except asyncio.TimeoutError:
            print(f"⏱️ Gemini personalized timeout after {timeout}s, using fallback")
        except Exception as e:
            print(f"❌ Gemini personalized error: {e}")
        
        # Return fallback
        _set_cache(cache_key, FALLBACK_PERSONALIZED)
        return FALLBACK_PERSONALIZED
        
    except Exception as e:
        print(f"❌ Personalized recommendations error: {e}")
        return FALLBACK_PERSONALIZED


@router.post("/skills/gap-analysis")
async def analyze_skill_gaps(request: Dict):
    """Analyze skill gaps for given skills and role"""
    try:
        detected_skills = request.get('detected_skills', [])
        target_role = request.get('target_role', 'software_engineer')
        
        if resume_parser.use_ai:
            skill_scores = {skill: 1 for skill in detected_skills}
            gap_analysis = resume_parser.ai_analyzer.analyze_skill_gaps(skill_scores, target_role)
            return gap_analysis
        else:
            # Simple fallback analysis
            role_requirements = {
                'software_engineer': ['python', 'javascript', 'git', 'sql', 'react'],
                'data_scientist': ['python', 'sql', 'machine learning', 'pandas', 'statistics'],
                'frontend_developer': ['javascript', 'html', 'css', 'react', 'git']
            }
            
            required = role_requirements.get(target_role, role_requirements['software_engineer'])
            detected_lower = [skill.lower() for skill in detected_skills]
            missing = [skill for skill in required if skill.lower() not in detected_lower]
            
            return {
                "missing_skills": missing,
                "overall_match_score": max(0, 100 - len(missing) * 20),
                "recommendations": [f"Learn {skill}" for skill in missing[:3]]
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")


@router.get("/trending-skills")
async def get_trending_skills():
    """Get trending skills in the market"""
    try:
        trending_skills = [
            {"skill": "Python", "demand": 95, "growth": 15, "category": "Programming"},
            {"skill": "JavaScript", "demand": 92, "growth": 12, "category": "Programming"},
            {"skill": "React", "demand": 90, "growth": 20, "category": "Frontend"},
            {"skill": "Machine Learning", "demand": 90, "growth": 35, "category": "AI/ML"},
            {"skill": "AWS", "demand": 93, "growth": 22, "category": "Cloud"},
            {"skill": "Docker", "demand": 88, "growth": 20, "category": "DevOps"},
            {"skill": "TypeScript", "demand": 88, "growth": 25, "category": "Programming"},
            {"skill": "Kubernetes", "demand": 82, "growth": 25, "category": "DevOps"},
            {"skill": "Node.js", "demand": 82, "growth": 18, "category": "Backend"},
            {"skill": "TensorFlow", "demand": 80, "growth": 25, "category": "AI/ML"}
        ]
        
        return {
            "trending_skills": trending_skills,
            "last_updated": "2024-01-15"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending skills: {str(e)}")


@router.get("/courses/for-skill/{skill}")
async def get_courses_for_skill(skill: str, level: str = Query("intermediate")):
    """Get course recommendations for a specific skill"""
    try:
        from ..services.course_service import CourseRecommendationService
        
        courses = CourseRecommendationService.get_courses_for_topic(skill, level, limit=5)
        return {
            "skill": skill,
            "level": level,
            "courses": courses
        }
    except Exception as e:
        print(f"❌ Course recommendation error: {e}")
        return {
            "skill": skill,
            "level": level,
            "courses": [
                {
                    "title": f"Learn {skill}",
                    "url": f"https://www.udemy.com/courses/search/?q={skill.replace(' ', '+')}",
                    "platform": "Udemy",
                    "type": "course"
                }
            ]
        }


@router.get("/resources/for-topic/{topic}")
async def get_resources_for_topic(topic: str, role: str = Query(default="")):
    """Get comprehensive learning resources for a topic"""
    try:
        from ..services.course_service import CourseRecommendationService
        
        resources = CourseRecommendationService.get_learning_resources(topic, role)
        return {
            "topic": topic,
            "role": role or "General",
            "resources": resources
        }
    except Exception as e:
        print(f"❌ Learning resources error: {e}")
        return {
            "topic": topic,
            "role": role or "General",
            "resources": {
                "courses": [
                    {
                        "title": f"Learn {topic}",
                        "url": f"https://www.udemy.com/courses/search/?q={topic.replace(' ', '+')}",
                        "platform": "Udemy",
                        "type": "course"
                    }
                ]
            }
        }


