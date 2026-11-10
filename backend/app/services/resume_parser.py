import PyPDF2
from docx import Document
import re
from typing import List, Dict
import os
from .ai_resume_analyzer import AIResumeAnalyzer, RecommendationScraper
from .resume_validator import ResumeValidator

class ResumeParser:
    def __init__(self):
        # Initialize enhanced AI-powered analyzers
        try:
            self.ai_analyzer = AIResumeAnalyzer()
            self.recommender = RecommendationScraper()
            self.validator = ResumeValidator()
            self.use_ai = True
            print("Enhanced AI analyzers initialized successfully")
        except Exception as e:
            print(f"Warning: AI analyzers failed to initialize: {e}")
            print("Falling back to keyword-based analysis")
            self.use_ai = False
            self._init_fallback_data()
            self.validator = ResumeValidator()
    
    def _init_fallback_data(self):
        """Initialize fallback keyword-based data"""
        self.skill_keywords = {
            "programming": ["python", "javascript", "java", "c++", "react", "node.js", "typescript"],
            "databases": ["sql", "mysql", "postgresql", "mongodb", "redis"],
            "cloud": ["aws", "azure", "gcp", "docker", "kubernetes"],
            "tools": ["git", "jenkins", "ci/cd", "linux", "bash"]
        }
        
        self.role_requirements = {
            "software_engineer": ["python", "javascript", "git", "sql", "react"],
            "data_scientist": ["python", "sql", "machine learning", "pandas", "numpy"],
            "devops": ["docker", "kubernetes", "aws", "ci/cd", "linux"]
        }

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")

    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error reading DOCX: {str(e)}")

    def extract_text(self, file_path: str) -> str:
        """Extract text based on file extension"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif file_extension == '.docx':
            return self.extract_text_from_docx(file_path)
        else:
            raise Exception("Unsupported file format")

    def detect_skills(self, text: str) -> Dict:
        """Detect skills using enhanced AI or fallback to keywords"""
        if self.use_ai:
            skill_analysis = self.ai_analyzer.extract_skills_with_context(text)
            experience_level, years = self.ai_analyzer.extract_experience_level(text)
            
            return {
                "detected_skills": list(skill_analysis["skills"].keys()),
                "skill_scores": skill_analysis["skills"],
                "skill_contexts": skill_analysis["contexts"],
                "experience_years": years,
                "experience_level": experience_level,
                "total_skills_found": skill_analysis["total_skills"]
            }
        else:
            # Fallback keyword detection
            text_lower = text.lower()
            detected_skills = []
            
            for category, skills in self.skill_keywords.items():
                for skill in skills:
                    if skill.lower() in text_lower:
                        detected_skills.append(skill)
            
            detected_skills = list(set(detected_skills))
            skill_scores = {skill: 1 for skill in detected_skills}  # Remove percentage scoring
            
            return {
                "detected_skills": detected_skills,
                "skill_scores": skill_scores,
                "experience_years": 0,
                "experience_level": "intermediate"
            }

    def get_missing_skills(self, detected_skills: List[str], skill_scores: Dict[str, int], target_role: str = "software_engineer") -> Dict:
        """Get missing skills and comprehensive gap analysis"""
        if self.use_ai:
            gap_analysis = self.ai_analyzer.analyze_skill_gaps(skill_scores, target_role)
            return gap_analysis
        else:
            # Fallback simple analysis
            required_skills = self.role_requirements.get(target_role, [])
            detected_lower = [skill.lower() for skill in detected_skills]
            
            missing_skills = []
            for skill in required_skills:
                if skill.lower() not in detected_lower:
                    missing_skills.append(skill)
            
            return {
                "missing_skills": missing_skills,
                "overall_match_score": 50,
                "recommendations": [f"Learn {skill}" for skill in missing_skills[:3]]
            }

    def analyze_resume(self, file_path: str, target_role: str = "software_engineer") -> Dict:
        """Complete AI-powered resume analysis with validation"""
        try:
            # Extract text
            text = self.extract_text(file_path)
            
            # Validate if it's actually a resume
            validation_result = self.validator.validate_resume(text)
            
            if not validation_result["is_valid_resume"]:
                return {
                    "is_valid_resume": False,
                    "validation": validation_result,
                    "detected_skills": [],
                    "missing_skills": [],
                    "skill_scores": {},
                    "recommendations": validation_result["suggestions"],
                    "extracted_text": text[:500],
                    "text_length": len(text),
                    "analysis_method": "validation_failed"
                }
            
            # Extract detailed personal and professional information
            personal_info = self._extract_personal_info(text)
            experience_info = self._extract_work_experience(text)
            education_info = self._extract_education_details(text)
            projects_info = self._extract_projects(text)
            
            # Enhanced AI-powered skill detection
            skill_analysis = self.detect_skills(text)
            detected_skills = skill_analysis["detected_skills"]
            skill_scores = skill_analysis["skill_scores"]
            experience_years = skill_analysis.get("experience_years", 0)
            experience_level = skill_analysis.get("experience_level", "intermediate")
            
            # Enhanced skill detection based on document type
            enhanced_skills = self._enhance_skill_detection(text, detected_skills, target_role)
            
            # AI-powered comprehensive gap analysis
            gap_analysis = self.get_missing_skills(detected_skills, skill_scores, target_role)
            
            # Generate personalized recommendations
            if self.use_ai:
                recommendations_data = self.ai_analyzer.generate_personalized_recommendations(
                    skill_analysis, gap_analysis, experience_level
                )
                recommendations = [rec["action"] for rec in recommendations_data]
                missing_skills = gap_analysis.get("core_skills_match", {}).get("missing", []) + \
                               gap_analysis.get("trending_skills_match", {}).get("missing", [])
                
                # Generate market insights
                market_insights = self.ai_analyzer.generate_market_insights(skill_scores, target_role)
                
                # Get learning resources
                leetcode_problems = self.recommender.get_leetcode_problems(enhanced_skills)
                course_recommendations = self.recommender.get_course_recommendations(enhanced_skills)
            else:
                recommendations = gap_analysis.get("recommendations", [])
                missing_skills = gap_analysis.get("missing_skills", [])
                market_insights = {}
                leetcode_problems = []
                course_recommendations = []
            
            return {
                "is_valid_resume": True,
                "validation": validation_result,
                "detected_skills": enhanced_skills,
                "missing_skills": missing_skills,
                "skill_scores": skill_scores,
                "recommendations": recommendations,
                "extracted_text": text[:1000],
                "text_length": len(text),
                "personal_info": personal_info,
                "experience": experience_info,
                "education": education_info,
                "projects": projects_info,
                "ai_analysis": {
                    "experience_years": experience_years,
                    "experience_level": experience_level,
                    "skill_contexts": skill_analysis.get("skill_contexts", {}),
                    "overall_match_score": gap_analysis.get("overall_match_score", 0),
                    "market_insights": market_insights,
                    "gap_analysis": gap_analysis
                },
                "learning_resources": {
                    "leetcode_problems": leetcode_problems,
                    "courses": course_recommendations,
                    "personalized_recommendations": recommendations_data if self.use_ai else []
                },
                "analysis_method": "ai" if self.use_ai else "keyword"
            }
            
        except Exception as e:
            raise Exception(f"Resume analysis failed: {str(e)}")
    
    def _enhance_skill_detection(self, text: str, detected_skills: List[str], target_role: str) -> List[str]:
        """Enhance skill detection with context-aware analysis"""
        enhanced_skills = detected_skills.copy()
        text_lower = text.lower()
        
        # Advanced pattern matching for skills
        skill_patterns = {
            "software_engineer": {
                "web": ["html", "css", "javascript", "react", "vue", "angular", "node.js"],
                "backend": ["python", "java", "c#", "php", "ruby", "go", "rust"],
                "database": ["sql", "mysql", "postgresql", "mongodb", "redis"],
                "devops": ["docker", "kubernetes", "aws", "azure", "jenkins", "ci/cd"]
            },
            "data_scientist": {
                "analysis": ["python", "r", "sql", "pandas", "numpy", "scipy"],
                "ml": ["machine learning", "tensorflow", "pytorch", "scikit-learn"],
                "viz": ["matplotlib", "seaborn", "tableau", "power bi", "plotly"]
            },
            "frontend_developer": {
                "core": ["html", "css", "javascript", "typescript"],
                "frameworks": ["react", "vue", "angular", "svelte"],
                "tools": ["webpack", "vite", "sass", "tailwind"]
            }
        }
        
        # Context-aware detection
        if target_role in skill_patterns:
            for category, skills in skill_patterns[target_role].items():
                for skill in skills:
                    # Look for skill mentions in context
                    contexts = [
                        f"experience with {skill}",
                        f"proficient in {skill}",
                        f"using {skill}",
                        f"{skill} development",
                        skill
                    ]
                    
                    for context in contexts:
                        if context in text_lower and skill.lower() not in [s.lower() for s in enhanced_skills]:
                            enhanced_skills.append(skill.title())
                            break
        
        # Remove duplicates while preserving order
        seen = set()
        unique_skills = []
        for skill in enhanced_skills:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                unique_skills.append(skill)
        
        return unique_skills

    def _generate_recommendations(self, missing_skills: List[str]) -> List[str]:
        """Fallback recommendation generation"""
        recommendations = []
        
        for skill in missing_skills[:3]:
            if skill.lower() in ["python", "javascript", "java"]:
                recommendations.append(f"Complete a {skill} fundamentals course")
            elif skill.lower() in ["react", "node.js", "typescript"]:
                recommendations.append(f"Build a project using {skill}")
            elif skill.lower() in ["aws", "docker", "kubernetes"]:
                recommendations.append(f"Get certified in {skill}")
            else:
                recommendations.append(f"Learn {skill} through online tutorials")
        
        return recommendations
    
    def _personalize_recommendations(self, recommendations: List[str], experience_years: int, 
                                   skills: List[str], target_role: str) -> List[str]:
        """Personalize recommendations based on experience and current skills"""
        personalized = recommendations.copy()
        
        # Add experience-based recommendations
        if experience_years == 0:
            personalized.insert(0, "Build a portfolio with 2-3 projects to showcase your skills")
        elif experience_years < 2:
            personalized.insert(0, "Focus on gaining hands-on experience with real projects")
        elif experience_years >= 5:
            personalized.insert(0, "Consider leadership roles and mentoring opportunities")
        
        # Add role-specific advanced recommendations
        advanced_skills = {
            "software_engineer": ["system design", "microservices", "cloud architecture"],
            "data_scientist": ["deep learning", "mlops", "big data processing"],
            "frontend_developer": ["performance optimization", "accessibility", "testing"]
        }
        
        if target_role in advanced_skills and len(skills) > 5:
            for adv_skill in advanced_skills[target_role][:1]:
                if adv_skill not in [s.lower() for s in skills]:
                    personalized.append(f"Advance your career by learning {adv_skill}")
        
        return personalized[:6]  # Limit to 6 recommendations
    
    def _extract_personal_info(self, text: str) -> dict:
        """Extract personal information from resume - Enhanced for better name detection"""
        personal = {}
        
        # Extract name with multiple patterns
        lines = text.split('\n')[:8]  # Check more lines
        name_patterns = [
            r'^([A-Z][a-z]+\s+[A-Z](?:\s+[A-Z])?[a-z]*)$',  # Jagadeesh A
            r'^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$',  # Full names
            r'^([A-Z][A-Z\s]+)$',  # ALL CAPS names
            r'^([A-Z][a-z]+\s[A-Z][a-z]+)$'  # Simple First Last
        ]
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
                
            # Skip lines with common resume keywords
            skip_words = ['resume', 'cv', 'curriculum', 'professional', 'summary', 'contact', 'email', 'phone', 'address', 'linkedin']
            if any(word in line.lower() for word in skip_words):
                continue
            
            # Try each name pattern
            for pattern in name_patterns:
                match = re.match(pattern, line)
                if match:
                    potential_name = match.group(1).strip()
                    # Additional validation
                    if (len(potential_name.split()) >= 2 and 
                        not any(char.isdigit() for char in potential_name) and
                        not '@' in potential_name):
                        personal['name'] = potential_name
                        break
            
            if 'name' in personal:
                break
        
        # Fallback: look for name patterns anywhere in first few lines
        if 'name' not in personal:
            first_section = '\n'.join(lines)
            # Look for patterns like "Name: John Doe" or just standalone names
            name_fallback_patterns = [
                r'([A-Z][a-z]+\s+[A-Z]\s*[a-z]*)',  # Jagadeesh A pattern
                r'([A-Z][a-z]+\s+[A-Z][a-z]+)',     # Standard First Last
            ]
            
            for pattern in name_fallback_patterns:
                matches = re.findall(pattern, first_section)
                for match in matches:
                    if (len(match.split()) >= 2 and 
                        not any(word in match.lower() for word in skip_words) and
                        not any(char.isdigit() for char in match)):
                        personal['name'] = match.strip()
                        break
                if 'name' in personal:
                    break
        
        if 'name' not in personal:
            personal['name'] = "Candidate"
        
        # Extract contact info with better patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            personal['email'] = emails[0]
        
        # Enhanced phone pattern for Indian numbers
        phone_patterns = [
            r'\+91[\s-]?\d{10}',  # Indian format +91-9941612791
            r'\+\d{1,3}[\s-]?\d{10}',  # International format
            r'\d{10}',  # 10 digit number
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'  # US format
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                personal['phone'] = phones[0]
                break
        
        # Extract location
        location_patterns = [
            r'([A-Z][a-z]+,\s*[A-Z][a-z]+)',  # Chennai, India
            r'([A-Z][a-z]+\s*,\s*[A-Z][a-z]+)',  # City, Country
        ]
        for pattern in location_patterns:
            locations = re.findall(pattern, text)
            if locations:
                personal['location'] = locations[0]
                break
        
        linkedin_pattern = r'linkedin\.com/in/([\w-]+)'
        linkedin = re.search(linkedin_pattern, text.lower())
        if linkedin:
            personal['linkedin'] = f"linkedin.com/in/{linkedin.group(1)}"
        
        return personal
    
    def _extract_work_experience(self, text: str) -> list:
        """Extract work experience details"""
        experiences = []
        
        job_patterns = [
            r'(software engineer|developer|analyst|manager|intern|consultant)\s*(?:at|@)\s*([\w\s&.,]+)',
            r'([\w\s]+engineer|[\w\s]+developer|[\w\s]+analyst)\s*(?:at|@)\s*(\w+(?:\s+\w+)*)',
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:3]:
                if len(match) == 2:
                    title, company = match
                    title = title.strip()
                    company = company.strip()
                    if len(title) > 2 and len(company) > 2:
                        experiences.append({
                            'title': title,
                            'company': company
                        })
        
        return experiences
    
    def _extract_education_details(self, text: str) -> dict:
        """Extract education information with NLP context-aware detection"""
        education = {
            'level': 'Not specified',
            'institutions': [],
            'degrees': [],
            'year': None,
            'grade': None
        }
        
        # Enhanced education level detection with better patterns
        education_keywords = {
            "PhD": ["phd", "ph.d", "ph d", "doctorate", "doctoral"],
            "Master's": ["masters", "master's", "master of", "msc", "m.sc", "m sc", "mba", "m.b.a", "m tech", "m.tech", "m.e", "me"],
            "Bachelor's": ["bachelors", "bachelor's", "bachelor of", "bsc", "b.sc", "b sc", "ba", "b.a", "b a", "be", "b.e", "b e", "b.tech", "b tech", "btech"],
            "HSC (12th)": ["hsc", "h.s.c", "12th", "twelfth", "higher secondary", "intermediate", "plus two", "+2", "class 12", "class xii", "12th grade"],
            "SSLC (10th)": ["sslc", "s.s.l.c", "10th", "tenth", "secondary", "matriculation", "class 10", "class x", "10th grade"],
            "Diploma": ["diploma", "polytechnic", "certificate", "certification"]
        }
        
        text_lower = text.lower()
        
        # Find highest education level with word boundaries
        education_hierarchy = ["PhD", "Master's", "Bachelor's", "Diploma", "HSC (12th)", "SSLC (10th)"]
        for level in education_hierarchy:
            for keyword in education_keywords[level]:
                # Use word boundaries for better matching
                if re.search(rf'\b{re.escape(keyword)}\b', text_lower):
                    education['level'] = level
                    break
            if education['level'] != 'Not specified':
                break
        
        # Context-aware institution detection using NLP
        # Define education context indicators (words appearing near actual institutions)
        education_context_indicators = [
            'studying', 'pursuing', 'graduated', 'degree', 'major', 'enrolled',
            'attending', 'student', 'admitted', 'bachelor', 'master', 'phd',
            'btech', 'bsc', 'msc', 'mba', 'education', 'qualification',
            'academic', 'cgpa', 'gpa', 'percentage', 'marks', 'grade'
        ]
        
        # Define event context indicators (words appearing near event locations, NOT institutions)
        event_context_indicators = [
            'hackathon', 'competition', 'contest', 'won', 'winner', 'prize',
            'participated', 'event', 'organized', 'hosted', 'conducted',
            'championship', 'tournament', 'coding competition', 'held at'
        ]
        
        # Extract institutions with context-aware NLP analysis
        institution_patterns = [
            # Exact institution name patterns
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\s+(University|College|Institute|Academy)',
            r'(University|College|Institute|Academy)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(Engineering|Technology|Science|Arts)\s+(College|Institute)',
            r'(Government|Govt\.?|State|Central)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(College|Institute|University)',
            r'\b([A-Z]{2,5})\s+(?:University|College|Institute)',
            r'(IIT|NIT|IIIT|IIM|BITS|VIT|SRM|Amrita|Manipal|Anna|Osmania|Delhi|Mumbai|Pune)\s+(?:University|Institute|College)?',
            r'(?:from|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\s+(?:University|College|Institute)',
        ]
        
        institutions_found = []
        for pattern in institution_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get the institution name
                if isinstance(match.groups(), tuple) and len(match.groups()) > 0:
                    parts = [part.strip() for part in match.groups() if part and part.strip()]
                    institution = ' '.join(parts)
                else:
                    institution = match.group(0).strip()
                
                # Clean up institution name
                institution = re.sub(r'\s+', ' ', institution)
                institution = re.sub(r'^(the|a)\s+', '', institution, flags=re.IGNORECASE)
                institution = institution.strip('.,;:-')
                
                # Get surrounding context (100 characters before and after)
                start_pos = max(0, match.start() - 100)
                end_pos = min(len(text), match.end() + 100)
                context = text[start_pos:end_pos].lower()
                
                # NLP Context Analysis: Count education vs event indicators
                education_score = sum(1 for indicator in education_context_indicators if indicator in context)
                event_score = sum(1 for indicator in event_context_indicators if indicator in context)
                
                # Store with context scores
                institutions_found.append({
                    'name': institution,
                    'education_score': education_score,
                    'event_score': event_score,
                    'match_position': match.start()
                })
        
        # Filter institutions using NLP context scoring
        for inst_data in institutions_found:
            institution = inst_data['name']
            education_score = inst_data['education_score']
            event_score = inst_data['event_score']
            
            # Skip if it's clearly an event location (higher event score)
            if event_score > education_score:
                continue  # Skip this - it's likely a hackathon/event venue
            
            # Skip if no education context at all
            if education_score == 0 and event_score > 0:
                continue
            
            # Validation rules
            skip_words = [
                'section', 'details', 'experience', 'skills', 'projects', 
                'summary', 'objective', 'personal', 'profile', 'professional', 
                'accuracy', 'include', 'certificate', 'training'
            ]
            
            required_indicators = ['college', 'university', 'institute', 'school', 'academy', 'iit', 'nit', 'iiit', 'iim']
            
            institution_lower = institution.lower()
            has_skip_word = any(skip in institution_lower for skip in skip_words)
            has_required = any(indicator in institution_lower for indicator in required_indicators)
            is_too_short = len(institution) < 5
            is_too_long = len(institution) > 80
            is_duplicate = institution_lower in [inst.lower() for inst in education['institutions']]
            
            # Only add if valid education institution
            if (not has_skip_word and 
                has_required and 
                not is_too_short and 
                not is_too_long and 
                not is_duplicate):
                education['institutions'].append(institution)
                
            if len(education['institutions']) >= 3:
                break
        
        # Extract graduation years
        year_patterns = [
            r'(19|20)\d{2}',  # Years like 2023, 1995
            r'graduated\s+in\s+(19|20)\d{2}',
            r'passing\s+year[:\s]*(19|20)\d{2}'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, text)
            if matches:
                # Get the most recent year
                years = [int(''.join(match) if isinstance(match, tuple) else match) for match in matches]
                education['year'] = max(years)
                break
        
        return education
    
    def _extract_projects(self, text: str) -> list:
        """Extract project information"""
        projects = []
        
        project_patterns = [
            r'project[s]?[:\-]?\s*([^\n.]{10,100})',
            r'built\s+([^\n.]{10,80})',
            r'developed\s+([^\n.]{10,80})',
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:3]:
                project = match.strip()
                if len(project) > 10:
                    projects.append(project)
        
        return projects
    
    def analyze_resume_text(self, text: str, target_role: str = "software_engineer") -> Dict:
        """Analyze resume text directly without file"""
        try:
            # Validate if it's actually a resume
            validation_result = self.validator.validate_resume(text)
            
            if not validation_result["is_valid_resume"]:
                return {
                    "is_valid_resume": False,
                    "validation": validation_result,
                    "detected_skills": [],
                    "missing_skills": [],
                    "skill_scores": {},
                    "recommendations": validation_result["suggestions"],
                    "extracted_text": text[:500],
                    "analysis_method": "validation_failed"
                }
            
            # Extract detailed information
            personal_info = self._extract_personal_info(text)
            experience_info = self._extract_work_experience(text)
            education_info = self._extract_education_details(text)
            projects_info = self._extract_projects(text)
            
            # Enhanced skill detection
            skill_analysis = self.detect_skills(text)
            detected_skills = skill_analysis["detected_skills"]
            skill_scores = skill_analysis["skill_scores"]
            experience_years = skill_analysis.get("experience_years", 0)
            experience_level = skill_analysis.get("experience_level", "intermediate")
            
            # Enhanced skill detection
            enhanced_skills = self._enhance_skill_detection(text, detected_skills, target_role)
            
            # Gap analysis
            gap_analysis = self.get_missing_skills(detected_skills, skill_scores, target_role)
            
            # Generate recommendations
            if self.use_ai:
                recommendations_data = self.ai_analyzer.generate_personalized_recommendations(
                    skill_analysis, gap_analysis, experience_level
                )
                recommendations = [rec["action"] for rec in recommendations_data]
                missing_skills = gap_analysis.get("core_skills_match", {}).get("missing", []) + \
                               gap_analysis.get("trending_skills_match", {}).get("missing", [])
                
                market_insights = self.ai_analyzer.generate_market_insights(skill_scores, target_role)
                leetcode_problems = self.recommender.get_leetcode_problems(enhanced_skills)
                course_recommendations = self.recommender.get_course_recommendations(enhanced_skills)
            else:
                recommendations = gap_analysis.get("recommendations", [])
                missing_skills = gap_analysis.get("missing_skills", [])
                market_insights = {}
                leetcode_problems = []
                course_recommendations = []
            
            return {
                "is_valid_resume": True,
                "validation": validation_result,
                "detected_skills": enhanced_skills,
                "missing_skills": missing_skills,
                "skill_scores": skill_scores,
                "recommendations": recommendations,
                "extracted_text": text[:1000],
                "personal_info": personal_info,
                "experience": experience_info,
                "education": education_info,
                "projects": projects_info,
                "ai_analysis": {
                    "experience_years": experience_years,
                    "experience_level": experience_level,
                    "skill_contexts": skill_analysis.get("skill_contexts", {}),
                    "overall_match_score": gap_analysis.get("overall_match_score", 0),
                    "market_insights": market_insights,
                    "gap_analysis": gap_analysis
                },
                "learning_resources": {
                    "leetcode_problems": leetcode_problems,
                    "courses": course_recommendations,
                    "personalized_recommendations": recommendations_data if self.use_ai else []
                },
                "analysis_method": "ai" if self.use_ai else "keyword"
            }
            
        except Exception as e:
            raise Exception(f"Text analysis failed: {str(e)}")