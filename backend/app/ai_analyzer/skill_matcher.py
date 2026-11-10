import json
import os
from typing import List, Dict, Tuple
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class SkillMatcher:
    def __init__(self):
        self.role_requirements = self._load_role_requirements()
        self.skill_weights = self._load_skill_weights()

    def _load_role_requirements(self) -> Dict:
        """Load detailed role requirements with skill levels"""
        return {
            "software_engineer": {
                "core_skills": {
                    "python": {"level": "intermediate", "weight": 0.9},
                    "javascript": {"level": "intermediate", "weight": 0.9},
                    "git": {"level": "intermediate", "weight": 0.8},
                    "sql": {"level": "basic", "weight": 0.7},
                    "react": {"level": "intermediate", "weight": 0.8}
                },
                "preferred_skills": {
                    "typescript": {"level": "basic", "weight": 0.6},
                    "node.js": {"level": "intermediate", "weight": 0.7},
                    "docker": {"level": "basic", "weight": 0.5},
                    "aws": {"level": "basic", "weight": 0.6}
                },
                "nice_to_have": {
                    "kubernetes": {"level": "basic", "weight": 0.3},
                    "machine learning": {"level": "basic", "weight": 0.4}
                }
            },
            "data_scientist": {
                "core_skills": {
                    "python": {"level": "advanced", "weight": 0.95},
                    "sql": {"level": "intermediate", "weight": 0.9},
                    "machine learning": {"level": "advanced", "weight": 0.95},
                    "pandas": {"level": "intermediate", "weight": 0.8},
                    "numpy": {"level": "intermediate", "weight": 0.8}
                },
                "preferred_skills": {
                    "tensorflow": {"level": "intermediate", "weight": 0.7},
                    "pytorch": {"level": "intermediate", "weight": 0.7},
                    "scikit-learn": {"level": "intermediate", "weight": 0.8},
                    "jupyter": {"level": "basic", "weight": 0.6}
                },
                "nice_to_have": {
                    "spark": {"level": "basic", "weight": 0.4},
                    "hadoop": {"level": "basic", "weight": 0.3},
                    "tableau": {"level": "basic", "weight": 0.5}
                }
            },
            "devops_engineer": {
                "core_skills": {
                    "docker": {"level": "advanced", "weight": 0.95},
                    "kubernetes": {"level": "intermediate", "weight": 0.9},
                    "aws": {"level": "intermediate", "weight": 0.9},
                    "linux": {"level": "advanced", "weight": 0.9},
                    "ci/cd": {"level": "intermediate", "weight": 0.8}
                },
                "preferred_skills": {
                    "terraform": {"level": "intermediate", "weight": 0.8},
                    "ansible": {"level": "basic", "weight": 0.6},
                    "jenkins": {"level": "intermediate", "weight": 0.7},
                    "python": {"level": "basic", "weight": 0.6}
                },
                "nice_to_have": {
                    "prometheus": {"level": "basic", "weight": 0.4},
                    "grafana": {"level": "basic", "weight": 0.4},
                    "helm": {"level": "basic", "weight": 0.3}
                }
            },
            "frontend_developer": {
                "core_skills": {
                    "javascript": {"level": "advanced", "weight": 0.95},
                    "react": {"level": "advanced", "weight": 0.9},
                    "html": {"level": "advanced", "weight": 0.8},
                    "css": {"level": "advanced", "weight": 0.8},
                    "typescript": {"level": "intermediate", "weight": 0.8}
                },
                "preferred_skills": {
                    "next.js": {"level": "intermediate", "weight": 0.7},
                    "vue.js": {"level": "basic", "weight": 0.6},
                    "angular": {"level": "basic", "weight": 0.6},
                    "sass": {"level": "basic", "weight": 0.5}
                },
                "nice_to_have": {
                    "webpack": {"level": "basic", "weight": 0.4},
                    "graphql": {"level": "basic", "weight": 0.4},
                    "testing": {"level": "basic", "weight": 0.5}
                }
            }
        }

    def _load_skill_weights(self) -> Dict:
        """Load market demand weights for skills"""
        return {
            "python": 0.95,
            "javascript": 0.92,
            "react": 0.88,
            "aws": 0.85,
            "docker": 0.82,
            "kubernetes": 0.78,
            "typescript": 0.75,
            "node.js": 0.72,
            "sql": 0.90,
            "git": 0.85,
            "machine learning": 0.80,
            "tensorflow": 0.70,
            "pytorch": 0.68,
            "java": 0.85,
            "c++": 0.70,
            "go": 0.65,
            "rust": 0.60
        }

    def analyze_skill_gap(self, detected_skills: List[str], skill_scores: Dict[str, int], 
                         target_role: str = "software_engineer") -> Dict:
        """Analyze skill gaps with AI-powered matching"""
        
        if target_role not in self.role_requirements:
            target_role = "software_engineer"
        
        role_reqs = self.role_requirements[target_role]
        detected_lower = [skill.lower() for skill in detected_skills]
        
        # Analyze each skill category
        analysis = {
            "core_skills": self._analyze_skill_category(
                role_reqs["core_skills"], detected_lower, skill_scores
            ),
            "preferred_skills": self._analyze_skill_category(
                role_reqs["preferred_skills"], detected_lower, skill_scores
            ),
            "nice_to_have": self._analyze_skill_category(
                role_reqs["nice_to_have"], detected_lower, skill_scores
            )
        }
        
        # Calculate overall match score
        overall_score = self._calculate_overall_match(analysis, role_reqs)
        
        # Generate missing skills with priorities
        missing_skills = self._get_prioritized_missing_skills(analysis, role_reqs)
        
        # Generate intelligent recommendations
        recommendations = self._generate_ai_recommendations(
            analysis, missing_skills, skill_scores, target_role
        )
        
        return {
            "target_role": target_role,
            "overall_match_score": overall_score,
            "skill_analysis": analysis,
            "missing_skills": missing_skills,
            "recommendations": recommendations,
            "market_alignment": self._calculate_market_alignment(detected_skills)
        }

    def _analyze_skill_category(self, required_skills: Dict, detected_skills: List[str], 
                               skill_scores: Dict[str, int]) -> Dict:
        """Analyze a specific category of skills"""
        matched = []
        missing = []
        
        for skill, requirements in required_skills.items():
            skill_lower = skill.lower()
            
            if skill_lower in detected_skills:
                user_score = skill_scores.get(skill, 50)
                required_level = requirements["level"]
                level_threshold = {"basic": 40, "intermediate": 60, "advanced": 80}
                
                matched.append({
                    "skill": skill,
                    "user_score": user_score,
                    "required_level": required_level,
                    "meets_requirement": user_score >= level_threshold[required_level],
                    "weight": requirements["weight"]
                })
            else:
                missing.append({
                    "skill": skill,
                    "required_level": requirements["level"],
                    "weight": requirements["weight"],
                    "priority": "high" if requirements["weight"] > 0.8 else "medium"
                })
        
        return {"matched": matched, "missing": missing}

    def _calculate_overall_match(self, analysis: Dict, role_reqs: Dict) -> float:
        """Calculate overall role match percentage"""
        total_weight = 0
        achieved_weight = 0
        
        for category, category_reqs in role_reqs.items():
            category_analysis = analysis[category]
            
            for matched_skill in category_analysis["matched"]:
                weight = matched_skill["weight"]
                total_weight += weight
                
                if matched_skill["meets_requirement"]:
                    achieved_weight += weight
                else:
                    # Partial credit for having the skill but not at required level
                    achieved_weight += weight * 0.5
            
            # Add weight for missing skills
            for missing_skill in category_analysis["missing"]:
                total_weight += missing_skill["weight"]
        
        return round((achieved_weight / total_weight) * 100, 1) if total_weight > 0 else 0

    def _get_prioritized_missing_skills(self, analysis: Dict, role_reqs: Dict) -> List[Dict]:
        """Get missing skills prioritized by importance"""
        all_missing = []
        
        for category, category_analysis in analysis.items():
            for missing_skill in category_analysis["missing"]:
                missing_skill["category"] = category
                all_missing.append(missing_skill)
        
        # Sort by weight (importance) descending
        return sorted(all_missing, key=lambda x: x["weight"], reverse=True)

    def _generate_ai_recommendations(self, analysis: Dict, missing_skills: List[Dict], 
                                   skill_scores: Dict[str, int], target_role: str) -> List[Dict]:
        """Generate intelligent learning recommendations"""
        recommendations = []
        
        # Priority 1: Critical missing core skills
        core_missing = [s for s in missing_skills if s["category"] == "core_skills"][:3]
        for skill_info in core_missing:
            skill = skill_info["skill"]
            level = skill_info["required_level"]
            
            rec = {
                "type": "critical_skill",
                "skill": skill,
                "priority": "high",
                "action": f"Learn {skill} ({level} level)",
                "reason": f"Critical skill for {target_role} role",
                "estimated_time": self._estimate_learning_time(skill, level),
                "resources": self._get_learning_resources(skill, level)
            }
            recommendations.append(rec)
        
        # Priority 2: Improve existing skills that don't meet requirements
        for category_analysis in analysis.values():
            for matched_skill in category_analysis["matched"]:
                if not matched_skill["meets_requirement"]:
                    skill = matched_skill["skill"]
                    current_score = matched_skill["user_score"]
                    required_level = matched_skill["required_level"]
                    
                    rec = {
                        "type": "skill_improvement",
                        "skill": skill,
                        "priority": "medium",
                        "action": f"Improve {skill} to {required_level} level",
                        "reason": f"Current level ({current_score}%) below requirement",
                        "estimated_time": "2-4 weeks",
                        "resources": self._get_improvement_resources(skill, required_level)
                    }
                    recommendations.append(rec)
        
        # Priority 3: High-value preferred skills
        preferred_missing = [s for s in missing_skills if s["category"] == "preferred_skills" and s["weight"] > 0.6][:2]
        for skill_info in preferred_missing:
            skill = skill_info["skill"]
            level = skill_info["required_level"]
            
            rec = {
                "type": "preferred_skill",
                "skill": skill,
                "priority": "medium",
                "action": f"Learn {skill} ({level} level)",
                "reason": f"Highly valued skill for {target_role}",
                "estimated_time": self._estimate_learning_time(skill, level),
                "resources": self._get_learning_resources(skill, level)
            }
            recommendations.append(rec)
        
        return recommendations[:6]  # Limit to top 6 recommendations

    def _calculate_market_alignment(self, detected_skills: List[str]) -> Dict:
        """Calculate how well skills align with market demand"""
        total_weight = 0
        user_weight = 0
        
        for skill in detected_skills:
            skill_lower = skill.lower()
            if skill_lower in self.skill_weights:
                weight = self.skill_weights[skill_lower]
                total_weight += weight
                user_weight += weight
        
        # Calculate against top market skills
        top_skills_weight = sum(list(self.skill_weights.values())[:10])
        alignment_score = (user_weight / top_skills_weight) * 100 if top_skills_weight > 0 else 0
        
        return {
            "alignment_score": round(alignment_score, 1),
            "high_demand_skills": [s for s in detected_skills if s.lower() in self.skill_weights and self.skill_weights[s.lower()] > 0.8],
            "emerging_skills": [s for s in detected_skills if s.lower() in ["rust", "go", "kubernetes", "machine learning"]]
        }

    def _estimate_learning_time(self, skill: str, level: str) -> str:
        """Estimate time needed to learn a skill"""
        base_times = {
            "basic": {"programming": "4-6 weeks", "tool": "2-3 weeks", "framework": "3-4 weeks"},
            "intermediate": {"programming": "8-12 weeks", "tool": "4-6 weeks", "framework": "6-8 weeks"},
            "advanced": {"programming": "16-24 weeks", "tool": "8-12 weeks", "framework": "12-16 weeks"}
        }
        
        skill_type = "programming" if skill.lower() in ["python", "javascript", "java", "c++"] else "framework"
        if skill.lower() in ["docker", "git", "linux"]:
            skill_type = "tool"
        
        return base_times.get(level, {}).get(skill_type, "4-8 weeks")

    def _get_learning_resources(self, skill: str, level: str) -> List[str]:
        """Get learning resources for a skill"""
        resources = {
            "python": ["Python.org Tutorial", "Automate the Boring Stuff", "Python Crash Course"],
            "javascript": ["MDN Web Docs", "JavaScript.info", "Eloquent JavaScript"],
            "react": ["React Official Docs", "React Tutorial", "Full Stack Open"],
            "docker": ["Docker Official Tutorial", "Docker for Beginners", "Play with Docker"],
            "aws": ["AWS Free Tier", "AWS Training", "A Cloud Guru"],
            "machine learning": ["Coursera ML Course", "Fast.ai", "Kaggle Learn"]
        }
        
        return resources.get(skill.lower(), [f"{skill} Official Documentation", f"{skill} Tutorial", f"Learn {skill}"])

    def _get_improvement_resources(self, skill: str, level: str) -> List[str]:
        """Get resources for improving existing skills"""
        return [
            f"Advanced {skill} Course",
            f"{skill} Best Practices",
            f"{skill} Projects and Challenges"
        ]