"""
API endpoints for skill gap analysis and role information
"""
from fastapi import APIRouter, HTTPException, Depends
from ..services.skill_gap_service import get_skill_gap_service
from ..auth import get_current_user
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

skill_gap_service = get_skill_gap_service()


@router.get("/roles")
async def get_available_roles():
    """Get list of all available career roles"""
    try:
        roles = skill_gap_service.get_available_roles()
        return {"roles": roles}
    except Exception as e:
        logger.error(f"❌ Failed to get roles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roles/{role_id}")
async def get_role_details(role_id: str):
    """Get detailed requirements for a specific role"""
    try:
        role_details = skill_gap_service.get_role_details(role_id)
        
        if not role_details:
            raise HTTPException(
                status_code=404,
                detail=f"Role '{role_id}' not found"
            )
        
        return role_details
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get role details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-gap")
async def calculate_skill_gap(
    request: Dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate skill gap for given skills and target role
    
    Body:
    {
        "detected_skills": ["python", "javascript", "react"],
        "target_role": "software_engineer"
    }
    """
    try:
        detected_skills = request.get("detected_skills", [])
        target_role = request.get("target_role", "software_engineer")
        
        if not detected_skills:
            raise HTTPException(
                status_code=400,
                detail="detected_skills is required"
            )
        
        result = skill_gap_service.calculate_skill_gap(
            detected_skills=detected_skills,
            target_role=target_role
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Skill gap calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
