import re
from typing import Dict

class ResumeValidator:
    def __init__(self):
        # Resume indicators - words/phrases that suggest it's a resume
        self.resume_indicators = [
            # Contact info patterns
            "email", "phone", "address", "linkedin", "github",
            # Experience sections
            "experience", "work experience", "employment", "career", "professional",
            "worked at", "employed", "position", "role", "responsibilities",
            # Education sections
            "education", "degree", "university", "college", "school", "graduated",
            "bachelor", "master", "phd", "diploma", "certification",
            # Skills sections
            "skills", "technical skills", "programming", "languages", "technologies",
            "proficient", "experienced in", "familiar with",
            # Common resume sections
            "objective", "summary", "profile", "achievements", "projects",
            "awards", "publications", "references", "portfolio"
        ]
        
        # Non-resume indicators - content that suggests it's NOT a resume
        self.non_resume_indicators = [
            # Academic papers
            "abstract", "methodology", "literature review", "bibliography",
            "hypothesis", "research question", "data analysis", "conclusion",
            # Business documents
            "quarterly report", "financial statement", "budget", "invoice",
            "contract", "agreement", "terms and conditions", "policy",
            # Other documents
            "recipe", "manual", "instructions", "tutorial", "story",
            "novel", "chapter", "once upon a time", "the end"
        ]

    def validate_resume(self, text: str) -> Dict:
        """Fast validation if the uploaded document is actually a resume"""
        text_lower = text.lower()
        
        # Quick length check
        if len(text.strip()) < 50:
            return {
                "is_valid_resume": False,
                "confidence": 0.1,
                "reason": "Document too short to be a resume",
                "suggestions": ["Please upload a complete resume"]
            }
        
        # Fast essential component check
        has_contact = "@" in text or "email" in text_lower or "phone" in text_lower
        has_experience = any(word in text_lower for word in ["experience", "worked", "job", "position", "role"])
        has_education = any(word in text_lower for word in ["education", "degree", "university", "college", "school"])
        has_skills = any(word in text_lower for word in ["skills", "programming", "languages", "technologies"])
        
        # Quick non-resume detection
        non_resume_words = ["recipe", "ingredients", "abstract", "methodology", "once upon a time"]
        has_non_resume = any(word in text_lower for word in non_resume_words)
        
        essential_count = sum([has_contact, has_experience, has_education, has_skills])
        
        # Fast validation logic
        is_valid = essential_count >= 2 and not has_non_resume and len(text) > 200
        confidence = min(0.9, essential_count * 0.25 + 0.1)
        
        if has_non_resume:
            confidence = 0.1
            is_valid = False
        
        return {
            "is_valid_resume": is_valid,
            "confidence": round(confidence, 2),
            "reason": "Valid resume detected" if is_valid else "Not a resume document",
            "suggestions": [] if is_valid else ["Upload a proper resume with experience and skills"],
            "essential_components": {
                "contact_info": has_contact,
                "experience": has_experience,
                "education": has_education,
                "skills": has_skills
            }
        }

    def _generate_validation_reason(self, is_valid: bool, confidence: float, 
                                  essential_components: int, found_indicators: list, 
                                  found_non_indicators: list) -> str:
        """Generate human-readable validation reason"""
        
        if not is_valid:
            if confidence < 0.2:
                return "This doesn't look like a resume. It might be a different type of document."
            elif essential_components < 2:
                return "This document is missing key resume sections like experience, education, or skills."
            elif len(found_non_indicators) >= 3:
                return f"This appears to be a {found_non_indicators[0]} rather than a resume."
            else:
                return "This document doesn't have enough resume-like content."
        else:
            if confidence > 0.8:
                return "Excellent! This looks like a comprehensive resume."
            elif confidence > 0.6:
                return "Good! This appears to be a valid resume."
            else:
                return "This looks like a resume, but could be more detailed."

    def _generate_suggestions(self, has_contact: bool, has_experience: bool, 
                           has_education: bool, has_skills: bool) -> list:
        """Generate suggestions for improving the resume"""
        suggestions = []
        
        if not has_contact:
            suggestions.append("Add your contact information (email, phone number)")
        
        if not has_experience:
            suggestions.append("Include your work experience and job responsibilities")
        
        if not has_education:
            suggestions.append("Add your educational background and qualifications")
        
        if not has_skills:
            suggestions.append("List your technical skills and competencies")
        
        if len(suggestions) == 0:
            suggestions.append("Your resume looks good! Consider adding more specific achievements and metrics.")
        
        return suggestions