"""
Supabase service layer for analysis table
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from .supabase_client import get_supabase_client
import logging
import uuid

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service for managing resume analysis in Supabase"""
    
    def __init__(self):
        try:
            self.client = get_supabase_client()
        except:
            self.client = None
        self.table = "analysis"
    
    def is_available(self) -> bool:
        """Check if Supabase client is available"""
        return self.client is not None
    
    def create_analysis(
        self,
        resume_id: str,
        skills: List[str],
        experience: str,
        match_score: int,
        recommendations: List[Dict[str, Any]],
        missing_skills: List[str] = None,
        possessed_skills: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new analysis record with skill gap data"""
        if not self.is_available():
            logger.warning("⚠️ Supabase not available, skipping analysis creation")
            return None
            
        try:
            # Embed metadata as a special sentinel entry so we don't need a schema change
            recs_payload = list(recommendations or [])
            if metadata:
                recs_payload.append({"__metadata__": True, "data": metadata})

            analysis_data = {
                "id": str(uuid.uuid4()),
                "resume_id": resume_id,
                "skills": skills or [],
                "possessed_skills": possessed_skills or skills or [],
                "missing_skills": missing_skills or [],
                "experience": experience,
                "match_score": match_score,
                "recommendations": recs_payload,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table(self.table).insert(analysis_data).execute()
            logger.info(f"✅ Analysis created for resume: {resume_id} (match score: {match_score}%)")
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"❌ Failed to create analysis: {e}")
            return None
    
    def get_analysis_by_resume_id(self, resume_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis by resume ID"""
        if not self.is_available():
            logger.warning(f"⚠️ Supabase not available, cannot get analysis for resume_id={resume_id}")
            return None
            
        try:
            result = self.client.table(self.table).select("*").eq("resume_id", resume_id).order("created_at", desc=True).limit(1).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.warning(f"⚠️ Analysis lookup unavailable (resume_id={resume_id}): {e}")
            return None
    
    def get_analysis_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis by ID"""
        if not self.is_available():
            logger.warning(f"⚠️ Supabase not available, cannot get analysis_id={analysis_id}")
            return None
            
        try:
            result = self.client.table(self.table).select("*").eq("id", analysis_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.warning(f"⚠️ Analysis lookup unavailable (analysis_id={analysis_id}): {e}")
            return None

    def extract_metadata(self, analysis_record: Dict[str, Any]) -> Dict[str, Any]:
        """Extract the embedded metadata from the recommendations payload"""
        if not analysis_record:
            return {}
        recommendations = analysis_record.get("recommendations", [])
        for rec in recommendations:
            if isinstance(rec, dict) and rec.get("__metadata__"):
                return rec.get("data", {})
        return {}

    def get_plain_recommendations(self, analysis_record: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Return recommendations without the metadata sentinel entry"""
        if not analysis_record:
            return []
        return [
            rec for rec in analysis_record.get("recommendations", [])
            if not (isinstance(rec, dict) and rec.get("__metadata__"))
        ]
    
    def update_analysis(
        self,
        analysis_id: str,
        skills: Optional[List[str]] = None,
        match_score: Optional[int] = None,
        recommendations: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        """Update an existing analysis"""
        try:
            update_data = {}
            if skills is not None:
                update_data["skills"] = skills
            if match_score is not None:
                update_data["match_score"] = match_score
            if recommendations is not None:
                update_data["recommendations"] = recommendations
            
            if update_data:
                result = self.client.table(self.table).update(update_data).eq("id", analysis_id).execute()
                logger.info(f"✅ Analysis updated: {analysis_id}")
                return result.data[0] if result.data else None
            return None
        except Exception as e:
            logger.error(f"❌ Failed to update analysis: {e}")
            return None
