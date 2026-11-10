"""
Career Bridge Skill Gap Analysis Engine
Calculates real skill gaps and match scores without hardcoded values
"""
import json
import os
from typing import Dict, List, Tuple
from pathlib import Path


class SkillGapService:
    """Service for calculating skill gaps and match scores"""
    
    def __init__(self):
        self.role_requirements = self._load_role_requirements()
        
    def _load_role_requirements(self) -> Dict:
        """Load role requirements from JSON file"""
        try:
            data_path = Path(__file__).parent.parent / "data" / "role_requirements.json"
            with open(data_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print("⚠️ Warning: role_requirements.json not found, using default requirements")
            return self._get_default_requirements()
    
    def _get_default_requirements(self) -> Dict:
        """Fallback requirements if JSON file not found"""
        return {
            "software_engineer": {
                "title": "Software Engineer",
                "core_skills": {
                    "python": {"level": "intermediate", "weight": 0.9, "priority": "critical"},
                    "javascript": {"level": "intermediate", "weight": 0.9, "priority": "critical"},
                    "git": {"level": "intermediate", "weight": 0.85, "priority": "critical"}
                },
                "preferred_skills": {
                    "react": {"level": "intermediate", "weight": 0.75, "priority": "high"},
                    "docker": {"level": "basic", "weight": 0.65, "priority": "medium"}
                },
                "nice_to_have": {
                    "kubernetes": {"level": "basic", "weight": 0.4, "priority": "low"}
                }
            }
        }
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill names for matching"""
        skill = skill.lower().strip()
        
        # Skill aliases mapping
        aliases = {
            "js": "javascript",
            "ts": "typescript",
            "nodejs": "node.js",
            "reactjs": "react",
            "vuejs": "vue.js",
            "k8s": "kubernetes",
            "ml": "machine learning",
            "dl": "deep learning",
            "tf": "tensorflow",
            "py": "python",
            "postgresql": "sql",
            "mysql": "sql",
            "postgres": "sql",
            "db": "database",
            "api": "rest api",
            "restful": "rest api",
            "ci": "ci/cd",
            "cd": "ci/cd",
            "bash scripting": "bash",
            "shell": "bash"
        }
        
        return aliases.get(skill, skill)
    
    def calculate_skill_gap(
        self, 
        detected_skills: List[str], 
        target_role: str = "software_engineer",
        skill_scores: Dict[str, int] = None
    ) -> Dict:
        """
        Calculate comprehensive skill gap analysis
        
        Args:
            detected_skills: List of skills found in resume
            target_role: Target role for comparison
            skill_scores: Optional dict of skill -> proficiency score (0-100)
        
        Returns:
            Dict with match_score, missing_skills, possessed_skills, and recommendations
        """
        
        # Normalize target role
        target_role = target_role.lower().replace(" ", "_")
        if target_role not in self.role_requirements:
            target_role = "software_engineer"
        
        role_data = self.role_requirements[target_role]
        
        # Normalize detected skills
        normalized_detected = {self.normalize_skill(skill) for skill in detected_skills}
        
        # Initialize results
        possessed_skills = []
        missing_skills = []
        total_weight = 0
        achieved_weight = 0
        
        # Analyze each skill category
        for category in ["core_skills", "preferred_skills", "nice_to_have"]:
            if category not in role_data:
                continue
                
            required_skills = role_data[category]
            
            for skill_name, skill_info in required_skills.items():
                skill_normalized = self.normalize_skill(skill_name)
                weight = skill_info["weight"]
                total_weight += weight
                
                if skill_normalized in normalized_detected:
                    # Skill is possessed
                    possessed_skills.append({
                        "name": skill_name,
                        "category": category,
                        "level": skill_info["level"],
                        "weight": weight,
                        "priority": skill_info["priority"]
                    })
                    achieved_weight += weight
                else:
                    # Skill is missing
                    missing_skills.append({
                        "name": skill_name,
                        "category": category,
                        "level": skill_info["level"],
                        "weight": weight,
                        "priority": skill_info["priority"]
                    })
        
        # Calculate match score (0-100)
        match_score = int((achieved_weight / total_weight * 100) if total_weight > 0 else 0)
        match_score = max(0, min(100, match_score))  # Clamp to 0-100
        
        # Sort missing skills by priority
        missing_skills.sort(key=lambda x: (
            {"critical": 0, "high": 1, "medium": 2, "low": 3}[x["priority"]],
            -x["weight"]
        ))
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            missing_skills, 
            possessed_skills, 
            match_score,
            role_data
        )
        
        return {
            "target_role": role_data["title"],
            "match_score": match_score,
            "possessed_skills": possessed_skills,
            "missing_skills": missing_skills[:10],  # Top 10 most important
            "total_required_skills": len(possessed_skills) + len(missing_skills),
            "skills_mastered": len(possessed_skills),
            "recommendations": recommendations,
            "salary_range": role_data.get("salary_range", "N/A"),
            "job_growth": role_data.get("job_growth", "N/A")
        }
    
    def _generate_recommendations(
        self, 
        missing_skills: List[Dict], 
        possessed_skills: List[Dict],
        match_score: int,
        role_data: Dict
    ) -> List[Dict]:
        """Generate personalized recommendations based on skill gap"""
        
        recommendations = []
        
        # Recommendation 1: Overall assessment
        if match_score >= 80:
            recommendations.append({
                "type": "assessment",
                "priority": "high",
                "message": f"Excellent! You're {match_score}% ready for this role. Focus on the remaining skills to become an expert."
            })
        elif match_score >= 60:
            recommendations.append({
                "type": "assessment",
                "priority": "medium",
                "message": f"Good progress! You're {match_score}% ready. Focus on core skills to improve your match."
            })
        else:
            recommendations.append({
                "type": "assessment",
                "priority": "high",
                "message": f"You're {match_score}% ready. Start with critical skills to build a strong foundation."
            })
        
        # Recommendation 2: Priority skills to learn
        critical_missing = [s for s in missing_skills if s["priority"] == "critical"]
        if critical_missing:
            skills_list = ", ".join([s["name"] for s in critical_missing[:3]])
            recommendations.append({
                "type": "learn",
                "priority": "critical",
                "message": f"🎯 Critical Skills Missing: {skills_list}. These are essential for the role."
            })
        
        # Recommendation 3: Preferred skills
        high_priority_missing = [s for s in missing_skills if s["priority"] == "high"]
        if high_priority_missing:
            skills_list = ", ".join([s["name"] for s in high_priority_missing[:3]])
            recommendations.append({
                "type": "learn",
                "priority": "high",
                "message": f"📚 High Priority: Learn {skills_list} to significantly boost your profile."
            })
        
        # Recommendation 4: Strengths
        if len(possessed_skills) > 0:
            strong_skills = [s["name"] for s in possessed_skills[:3]]
            recommendations.append({
                "type": "strength",
                "priority": "medium",
                "message": f"💪 Your Strengths: {', '.join(strong_skills)}. Build on these!"
            })
        
        # Recommendation 5: Next steps
        if match_score < 50:
            recommendations.append({
                "type": "action",
                "priority": "high",
                "message": "Start with online courses and hands-on projects to build foundational skills."
            })
        elif match_score < 80:
            recommendations.append({
                "type": "action",
                "priority": "medium",
                "message": "Work on real-world projects and consider certifications to strengthen your profile."
            })
        else:
            recommendations.append({
                "type": "action",
                "priority": "low",
                "message": "Apply for positions and contribute to open-source projects to gain practical experience."
            })
        
        return recommendations
    
    def get_available_roles(self) -> List[Dict]:
        """Get list of all available roles"""
        return [
            {
                "id": role_id,
                "title": data["title"],
                "salary_range": data.get("salary_range", "N/A"),
                "job_growth": data.get("job_growth", "N/A")
            }
            for role_id, data in self.role_requirements.items()
        ]
    
    def get_role_details(self, role_id: str) -> Dict:
        """Get detailed requirements for a specific role"""
        role_id = role_id.lower().replace(" ", "_")
        if role_id not in self.role_requirements:
            return None
        
        role_data = self.role_requirements[role_id]
        
        # Flatten all skills
        all_skills = []
        for category in ["core_skills", "preferred_skills", "nice_to_have"]:
            if category in role_data:
                for skill_name, skill_info in role_data[category].items():
                    all_skills.append({
                        "name": skill_name,
                        "category": category,
                        "level": skill_info["level"],
                        "priority": skill_info["priority"]
                    })
        
        return {
            "title": role_data["title"],
            "skills": all_skills,
            "salary_range": role_data.get("salary_range", "N/A"),
            "job_growth": role_data.get("job_growth", "N/A")
        }


# Singleton instance
_skill_gap_service = None

def get_skill_gap_service() -> SkillGapService:
    """Get singleton instance of SkillGapService"""
    global _skill_gap_service
    if _skill_gap_service is None:
        _skill_gap_service = SkillGapService()
    return _skill_gap_service
