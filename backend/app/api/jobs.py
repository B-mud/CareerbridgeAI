"""
Jobs API – Content-Based Job Recommendation Engine
===================================================
Endpoints:
  GET  /api/jobs/recommend/{resume_id}   – ranked jobs by TF-IDF cosine similarity
  GET  /api/jobs/search?q=...            – free-text job search
  GET  /api/jobs/trending                – top jobs by openings count
  POST /api/jobs/after-skill            – re-rank after user learns a new skill
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
import logging
import os
import json
import urllib.parse
import urllib.request
import re

from ..services.job_recommendation_service import get_job_recommender, CURATED_JOBS
from ..database import ResumeService, AnalysisService, ActivityLogService
from ..auth import get_optional_user

logger = logging.getLogger(__name__)
router = APIRouter()

resume_service  = ResumeService()
analysis_service = AnalysisService()


# ── Request / Response models ────────────────────────────────────────────────
activity_service = ActivityLogService()

class AfterSkillRequest(BaseModel):
    resume_id: str
    newly_learned_skill: str




class TrackJobEventRequest(BaseModel):
    user_id: str
    job_id: str
    job_title: str
    company: str
    source: str = "job_board"


class SaveJobRequest(BaseModel):
    user_id: str
    job: dict


def _compute_match_score(job_text: str, user_skills: List[str]) -> float:
    """Simple skill overlap score: percentage of user skills found in job text."""
    if not user_skills:
        return 0.0
    text = (job_text or "").lower()
    normalized_skills = [s.strip().lower() for s in user_skills if s and s.strip()]
    if not normalized_skills:
        return 0.0

    matched = 0
    for skill in normalized_skills:
        # whole-word-ish matching for cleaner scoring
        pattern = rf"\b{re.escape(skill)}\b"
        if re.search(pattern, text):
            matched += 1

    return round((matched / max(len(normalized_skills), 1)) * 100, 1)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/recommend/{resume_id}")
async def recommend_jobs(
    resume_id: str,
    top_n: int = Query(default=10, ge=1, le=30),
    current_user: dict = Depends(get_optional_user)
):
    """
    Recommend jobs ranked by TF-IDF cosine similarity between:
      user skill vector  (from resume analysis)
      job skill vectors  (from curated dataset)

    Also uses: set-overlap bonus + experience tier matching.
    """
    try:
        # Fetch analysis record
        analysis_record = analysis_service.get_analysis_by_resume_id(resume_id)
        if not analysis_record:
            # No analysis yet → return trending jobs
            recommender = get_job_recommender()
            return {
                "success": True,
                "resume_id": resume_id,
                "jobs": recommender._fallback_jobs(top_n),
                "algorithm": "fallback (no analysis found)",
                "total": top_n,
            }

        possessed_skills   = analysis_record.get("possessed_skills", analysis_record.get("skills", []))
        experience_level   = analysis_record.get("experience", "intermediate")

        # Extract target_role from metadata sentinel
        metadata = analysis_service.extract_metadata(analysis_record)
        target_role = metadata.get("target_role", "software_engineer")

        recommender = get_job_recommender()
        jobs = recommender.recommend(
            user_skills=possessed_skills,
            target_role=target_role,
            experience_level=experience_level,
            top_n=top_n,
        )

        logger.info(f"✅ Job recommendations generated: {len(jobs)} jobs for resume {resume_id}")
        return {
            "success": True,
            "resume_id": resume_id,
            "skills_used": possessed_skills,
            "target_role": target_role,
            "experience_level": experience_level,
            "jobs": jobs,
            "algorithm": "TF-IDF Cosine Similarity + Set-Overlap Hybrid",
            "total": len(jobs),
        }

    except Exception as e:
        logger.error(f"❌ Job recommendation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to recommend jobs: {str(e)}")


@router.get("/search")
async def search_jobs(
    q: str = Query(..., min_length=2, description="Search query (role, skill, company)"),
    top_n: int = Query(default=10, ge=1, le=30),
):
    """Free-text job search using TF-IDF cosine similarity on title + skills."""
    try:
        recommender = get_job_recommender()
        results = recommender.search(q, top_n=top_n)
        return {
            "success": True,
            "query": q,
            "jobs": results,
            "total": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/live-search")
async def live_search_jobs(
    q: str = Query(..., min_length=2, description="Search query for live jobs"),
    top_n: int = Query(default=10, ge=1, le=20),
):
    """
    Live job search via JSearch when RAPIDAPI_KEY is configured.
    Falls back to internal TF-IDF search when not configured.
    """
    api_key = os.getenv("RAPIDAPI_KEY")
    if not api_key:
        recommender = get_job_recommender()
        jobs = recommender.search(q, top_n=top_n)
        return {
            "success": True,
            "query": q,
            "jobs": jobs,
            "source": "internal_fallback",
            "total": len(jobs),
        }

    try:
        query = urllib.parse.quote(q)
        url = f"https://jsearch.p.rapidapi.com/search?query={query}&num_pages=1"
        req = urllib.request.Request(url)
        req.add_header("X-RapidAPI-Key", api_key)
        req.add_header("X-RapidAPI-Host", "jsearch.p.rapidapi.com")

        with urllib.request.urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))

        jobs = []
        for idx, item in enumerate(payload.get("data", [])[:top_n]):
            jobs.append({
                "id": item.get("job_id", f"live_{idx}"),
                "title": item.get("job_title", "Unknown Role"),
                "company": item.get("employer_name", "Unknown Company"),
                "location": item.get("job_city") or item.get("job_country") or "Not specified",
                "skills_required": [],
                "description": (item.get("job_description") or "")[:240],
                "salary_range": item.get("job_salary", "Not disclosed"),
                "experience_level": "intermediate",
                "job_type": item.get("job_employment_type", "Full-time"),
                "openings": 1,
                "match_score": 0,
                "portals": {
                    "linkedin": item.get("job_apply_link"),
                },
            })

        return {
            "success": True,
            "query": q,
            "jobs": jobs,
            "source": "jsearch_live",
            "total": len(jobs),
        }
    except Exception as e:
        logger.warning(f"⚠️ Live search failed, falling back: {e}")
        recommender = get_job_recommender()
        jobs = recommender.search(q, top_n=top_n)
        return {
            "success": True,
            "query": q,
            "jobs": jobs,
            "source": "internal_fallback_on_error",
            "total": len(jobs),
        }


@router.get("/trending")
async def get_trending_jobs(
    experience_level: Optional[str] = Query(default=None, description="fresher | junior | intermediate | senior"),
    top_n: int = Query(default=12, ge=1, le=30),
):
    """Return jobs sorted by number of openings (demand signal)."""
    try:
        jobs = sorted(CURATED_JOBS, key=lambda j: j.get("openings", 0), reverse=True)
        if experience_level:
            jobs = [j for j in jobs if j.get("experience_level") == experience_level] or jobs
        return {
            "success": True,
            "jobs": [{**j, "match_score": 0} for j in jobs[:top_n]],
            "total": len(jobs[:top_n]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending jobs: {str(e)}")


@router.get("/adzuna/chennai")
async def get_chennai_jobs_from_adzuna(
    resume_id: Optional[str] = Query(default=None, description="Resume ID to compute skill match score"),
    user_skills: Optional[str] = Query(default=None, description="Comma-separated skills to compute match score"),
):
    """
    Fetch Chennai jobs from Adzuna India endpoint and map to UI card format.
    URL base: https://api.adzuna.com/v1/api/jobs/in/search/1
    Params : where=chennai, results_per_page=10
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise HTTPException(status_code=500, detail="Adzuna keys are missing in environment")

    resolved_user_skills: List[str] = []
    if user_skills:
        resolved_user_skills = [s.strip() for s in user_skills.split(",") if s.strip()]

    if not resolved_user_skills and resume_id:
        try:
            analysis_record = analysis_service.get_analysis_by_resume_id(resume_id)
            if analysis_record:
                resolved_user_skills = analysis_record.get("possessed_skills", analysis_record.get("skills", [])) or []
        except Exception as e:
            logger.warning(f"Could not load analysis for resume_id {resume_id}: {e}")

    def _fetch(where_value: str):
        query = urllib.parse.urlencode({
            "app_id": app_id,
            "app_key": app_key,
            "where": where_value,
            "results_per_page": 10,
            "content-type": "application/json",
        })
        url = f"https://api.adzuna.com/v1/api/jobs/in/search/1?{query}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))

    try:
        payload = _fetch("chennai")
        results = payload.get("results", [])

        # If low results, try broader Chennai formatting fallback
        if len(results) < 3:
            payload_alt = _fetch("chennai, tamil nadu")
            results = payload_alt.get("results", []) or results

        mapped_jobs = []
        for idx, item in enumerate(results[:10]):
            company_name = (item.get("company") or {}).get("display_name") or "Unknown Company"
            location_name = (item.get("location") or {}).get("display_name") or "Chennai"
            salary_min = item.get("salary_min")
            salary_range = f"INR {int(salary_min):,}" if isinstance(salary_min, (int, float)) else "Competitive"

            description = item.get("description") or ""
            category_label = (item.get("category") or {}).get("label") or ""
            title = item.get("title") or "Role"
            combined_text = f"{title} {description} {category_label}"
            match_score = _compute_match_score(combined_text, resolved_user_skills)

            mapped_jobs.append({
                "id": item.get("id", f"adzuna_ch_{idx}"),
                "title": title,
                "company": company_name,
                "location": location_name,
                "skills_required": resolved_user_skills[:6],
                "description": description[:260],
                "salary_range": salary_range if salary_range else "Negotiable",
                "experience_level": "intermediate",
                "job_type": item.get("contract_type") or "Full-time",
                "openings": 1,
                "match_score": match_score,
                "portals": {
                    "linkedin": item.get("redirect_url"),
                },
            })

        return {
            "success": True,
            "source": "adzuna_in_chennai",
            "total": len(mapped_jobs),
            "skills_used": resolved_user_skills,
            "jobs": mapped_jobs,
        }
    except Exception as e:
        logger.error(f"Adzuna Chennai fetch failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch Adzuna Chennai jobs: {str(e)}")


@router.post("/after-skill")
async def recommend_after_skill(
    body: AfterSkillRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Re-rank jobs after user earns a new skill (passed mock test or completed course).
    Returns jobs where the newly learned skill is in demand.
    """
    try:
        analysis_record = analysis_service.get_analysis_by_resume_id(body.resume_id)
        possessed_skills = []
        if analysis_record:
            possessed_skills = analysis_record.get("possessed_skills", analysis_record.get("skills", []))

        recommender = get_job_recommender()
        jobs = recommender.recommend_after_skill_gain(
            user_skills=possessed_skills,
            newly_learned_skill=body.newly_learned_skill,
        )

        return {
            "success": True,
            "newly_learned_skill": body.newly_learned_skill,
            "jobs": jobs,
            "message": f"🎉 You've unlocked new job opportunities by learning {body.newly_learned_skill}!",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get post-skill jobs: {str(e)}")


@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    resume_id: Optional[str] = None,
    current_user: dict = Depends(get_optional_user)
):
    """
    Get detailed information for a specific job and generate a learning path
    based on the job's required skills and the user's current skills.
    """
    try:
        recommender = get_job_recommender()
        
        # Find the job in curated jobs
        job = None
        for j in CURATED_JOBS:
            if j.get("id") == job_id:
                job = j
                break
        
        if not job:
            raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
        
        # Get user skills if resume_id provided
        user_skills = []
        missing_skills = []
        if resume_id:
            analysis_record = analysis_service.get_analysis_by_resume_id(resume_id)
            if analysis_record:
                # Extract possessed skills, handling different possible key names
                user_skills = analysis_record.get("possessed_skills") or analysis_record.get("skills") or []
                if isinstance(user_skills, str):
                    user_skills = [user_skills]
                
                # Calculate missing skills = job required skills - user skills
                required_skills = job.get("skills_required", []) or []
                
                # Normalize for comparison (lowercase)
                required = set(s.lower().strip() for s in required_skills if s)
                user_set = set(s.lower().strip() for s in user_skills if s)
                
                # Find missing skills (skill names in lowercase for comparison)
                missing_set = required - user_set
                
                # Map back to original case from required_skills list
                missing_skills = [
                    skill for skill in required_skills
                    if skill.lower().strip() in missing_set
                ]
        else:
            missing_skills = job.get("skills_required", []) or []
        
        # Ensure user_skills is a list
        if not isinstance(user_skills, list):
            user_skills = list(user_skills) if user_skills else []
        
        return {
            "success": True,
            "job": {
                **job,
                "user_skills": user_skills,
                "missing_skills": missing_skills,
                "match_score": _compute_match_score(
                    f"{job.get('title')} {job.get('description')} {' '.join(job.get('skills_required', []))}",
                    user_skills
                ) if user_skills else 0,
            },
            "learning_path": {
                "required_skills": job.get("skills_required", []),
                "missing_skills": missing_skills,
                "priority_skills": missing_skills[:3],  # Top 3 to focus on
                "estimated_weeks": max(4, len(missing_skills) * 2),  # 2 weeks per skill
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job detail: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch job details: {str(e)}")


@router.get("/all-roles")
async def get_all_roles():
    """List all unique roles available in the job dataset."""
    roles = list({j["title"] for j in CURATED_JOBS})
    roles.sort()
    return {"roles": roles}


@router.post("/track-application")
async def track_job_application(body: TrackJobEventRequest):
    """Track when a user clicks apply on a job portal."""
    try:
        logged = activity_service.log_activity(
            user_id=body.user_id,
            action_type="job_viewed",
            details={
                "event": "job_applied",
                "job_id": body.job_id,
                "job_title": body.job_title,
                "company": body.company,
                "source": body.source,
            },
        )
        return {"success": True, "logged": bool(logged)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track application: {str(e)}")


@router.post("/save")
async def save_job(body: SaveJobRequest):
    """Track when a user bookmarks/saves a job."""
    try:
        logged = activity_service.log_activity(
            user_id=body.user_id,
            action_type="job_viewed",
            details={
                "event": "job_saved",
                "job_id": body.job.get("id"),
                "job_title": body.job.get("title"),
                "company": body.job.get("company"),
                "location": body.job.get("location"),
            },
        )
        return {"success": True, "logged": bool(logged)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save job: {str(e)}")
