"""
Mock Test API
=============
Endpoints:
  GET  /api/mock-test/skills              – list available test skills
  GET  /api/mock-test/questions           – get MCQs for a skill
  POST /api/mock-test/submit              – score submission, return badge + job unlocks
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
from pydantic import BaseModel
import logging

from ..services.mock_test_service import get_mock_test_service
from ..services.job_recommendation_service import get_job_recommender

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────────────

class SubmitAnswersRequest(BaseModel):
    skill: str
    answers: Dict[str, str]          # { question_id: selected_option }
    resume_id: Optional[str] = None  # optional — to trigger job re-ranking


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/skills")
async def get_available_skills():
    """List all skills that have test questions."""
    svc = get_mock_test_service()
    return {
        "success": True,
        "skills": svc.get_available_skills(),
    }


@router.get("/questions")
async def get_questions(
    skill: str = Query(..., description="Skill to test (e.g. python, sql, react)"),
    difficulty: Optional[str] = Query(default=None, description="easy | medium | hard | all"),
    count: int = Query(default=5, ge=2, le=10),
):
    """
    Return MCQ questions for the requested skill.
    Answers are stripped — only returned on /submit.
    """
    try:
        svc = get_mock_test_service()
        questions = svc.get_questions(skill=skill, difficulty=difficulty, count=count)
        if not questions:
            raise HTTPException(
                status_code=404,
                detail=f"No questions found for skill: {skill}. Try: python, sql, react, javascript, machinelearning, docker, git, dsa, aws, nlp"
            )
        return {
            "success": True,
            "skill": skill,
            "question_count": len(questions),
            "questions": questions,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get questions error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get questions: {str(e)}")


@router.post("/submit")
async def submit_answers(body: SubmitAnswersRequest):
    """
    Score submitted answers using weighted difficulty scoring.

    Incremental Progress Score Formula:
      raw_score = Σ(weight_i × correct_i) / Σ(weight_i) × 100
      weight: easy=1.0, medium=1.5, hard=2.0

    If score ≥ 60%: skill is marked as passed → job recommendations updated.
    """
    try:
        svc = get_mock_test_service()
        result = svc.score_submission(skill=body.skill, answers=body.answers)

        # If passed, trigger job re-ranking for the unlocked skill
        unlocked_jobs = []
        if result["passed"] and body.resume_id:
            try:
                recommender = get_job_recommender()
                # Use current skill list from analysis if available
                from ..database import AnalysisService
                analysis_svc = AnalysisService()
                record = analysis_svc.get_analysis_by_resume_id(body.resume_id)
                current_skills = record.get("possessed_skills", []) if record else []
                unlocked_jobs = recommender.recommend_after_skill_gain(
                    user_skills=current_skills,
                    newly_learned_skill=body.skill,
                    top_n=4,
                )
            except Exception as je:
                logger.warning(f"⚠️ Job unlock fetch failed: {je}")

        return {
            "success": True,
            **result,
            "unlocked_jobs": unlocked_jobs,
            "message": (
                f"🎉 You passed! {result['badge']} — {result['correct']}/{result['total']} correct ({result['score_pct']}%)"
                if result["passed"]
                else f"📖 Score: {result['score_pct']}% — Keep practicing! Need {result['pass_threshold']}% to pass."
            )
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Submit error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to score submission: {str(e)}")
