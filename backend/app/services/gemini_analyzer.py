"""
Gemini AI-Powered Resume Analyzer
Uses Google's Gemini API for advanced resume parsing and analysis
"""
import os
import json
import re
from typing import Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    
    # Configure Gemini API
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        print("[OK] Gemini API configured successfully")
    else:
        print("[WARN] GEMINI_API_KEY not found in environment")
        GEMINI_AVAILABLE = False
except ImportError:
    print("[WARN] google-generativeai not installed. Install with: pip install google-generativeai")
    GEMINI_AVAILABLE = False

class GeminiResumeAnalyzer:
    def __init__(self):
        self.gemini_available = GEMINI_AVAILABLE and GEMINI_API_KEY
        if self.gemini_available:
            try:
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                print("✅ Gemini 2.5 Flash model initialized")
            except Exception as e:
                print(f"❌ Failed to initialize Gemini model: {e}")
                self.gemini_available = False
    
    def analyze_resume_with_gemini(self, resume_text: str, target_role: str = None) -> Dict:
        """
        Use Gemini AI to comprehensively analyze resume and auto-detect role
        """
        if not self.gemini_available:
            return self._fallback_analysis(resume_text)
        
        prompt = f"""
Analyze this resume comprehensively and extract information in STRICT JSON format.

RESUME TEXT:
{resume_text}

You MUST return a valid JSON object with this EXACT structure (no markdown, no extra text):

{{
  "personal_info": {{
    "name": "Extract the actual full name of the person from the resume (e.g. John Doe). Do not use placeholders.",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "LinkedIn URL"
  }},
  "education": {{
    "highest_degree": "Degree name",
    "institution": "University name",
    "graduation_year": "2024",
    "gpa": "3.8",
    "field_of_study": "Computer Science"
  }},
  "work_experience": [
    {{
      "company": "Company",
      "position": "Title",
      "duration": "Jan 2020 - Present",
      "description": "Brief description",
      "technologies": ["Tech1", "Tech2"]
    }}
  ],
  "skills": {{
    "technical_skills": ["Python", "JavaScript", "Java", "etc"],
    "tools": ["Git", "Docker", "VS Code", "etc"],
    "frameworks": ["React", "Django", "Node.js", "etc"],
    "databases": ["MySQL", "MongoDB", "PostgreSQL", "etc"],
    "soft_skills": ["Communication", "Leadership", "etc"]
  }},
  "projects": [
    {{
      "name": "Project name",
      "description": "Description",
      "technologies": ["Tech1", "Tech2"]
    }}
  ],
  "certifications": ["Cert1", "Cert2"],
  "experience_analysis": {{
    "total_years": 2,
    "level": "junior",
    "strengths": ["Strength1", "Strength2"],
    "areas_for_improvement": ["Area1", "Area2"]
  }},
  "role_prediction": "software_engineer",
  "match_score": 75,
  "missing_skills_for_role": ["Skill1", "Skill2"],
  "recommendations": ["Recommendation1", "Recommendation2"]
}}

IMPORTANT RULES:
1. Extract the ACTUAL NAME of the person from the top of the resume. This is critical.
2. Extract AT LEAST 10-20 unique skills from all categories (technical_skills, tools, frameworks, databases, soft_skills)
3. Auto-detect the most suitable role based on skills and experience (choose from: software_engineer, data_scientist, frontend_developer, backend_developer, fullstack_developer, devops_engineer, ai_ml_engineer, mobile_developer, ui_ux_designer, product_manager)
4. If target role is specified: {target_role}, use it for match_score calculation
5. Be thorough - extract ALL mentioned skills, even if implied
6. Return ONLY the JSON object, no markdown formatting, no explanations

Return valid JSON now:
"""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up markdown formatting if present
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
            
            # Additional cleanup
            result_text = result_text.strip()
            if result_text.endswith(","):
                result_text = result_text[:-1]
            
            # Parse JSON
            analysis = json.loads(result_text)
            
            # Validate response is a dict
            if not isinstance(analysis, dict):
                print(f"❌ Invalid response type: {type(analysis)}, using fallback")
                return self._fallback_analysis(resume_text)
            
            # Validate and normalize
            return self._normalize_gemini_response(analysis, target_role)
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error at line {e.lineno} col {e.colno}: {e.msg}")
            print(f"Response text: {result_text[:500] if 'result_text' in locals() else 'N/A'}")
            
            # Try aggressive cleanup and retry once
            try:
                if 'result_text' in locals():
                    # Remove problematic characters and try again
                    import re
                    cleaned = re.sub(r'[\n\r\t]', ' ', result_text)
                    cleaned = re.sub(r'\s+', ' ', cleaned)
                    analysis = json.loads(cleaned)
                    print(f"🔄 Recovered after cleanup")
                    return self._normalize_gemini_response(analysis, target_role)
            except Exception as retry_e:
                print(f"❌ Retry failed: {retry_e}")
            
            # Final fallback
            print(f"❌ Using rule-based fallback analysis")
            return self._fallback_analysis(resume_text)
        except Exception as e:
            print(f"❌ Gemini analysis error: {e}")
            return self._fallback_analysis(resume_text)
    
    def _normalize_gemini_response(self, analysis: Dict, target_role: str = None) -> Dict:
        """Normalize Gemini response to match expected format and ensure minimum 10 skills"""
        
        # Extract all skills into a flat list
        skills_dict = analysis.get("skills", {})
        all_skills = []
        
        # Handle case where skills might be a list instead of dict
        if isinstance(skills_dict, list):
            all_skills.extend(skills_dict)
        elif isinstance(skills_dict, dict):
            all_skills.extend(skills_dict.get("technical_skills", []))
            all_skills.extend(skills_dict.get("tools", []))
            all_skills.extend(skills_dict.get("frameworks", []))
            all_skills.extend(skills_dict.get("databases", []))
            all_skills.extend(skills_dict.get("soft_skills", []))
        
        # Remove duplicates and clean
        all_skills = list(set([str(s).lower().strip() for s in all_skills if s]))
        
        # Ensure minimum 10 skills - expand if needed
        if len(all_skills) < 10:
            print(f"⚠️ Only {len(all_skills)} skills detected, expanding...")
            # Add common skills based on detected ones
            base_skills = set(all_skills)
            expansions = {
                'python': ['data structures', 'algorithms', 'oop', 'scripting'],
                'javascript': ['html', 'css', 'web development', 'dom manipulation'],
                'react': ['components', 'hooks', 'state management', 'frontend'],
                'java': ['spring', 'maven', 'junit', 'oop'],
                'sql': ['database design', 'queries', 'data modeling', 'rdbms'],
                'git': ['version control', 'collaboration', 'github', 'source control'],
                'c++': ['oop', 'data structures', 'algorithms', 'memory management'],
                'node.js': ['backend', 'api design', 'express', 'rest'],
                'aws': ['cloud computing', 'deployment', 'infrastructure', 'devops']
            }
            
            for skill in list(base_skills):
                if skill in expansions:
                    for exp in expansions[skill]:
                        if exp not in all_skills:
                            all_skills.append(exp)
            
            # If still under 10, add generic professional skills
            generic_skills = ['problem solving', 'communication', 'teamwork', 'analytical thinking', 'project management', 'time management', 'adaptability']
            for skill in generic_skills:
                if len(all_skills) >= 10:
                    break
                if skill not in all_skills:
                    all_skills.append(skill)
        
        # Get role from analysis or use parameter
        detected_role = analysis.get("role_prediction", "software_engineer")
        final_role = target_role if target_role else detected_role
        
        # Get personal info safely
        personal_info = analysis.get("personal_info", {})
        if not isinstance(personal_info, dict):
            personal_info = {}
            
        education = analysis.get("education", {})
        if not isinstance(education, dict):
            education = {}
            
        experience_analysis = analysis.get("experience_analysis", {})
        if not isinstance(experience_analysis, dict):
            experience_analysis = {}
            
        # Extract name safely
        name = personal_info.get("name", "")
        if not name or name.lower() in ["full name", "not specified", "n/a"]:
            name = "Not detected"
            
        print(f"✅ Normalized: {len(all_skills)} skills, role: {final_role}, name: {name}")
        
        return {
            "is_valid_resume": True,
            "personal_info": {
                "name": name,
                "email": personal_info.get("email", ""),
                "phone": personal_info.get("phone", ""),
                "location": personal_info.get("location", "")
            },
            "education": {
                "highest_degree": education.get("highest_degree", "Not specified"),
                "institution": education.get("institution", ""),
                "graduation_year": education.get("graduation_year", ""),
                "field_of_study": education.get("field_of_study", "")
            },
            "work_experience": analysis.get("work_experience", []),
            "projects": analysis.get("projects", []),
            "certifications": analysis.get("certifications", []),
            "detected_skills": all_skills,
            "missing_skills": analysis.get("missing_skills_for_role", []),
            "skill_scores": {skill: 80 for skill in all_skills},  # Assign default scores
            "recommendations": analysis.get("recommendations", []),
            "ai_analysis": {
                "experience_years": experience_analysis.get("total_years", 0),
                "experience_level": experience_analysis.get("level", "fresher"),
                "overall_match_score": analysis.get("match_score", 50),
                "strengths": experience_analysis.get("strengths", []),
                "areas_for_improvement": experience_analysis.get("areas_for_improvement", []),
                "target_role": final_role
            },
            "validation": {
                "is_valid_resume": True,
                "confidence_score": 95,
                "reason": "Comprehensive resume detected with Gemini AI"
            }
        }
    
    def generate_learning_recommendations(self, possessed_skills: List[str], missing_skills: List[str], target_role: str, experience_level: str) -> Dict:
        """
        Generate personalized learning recommendations using Gemini
        """
        if not self.gemini_available:
            return self._fallback_recommendations(possessed_skills, missing_skills, target_role)
        
        # Limit context to speed up API response
        top_missing = missing_skills[:5]  # Focus on top 5 missing skills
        top_possessed = possessed_skills[:5]  # Focus on top 5 possessed skills
        
        prompt = f"""Provide concise JSON with learning recommendations for a {target_role} role.

Current Skills: {', '.join(top_possessed)}
Missing Skills: {', '.join(top_missing)}
Experience: {experience_level}

Return ONLY valid JSON with these keys:
1. priority_skills - array of {{skill, priority (critical/high/medium), reason, estimated_time}}
2. learning_path - array of {{phase, duration, skills_to_learn, milestones}}
3. recommended_courses - array of {{skill, course_title, platform, level, estimated_hours, is_free, cost_efficiency}}
4. practice_resources - array of {{type, description, difficulty}}
5. career_advice - array of strings

Focus on FREE/LOW-COST resources like freeCodeCamp, YouTube, Coursera financial aid."""
        
        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean markdown formatting
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
            
            # Additional cleanup for common issues
            result_text = result_text.strip()
            if result_text.endswith(","):
                result_text = result_text[:-1]
            
            # Parse JSON with validation
            recommendations = json.loads(result_text)
            
            # Validate structure
            if not isinstance(recommendations, dict):
                print(f"⚠️ Invalid response structure: not a dict, attempting recovery")
                return self._fallback_recommendations(possessed_skills, missing_skills, target_role)
            
            return recommendations
            
        except json.JSONDecodeError as e:
            print(f"❌ Gemini recommendations JSON error at line {e.lineno} col {e.colno}: {e.msg}")
            print(f"   Response text (first 500 chars): {result_text[:500] if 'result_text' in locals() else 'N/A'}")
            # Try to recover with more aggressive cleanup
            try:
                if 'result_text' in locals():
                    # Remove common JSON breaking patterns
                    cleaned = result_text.replace('\n', ' ').replace('  ', ' ')
                    # Try parsing again
                    recommendations = json.loads(cleaned)
                    print(f"✅ Recovered after cleanup")
                    return recommendations
            except:
                pass
            # Fall back to default recommendations
            print(f"❌ Could not recover, using fallback")
            return self._fallback_recommendations(possessed_skills, missing_skills, target_role)
        except Exception as e:
            print(f"❌ Gemini recommendations error: {e}")
            return self._fallback_recommendations(possessed_skills, missing_skills, target_role)
    
    def _fallback_recommendations(self, possessed_skills: List[str], missing_skills: List[str], target_role: str) -> Dict:
        """Fallback recommendations when Gemini is unavailable"""
        return {
            "priority_skills": [
                {
                    "skill": skill,
                    "priority": "high",
                    "reason": f"Essential for {target_role} role",
                    "estimated_time": "4-6 weeks"
                }
                for skill in missing_skills[:5]
            ],
            "learning_path": [
                {
                    "phase": "Phase 1: Core Skills",
                    "duration": "2-3 months",
                    "skills_to_learn": missing_skills[:3],
                    "milestones": ["Build foundational knowledge"]
                }
            ],
            "recommended_courses": [
                {
                    "skill": missing_skills[0] if missing_skills else "Programming",
                    "course_title": f"Complete {missing_skills[0] if missing_skills else 'Programming'} Course",
                    "platform": "Udemy",
                    "level": "beginner",
                    "estimated_hours": 40,
                    "is_free": False
                }
            ],
            "practice_resources": [
                {
                    "type": "LeetCode",
                    "description": "Practice coding problems daily",
                    "difficulty": "easy"
                }
            ],
            "career_advice": [
                "Start with fundamentals and build projects",
                "Contribute to open source",
                "Network with professionals in the field"
            ]
        }
    
    def _fallback_analysis(self, resume_text: str) -> Dict:
        """Fallback rule-based analysis when Gemini is not available"""
        
        # Basic name extraction
        name = "Not detected"
        lines = resume_text.split('\n')
        if lines:
            name = lines[0].strip()[:50]  # First line is usually the name
        
        # Basic skill extraction
        skill_keywords = [
            "python", "javascript", "java", "react", "node.js", "typescript",
            "sql", "mysql", "postgresql", "mongodb", "aws", "docker", 
            "kubernetes", "git", "linux", "html", "css", "angular", "vue"
        ]
        
        text_lower = resume_text.lower()
        detected_skills = [skill for skill in skill_keywords if skill in text_lower]
        
        return {
            "is_valid_resume": True,
            "personal_info": {"name": name},
            "education": {"highest_degree": "Not specified"},
            "work_experience": [],
            "projects": [],
            "detected_skills": detected_skills,
            "missing_skills": ["sql", "algorithms", "testing"],
            "skill_scores": {skill: 75 for skill in detected_skills},
            "recommendations": ["Enhance your resume with more details", "Add quantifiable achievements"],
            "ai_analysis": {
                "experience_years": 0,
                "experience_level": "fresher",
                "overall_match_score": 40,
                "target_role": "software_engineer"
            }
        }

# Global instance
gemini_analyzer = GeminiResumeAnalyzer()
