"""
Enhanced AI-powered resume analyzer with real skill extraction and insights
"""
import re
import json
from typing import Dict, List, Tuple
from datetime import datetime
import requests
from bs4 import BeautifulSoup

class AIResumeAnalyzer:
    def __init__(self):
        self.skill_database = self._load_skill_database()
        self.market_trends = self._load_market_trends()
        
    def _load_skill_database(self) -> Dict:
        """Load comprehensive skill database with categories and market demand"""
        return {
            "programming_languages": {
                "python": {"demand": 95, "growth": 15, "category": "backend"},
                "javascript": {"demand": 92, "growth": 12, "category": "frontend"},
                "typescript": {"demand": 88, "growth": 25, "category": "frontend"},
                "java": {"demand": 85, "growth": 5, "category": "backend"},
                "react": {"demand": 90, "growth": 20, "category": "frontend"},
                "node.js": {"demand": 82, "growth": 18, "category": "backend"},
                "go": {"demand": 75, "growth": 30, "category": "backend"},
                "rust": {"demand": 65, "growth": 40, "category": "systems"},
                "c++": {"demand": 70, "growth": 8, "category": "systems"},
                "c#": {"demand": 78, "growth": 10, "category": "backend"}
            },
            "cloud_platforms": {
                "aws": {"demand": 93, "growth": 22, "category": "cloud"},
                "azure": {"demand": 85, "growth": 28, "category": "cloud"},
                "gcp": {"demand": 75, "growth": 35, "category": "cloud"},
                "docker": {"demand": 88, "growth": 20, "category": "devops"},
                "kubernetes": {"demand": 82, "growth": 25, "category": "devops"},
                "terraform": {"demand": 78, "growth": 30, "category": "devops"}
            },
            "databases": {
                "postgresql": {"demand": 85, "growth": 15, "category": "database"},
                "mysql": {"demand": 80, "growth": 8, "category": "database"},
                "mongodb": {"demand": 75, "growth": 18, "category": "database"},
                "redis": {"demand": 70, "growth": 20, "category": "database"},
                "elasticsearch": {"demand": 65, "growth": 22, "category": "database"}
            },
            "ai_ml": {
                "machine learning": {"demand": 90, "growth": 35, "category": "ai"},
                "tensorflow": {"demand": 80, "growth": 25, "category": "ai"},
                "pytorch": {"demand": 78, "growth": 30, "category": "ai"},
                "pandas": {"demand": 85, "growth": 20, "category": "data"},
                "numpy": {"demand": 82, "growth": 18, "category": "data"},
                "scikit-learn": {"demand": 75, "growth": 22, "category": "ai"}
            }
        }
    
    def _load_market_trends(self) -> Dict:
        """Load current market trends and job requirements"""
        return {
            "software_engineer": {
                "core_skills": ["python", "javascript", "git", "sql", "react"],
                "trending_skills": ["typescript", "docker", "aws", "kubernetes"],
                "salary_range": "$70k-$150k",
                "job_growth": "22%"
            },
            "data_scientist": {
                "core_skills": ["python", "sql", "machine learning", "pandas", "statistics"],
                "trending_skills": ["pytorch", "mlops", "aws", "docker"],
                "salary_range": "$80k-$160k", 
                "job_growth": "35%"
            },
            "frontend_developer": {
                "core_skills": ["javascript", "html", "css", "react", "git"],
                "trending_skills": ["typescript", "next.js", "tailwind", "testing"],
                "salary_range": "$60k-$130k",
                "job_growth": "18%"
            },
            "devops_engineer": {
                "core_skills": ["linux", "docker", "kubernetes", "aws", "ci/cd"],
                "trending_skills": ["terraform", "monitoring", "security", "automation"],
                "salary_range": "$80k-$170k",
                "job_growth": "28%"
            }
        }

    def extract_skills_with_context(self, text: str) -> Dict:
        """Extract skills with confidence scores and context - Enhanced for better detection"""
        text_lower = text.lower()
        detected_skills = {}
        skill_contexts = {}
        
        # Enhanced skill database with variations and aliases
        enhanced_skills = {
            "python": {"aliases": ["python", "py"], "demand": 95, "growth": 15, "category": "programming"},
            "javascript": {"aliases": ["javascript", "js", "node.js", "nodejs"], "demand": 92, "growth": 12, "category": "programming"},
            "html": {"aliases": ["html", "html5"], "demand": 85, "growth": 5, "category": "web"},
            "css": {"aliases": ["css", "css3"], "demand": 85, "growth": 5, "category": "web"},
            "sql": {"aliases": ["sql", "mysql", "postgresql", "sqlite"], "demand": 88, "growth": 10, "category": "database"},
            "mongodb": {"aliases": ["mongodb", "mongo"], "demand": 75, "growth": 18, "category": "database"},
            "flask": {"aliases": ["flask"], "demand": 70, "growth": 15, "category": "framework"},
            "tensorflow": {"aliases": ["tensorflow", "tf"], "demand": 80, "growth": 25, "category": "ai"},
            "opencv": {"aliases": ["opencv", "cv2"], "demand": 75, "growth": 20, "category": "ai"},
            "machine learning": {"aliases": ["machine learning", "ml", "artificial intelligence", "ai"], "demand": 90, "growth": 35, "category": "ai"},
            "deep learning": {"aliases": ["deep learning", "neural networks", "cnn", "rnn"], "demand": 85, "growth": 40, "category": "ai"},
            "computer vision": {"aliases": ["computer vision", "cv", "image processing"], "demand": 80, "growth": 30, "category": "ai"},
            "git": {"aliases": ["git", "github", "version control"], "demand": 90, "growth": 8, "category": "tools"},
            "jupyter": {"aliases": ["jupyter", "jupyter notebook"], "demand": 70, "growth": 15, "category": "tools"},
            "rest api": {"aliases": ["rest api", "api", "restful"], "demand": 85, "growth": 12, "category": "web"},
            "data structures": {"aliases": ["data structures", "algorithms", "dsa"], "demand": 85, "growth": 10, "category": "programming"},
            "librosa": {"aliases": ["librosa"], "demand": 60, "growth": 20, "category": "ai"},
            "cyclegan": {"aliases": ["cyclegan", "gan"], "demand": 65, "growth": 25, "category": "ai"}
        }
        
        # Combine with existing skill database
        all_skills = enhanced_skills.copy()
        for category, skills in self.skill_database.items():
            for skill, data in skills.items():
                if skill not in all_skills:
                    all_skills[skill] = {"aliases": [skill], **data}
        
        for skill, data in all_skills.items():
            confidence = 0
            contexts = []
            aliases = data.get("aliases", [skill])
            
            # Check all aliases for the skill
            for alias in aliases:
                alias_lower = alias.lower()
                
                # Direct mention with word boundaries
                if re.search(rf'\b{re.escape(alias_lower)}\b', text_lower):
                    confidence += 50
                    contexts.append(f"direct_mention_{alias}")
                
                # Context-based detection
                skill_contexts_patterns = [
                    f"experience with {alias_lower}",
                    f"proficient in {alias_lower}",
                    f"skilled in {alias_lower}",
                    f"using {alias_lower}",
                    f"{alias_lower} development",
                    f"{alias_lower} programming",
                    f"worked with {alias_lower}",
                    f"{alias_lower} projects",
                    f"knowledge of {alias_lower}",
                    f"familiar with {alias_lower}"
                ]
                
                for pattern in skill_contexts_patterns:
                    if pattern in text_lower:
                        confidence += 20
                        contexts.append(f"contextual_mention_{alias}")
                        break
                
                # Project-based detection with regex
                project_patterns = [
                    rf"built.*{re.escape(alias_lower)}",
                    rf"developed.*{re.escape(alias_lower)}",
                    rf"created.*{re.escape(alias_lower)}",
                    rf"{re.escape(alias_lower)}.*application",
                    rf"{re.escape(alias_lower)}.*project",
                    rf"implemented.*{re.escape(alias_lower)}",
                    rf"deployed.*{re.escape(alias_lower)}"
                ]
                
                for pattern in project_patterns:
                    if re.search(pattern, text_lower):
                        confidence += 25
                        contexts.append(f"project_experience_{alias}")
                        break
            
            # Technical skills section detection
            tech_section_patterns = [
                r"technical skills[:\s]*([^\n]*)",
                r"programming[:\s]*([^\n]*)",
                r"frameworks[:\s]*([^\n]*)",
                r"tools[:\s]*([^\n]*)"
            ]
            
            for pattern in tech_section_patterns:
                matches = re.findall(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    for alias in aliases:
                        if alias.lower() in match.lower():
                            confidence += 30
                            contexts.append("technical_skills_section")
                            break
            
            # Years of experience boost
            for alias in aliases:
                exp_pattern = rf"(\d+)[\s\+]*years?.*{re.escape(alias.lower())}"
                exp_match = re.search(exp_pattern, text_lower)
                if exp_match:
                    years = int(exp_match.group(1))
                    confidence += min(years * 8, 30)
                    contexts.append(f"{years}_years_experience")
                    break
            
            # Coursework and education boost
            education_patterns = [
                r"coursework[:\s]*([^\n]*)",
                r"relevant courses[:\s]*([^\n]*)",
                r"subjects[:\s]*([^\n]*)"
            ]
            
            for pattern in education_patterns:
                matches = re.findall(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    for alias in aliases:
                        if alias.lower() in match.lower():
                            confidence += 20
                            contexts.append("coursework_mention")
                            break
            
            if confidence > 25:  # Lower threshold for better detection
                detected_skills[skill.title()] = 1  # Remove percentage scoring
                skill_contexts[skill.title()] = contexts
        
        return {
            "skills": detected_skills,
            "contexts": skill_contexts,
            "total_skills": len(detected_skills)
        }

    def analyze_skill_gaps(self, detected_skills: Dict, target_role: str = "ai_ml_engineer") -> Dict:
        """Analyze skill gaps against market requirements with enhanced analysis"""
        # Add AI/ML engineer role if not exists
        if "ai_ml_engineer" not in self.market_trends:
            self.market_trends["ai_ml_engineer"] = {
                "core_skills": ["python", "machine learning", "tensorflow", "pandas", "numpy"],
                "trending_skills": ["deep learning", "computer vision", "nlp", "pytorch", "mlops"],
                "salary_range": "$90k-$180k",
                "job_growth": "40%"
            }
        
        if target_role not in self.market_trends:
            target_role = "software_engineer"
        
        role_data = self.market_trends[target_role]
        core_skills = role_data["core_skills"]
        trending_skills = role_data["trending_skills"]
        
        # Calculate match scores with fuzzy matching
        detected_skill_names = [skill.lower() for skill in detected_skills.keys()]
        
        core_matches = []
        core_missing = []
        for skill in core_skills:
            if self._fuzzy_skill_match(skill, detected_skill_names):
                core_matches.append(skill)
            else:
                core_missing.append(skill)
        
        trending_matches = []
        trending_missing = []
        for skill in trending_skills:
            if self._fuzzy_skill_match(skill, detected_skill_names):
                trending_matches.append(skill)
            else:
                trending_missing.append(skill)
        
        # Calculate weighted scores based on skill importance
        core_score = (len(core_matches) / len(core_skills)) * 70
        trending_score = (len(trending_matches) / len(trending_skills)) * 30
        overall_score = core_score + trending_score
        
        # Generate priority recommendations
        priority_skills = self._prioritize_missing_skills(core_missing + trending_missing, target_role)
        
        return {
            "overall_match_score": round(overall_score, 1),
            "core_skills_match": {
                "matched": core_matches,
                "missing": core_missing,
                "score": round(core_score, 1)
            },
            "trending_skills_match": {
                "matched": trending_matches,
                "missing": trending_missing,
                "score": round(trending_score, 1)
            },
            "priority_skills": priority_skills,
            "role_info": role_data,
            "skill_categories": self._categorize_skills(detected_skills.keys()),
            "improvement_areas": self._identify_improvement_areas(detected_skills, target_role)
        }
    
    def _fuzzy_skill_match(self, target_skill: str, detected_skills: List[str]) -> bool:
        """Check if skill matches with fuzzy logic"""
        target_lower = target_skill.lower()
        
        # Direct match
        if target_lower in detected_skills:
            return True
        
        # Partial matches
        for detected in detected_skills:
            if target_lower in detected or detected in target_lower:
                return True
            
            # Handle common variations
            variations = {
                "javascript": ["js", "node.js", "nodejs"],
                "python": ["py"],
                "react": ["reactjs", "react.js"],
                "typescript": ["ts"]
            }
            
            if target_lower in variations:
                if any(var in detected for var in variations[target_lower]):
                    return True
        
        return False
    
    def _prioritize_missing_skills(self, missing_skills: List[str], target_role: str) -> List[Dict]:
        """Prioritize missing skills based on market demand and role requirements"""
        priorities = []
        
        # Get all skills data
        all_skills = {}
        for category, skills in self.skill_database.items():
            all_skills.update(skills)
        
        for skill in missing_skills[:6]:  # Top 6 missing skills
            skill_data = all_skills.get(skill.lower(), {"demand": 50, "growth": 10})
            
            # Calculate priority score
            demand_score = skill_data.get("demand", 50)
            growth_score = skill_data.get("growth", 10)
            priority_score = (demand_score * 0.7) + (growth_score * 0.3)
            
            if priority_score > 80:
                priority = "critical"
            elif priority_score > 60:
                priority = "high"
            else:
                priority = "medium"
            
            priorities.append({
                "skill": skill,
                "priority": priority,
                "demand": demand_score,
                "growth": growth_score,
                "priority_score": round(priority_score, 1)
            })
        
        return sorted(priorities, key=lambda x: x["priority_score"], reverse=True)
    
    def _categorize_skills(self, skills: List[str]) -> Dict:
        """Categorize detected skills"""
        categories = {
            "programming": [],
            "frameworks": [],
            "databases": [],
            "cloud": [],
            "tools": [],
            "soft_skills": []
        }
        
        skill_categories = {
            "programming": ["python", "javascript", "java", "c++", "typescript", "go", "rust"],
            "frameworks": ["react", "node.js", "django", "express", "vue", "angular"],
            "databases": ["sql", "mysql", "postgresql", "mongodb", "redis"],
            "cloud": ["aws", "azure", "gcp", "docker", "kubernetes"],
            "tools": ["git", "jenkins", "ci/cd", "linux", "bash"],
            "soft_skills": ["communication", "leadership", "teamwork", "problem solving"]
        }
        
        for skill in skills:
            skill_lower = skill.lower()
            categorized = False
            
            for category, category_skills in skill_categories.items():
                if any(cat_skill in skill_lower for cat_skill in category_skills):
                    categories[category].append(skill)
                    categorized = True
                    break
            
            if not categorized:
                categories["tools"].append(skill)
        
        return categories
    
    def _identify_improvement_areas(self, detected_skills: Dict, target_role: str) -> List[str]:
        """Identify specific areas for improvement"""
        improvements = []
        
        # Analyze skill scores
        low_score_skills = [skill for skill, score in detected_skills.items() if score < 70]
        
        if low_score_skills:
            improvements.append(f"Strengthen foundational skills: {', '.join(low_score_skills[:3])}")
        
        # Role-specific improvements
        if target_role == "software_engineer":
            if not any("project" in skill.lower() for skill in detected_skills.keys()):
                improvements.append("Build more hands-on projects to demonstrate practical skills")
            
            if not any(skill.lower() in ["git", "version control"] for skill in detected_skills.keys()):
                improvements.append("Learn version control systems like Git")
        
        elif target_role == "data_scientist":
            if not any("machine learning" in skill.lower() for skill in detected_skills.keys()):
                improvements.append("Develop machine learning expertise")
            
            if not any(skill.lower() in ["statistics", "math"] for skill in detected_skills.keys()):
                improvements.append("Strengthen statistical and mathematical foundations")
        
        return improvements[:4]  # Top 4 improvement areas

    def generate_personalized_recommendations(self, skill_analysis: Dict, gap_analysis: Dict, 
                                           experience_level: str = "intermediate") -> List[Dict]:
        """Generate personalized learning recommendations - Enhanced for AI/ML students"""
        recommendations = []
        
        missing_core = gap_analysis.get("core_skills_match", {}).get("missing", [])
        missing_trending = gap_analysis.get("trending_skills_match", {}).get("missing", [])
        detected_skills = list(skill_analysis.get("skills", {}).keys())
        
        # AI/ML specific recommendations for students
        ai_ml_skills = ["machine learning", "deep learning", "computer vision", "nlp", "pytorch"]
        has_ai_skills = any(skill.lower() in [s.lower() for s in detected_skills] for skill in ai_ml_skills)
        
        if has_ai_skills or experience_level == "junior":
            # Student/Junior AI/ML recommendations
            recommendations.extend([
                {
                    "skill": "Advanced ML Projects",
                    "priority": "critical",
                    "action": "Build 2-3 end-to-end ML projects with deployment",
                    "estimated_time": "6-8 weeks",
                    "resources": [
                        {"type": "platform", "name": "Kaggle Competitions", "platform": "Kaggle"},
                        {"type": "course", "name": "MLOps Specialization", "platform": "Coursera"}
                    ]
                },
                {
                    "skill": "Production ML",
                    "priority": "high",
                    "action": "Learn to deploy ML models in production environments",
                    "estimated_time": "4-5 weeks",
                    "resources": [
                        {"type": "course", "name": "ML Engineering", "platform": "Udemy"},
                        {"type": "tutorial", "name": "FastAPI + ML", "platform": "YouTube"}
                    ]
                }
            ])
        
        # Priority recommendations for missing core skills
        for skill in missing_core[:2]:
            priority = "high"
            if skill.lower() in ["pandas", "numpy"]:
                action = f"Master {skill} for data manipulation and analysis"
                resources = [
                    {"type": "course", "name": f"{skill} Complete Guide", "platform": "DataCamp"},
                    {"type": "practice", "name": f"{skill} Exercises", "platform": "Kaggle Learn"}
                ]
            elif skill.lower() in ["pytorch", "tensorflow"]:
                action = f"Build deep learning projects using {skill}"
                resources = [
                    {"type": "course", "name": f"{skill} Deep Learning", "platform": "fast.ai"},
                    {"type": "project", "name": f"{skill} Projects", "platform": "GitHub"}
                ]
            elif skill.lower() == "sql":
                action = "Learn SQL for data analysis and database management"
                resources = [
                    {"type": "course", "name": "SQL for Data Science", "platform": "Coursera"},
                    {"type": "practice", "name": "SQL Practice", "platform": "HackerRank"}
                ]
            else:
                action = f"Learn {skill} fundamentals and apply in projects"
                resources = [
                    {"type": "course", "name": f"Learn {skill}", "platform": "Udemy"},
                    {"type": "documentation", "name": f"{skill} Official Docs", "platform": "Official"}
                ]
            
            recommendations.append({
                "skill": skill,
                "priority": priority,
                "action": action,
                "estimated_time": "3-4 weeks",
                "resources": resources
            })
        
        # Trending skills for AI/ML
        ai_trending = ["mlops", "transformers", "generative ai", "llm", "computer vision"]
        for skill in missing_trending[:2]:
            if skill.lower() in ai_trending:
                priority = "medium"
                action = f"Explore {skill} - it's trending in AI/ML industry"
                recommendations.append({
                    "skill": skill,
                    "priority": priority,
                    "action": action,
                    "estimated_time": "2-3 weeks",
                    "resources": [
                        {"type": "course", "name": f"{skill} Fundamentals", "platform": "Coursera"},
                        {"type": "tutorial", "name": f"{skill} Tutorial", "platform": "YouTube"}
                    ]
                })
        
        # Experience-based recommendations for students
        if experience_level in ["beginner", "junior"]:
            recommendations.insert(0, {
                "skill": "GitHub Portfolio",
                "priority": "critical",
                "action": "Create a strong GitHub portfolio with 5+ AI/ML projects",
                "estimated_time": "4-6 weeks",
                "resources": [
                    {"type": "guide", "name": "ML Portfolio Guide", "platform": "Towards Data Science"},
                    {"type": "examples", "name": "Top ML Portfolios", "platform": "GitHub"}
                ]
            })
            
            # Add internship/job preparation
            recommendations.append({
                "skill": "Interview Preparation",
                "priority": "high",
                "action": "Prepare for ML engineering interviews with coding + ML theory",
                "estimated_time": "3-4 weeks",
                "resources": [
                    {"type": "book", "name": "ML Interview Guide", "platform": "Book"},
                    {"type": "practice", "name": "ML Coding Problems", "platform": "LeetCode"}
                ]
            })
        
        return recommendations[:6]  # Limit to top 6 recommendations

    def extract_experience_level(self, text: str) -> Tuple[str, int]:
        """Extract experience level and years from resume - Fixed for freshers"""
        text_lower = text.lower()
        
        # Look for explicit years of experience
        exp_patterns = [
            r"(\d+)[\s\+]*years?\s+(?:of\s+)?experience",
            r"experience[:\s]*(\d+)[\s\+]*years?",
            r"(\d+)[\s\+]*years?\s+in\s+(?:software|development|programming)",
        ]
        
        years = 0
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                years = max(years, int(match.group(1)))
        
        # Check for fresher indicators first
        fresher_indicators = ["fresher", "recent graduate", "new graduate", "entry level", "seeking opportunities", "looking for opportunities"]
        student_indicators = ["student", "pursuing", "currently studying", "final year", "undergraduate", "graduate student"]
        
        if any(indicator in text_lower for indicator in fresher_indicators + student_indicators):
            years = 0
            level = "fresher"
        else:
            # Infer from job titles and descriptions
            senior_indicators = ["senior", "lead", "principal", "architect", "manager"]
            junior_indicators = ["junior", "intern", "trainee"]
            
            if any(indicator in text_lower for indicator in senior_indicators):
                years = max(years, 5)
            elif any(indicator in text_lower for indicator in junior_indicators):
                years = max(years, 1)
            
            # Determine level based on years
            if years == 0:
                # Check if there's any work experience mentioned
                work_indicators = ["worked at", "employed at", "position at", "role at", "job at"]
                if any(indicator in text_lower for indicator in work_indicators):
                    level = "junior"
                    years = 1
                else:
                    level = "fresher"
            elif years <= 2:
                level = "junior"
            elif years <= 5:
                level = "intermediate"
            else:
                level = "senior"
        
        return level, years

    def generate_market_insights(self, detected_skills: Dict, target_role: str) -> Dict:
        """Generate market insights and salary predictions"""
        role_data = self.market_trends.get(target_role, self.market_trends["software_engineer"])
        
        # Calculate market alignment score
        all_skills = {}
        for category, skills in self.skill_database.items():
            all_skills.update(skills)
        
        skill_values = []
        for skill, confidence in detected_skills.items():
            if skill.lower() in all_skills:
                demand = all_skills[skill.lower()]["demand"]
                growth = all_skills[skill.lower()]["growth"]
                skill_values.append((demand + growth) * (confidence / 100))
        
        market_score = sum(skill_values) / len(skill_values) if skill_values else 50
        
        return {
            "market_alignment_score": round(market_score, 1),
            "role_growth": role_data["job_growth"],
            "salary_range": role_data["salary_range"],
            "top_demand_skills": [
                skill for skill, data in sorted(
                    all_skills.items(), 
                    key=lambda x: x[1]["demand"], 
                    reverse=True
                )[:5]
            ],
            "fastest_growing_skills": [
                skill for skill, data in sorted(
                    all_skills.items(), 
                    key=lambda x: x[1]["growth"], 
                    reverse=True
                )[:5]
            ]
        }

class RecommendationScraper:
    """Scrape learning resources and job recommendations"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def get_leetcode_problems(self, skills: List[str], difficulty: str = "medium") -> List[Dict]:
        """Get relevant LeetCode problems (mock data for now)"""
        # Mock LeetCode problems based on skills
        problems_db = {
            "python": [
                {"title": "Two Sum", "difficulty": "Easy", "link": "https://leetcode.com/problems/two-sum/"},
                {"title": "Valid Parentheses", "difficulty": "Easy", "link": "https://leetcode.com/problems/valid-parentheses/"},
                {"title": "Merge Two Sorted Lists", "difficulty": "Easy", "link": "https://leetcode.com/problems/merge-two-sorted-lists/"}
            ],
            "javascript": [
                {"title": "Add Two Numbers", "difficulty": "Medium", "link": "https://leetcode.com/problems/add-two-numbers/"},
                {"title": "Longest Substring", "difficulty": "Medium", "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
                {"title": "Container With Most Water", "difficulty": "Medium", "link": "https://leetcode.com/problems/container-with-most-water/"}
            ],
            "algorithms": [
                {"title": "Binary Tree Inorder", "difficulty": "Medium", "link": "https://leetcode.com/problems/binary-tree-inorder-traversal/"},
                {"title": "Maximum Subarray", "difficulty": "Easy", "link": "https://leetcode.com/problems/maximum-subarray/"},
                {"title": "Climbing Stairs", "difficulty": "Easy", "link": "https://leetcode.com/problems/climbing-stairs/"}
            ]
        }
        
        recommendations = []
        for skill in skills[:3]:  # Top 3 skills
            if skill.lower() in problems_db:
                recommendations.extend(problems_db[skill.lower()][:2])
            else:
                recommendations.extend(problems_db["algorithms"][:1])
        
        return recommendations[:5]
    
    def get_course_recommendations(self, skills: List[str]) -> List[Dict]:
        """Get comprehensive course recommendations with real links"""
        courses_db = {
            "python": [
                {"title": "Complete Python Bootcamp From Zero to Hero", "platform": "Udemy", "duration": "22 hours", "rating": 4.6, "link": "https://www.udemy.com/course/complete-python-bootcamp/"},
                {"title": "Python for Everybody Specialization", "platform": "Coursera", "duration": "8 months", "rating": 4.8, "link": "https://www.coursera.org/specializations/python"},
                {"title": "Automate the Boring Stuff with Python", "platform": "Book/Online", "duration": "Self-paced", "rating": 4.9, "link": "https://automatetheboringstuff.com/"}
            ],
            "javascript": [
                {"title": "The Complete JavaScript Course 2024", "platform": "Udemy", "duration": "69 hours", "rating": 4.7, "link": "https://www.udemy.com/course/the-complete-javascript-course/"},
                {"title": "JavaScript Algorithms and Data Structures", "platform": "freeCodeCamp", "duration": "300 hours", "rating": 4.8, "link": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/"},
                {"title": "You Don't Know JS (book series)", "platform": "GitHub", "duration": "Self-paced", "rating": 4.9, "link": "https://github.com/getify/You-Dont-Know-JS"}
            ],
            "react": [
                {"title": "React - The Complete Guide 2024", "platform": "Udemy", "duration": "48 hours", "rating": 4.8, "link": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/"},
                {"title": "React Specialization", "platform": "Coursera", "duration": "4 months", "rating": 4.6, "link": "https://www.coursera.org/specializations/react"},
                {"title": "React Official Tutorial", "platform": "React.dev", "duration": "2-4 hours", "rating": 4.9, "link": "https://react.dev/learn"}
            ],
            "typescript": [
                {"title": "Understanding TypeScript", "platform": "Udemy", "duration": "15 hours", "rating": 4.7, "link": "https://www.udemy.com/course/understanding-typescript/"},
                {"title": "TypeScript Handbook", "platform": "Official Docs", "duration": "Self-paced", "rating": 4.8, "link": "https://www.typescriptlang.org/docs/"}
            ],
            "node.js": [
                {"title": "The Complete Node.js Developer Course", "platform": "Udemy", "duration": "35 hours", "rating": 4.7, "link": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/"},
                {"title": "Node.js, Express, MongoDB & More", "platform": "Udemy", "duration": "42 hours", "rating": 4.8, "link": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/"}
            ],
            "aws": [
                {"title": "AWS Certified Solutions Architect", "platform": "Udemy", "duration": "26 hours", "rating": 4.7, "link": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/"},
                {"title": "AWS Cloud Practitioner Essentials", "platform": "AWS Training", "duration": "6 hours", "rating": 4.6, "link": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/"}
            ],
            "machine learning": [
                {"title": "Machine Learning Course", "platform": "Coursera", "duration": "11 weeks", "rating": 4.9, "link": "https://www.coursera.org/learn/machine-learning"},
                {"title": "Machine Learning A-Z", "platform": "Udemy", "duration": "44 hours", "rating": 4.5, "link": "https://www.udemy.com/course/machinelearning/"},
                {"title": "Fast.ai Practical Deep Learning", "platform": "fast.ai", "duration": "7 weeks", "rating": 4.8, "link": "https://course.fast.ai/"}
            ],
            "docker": [
                {"title": "Docker Mastery: with Kubernetes +Swarm", "platform": "Udemy", "duration": "19 hours", "rating": 4.6, "link": "https://www.udemy.com/course/docker-mastery/"},
                {"title": "Docker Official Tutorial", "platform": "Docker", "duration": "2-3 hours", "rating": 4.7, "link": "https://docs.docker.com/get-started/"}
            ]
        }
        
        recommendations = []
        
        # Get specific courses for each skill
        for skill in skills[:4]:  # Top 4 skills
            skill_lower = skill.lower()
            if skill_lower in courses_db:
                recommendations.extend(courses_db[skill_lower][:2])  # Top 2 courses per skill
        
        # Add foundational courses if not enough specific ones
        foundational_courses = [
            {"title": "CS50 Introduction to Computer Science", "platform": "edX", "duration": "12 weeks", "rating": 4.9, "link": "https://www.edx.org/course/introduction-computer-science-harvardx-cs50x"},
            {"title": "The Odin Project - Full Stack", "platform": "The Odin Project", "duration": "6-9 months", "rating": 4.8, "link": "https://www.theodinproject.com/"},
            {"title": "freeCodeCamp Full Stack", "platform": "freeCodeCamp", "duration": "300+ hours", "rating": 4.8, "link": "https://www.freecodecamp.org/learn/"},
            {"title": "MIT Introduction to Computer Science", "platform": "MIT OpenCourseWare", "duration": "14 weeks", "rating": 4.7, "link": "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/"}
        ]
        
        if len(recommendations) < 6:
            needed = 6 - len(recommendations)
            recommendations.extend(foundational_courses[:needed])
        
        return recommendations[:8]  # Return top 8 recommendations