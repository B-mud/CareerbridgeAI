import json
import os
import re
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .text_processor import TextProcessor

class AISkillExtractor:
    def __init__(self):
        self.text_processor = TextProcessor()
        self.skill_database = self._load_skill_database()
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=5000)
        self._train_skill_vectors()

    def _load_skill_database(self) -> Dict:
        """Load comprehensive skill database"""
        return {
            "programming_languages": [
                "python", "javascript", "java", "c++", "c#", "typescript", "go", "rust", 
                "php", "ruby", "swift", "kotlin", "scala", "r", "matlab", "perl"
            ],
            "web_frameworks": [
                "react", "angular", "vue.js", "node.js", "express", "django", "flask", 
                "spring", "laravel", "rails", "asp.net", "next.js", "nuxt.js"
            ],
            "databases": [
                "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
                "oracle", "sql server", "sqlite", "dynamodb", "neo4j", "influxdb"
            ],
            "cloud_platforms": [
                "aws", "azure", "google cloud", "gcp", "heroku", "digitalocean",
                "linode", "cloudflare", "vercel", "netlify"
            ],
            "devops_tools": [
                "docker", "kubernetes", "jenkins", "gitlab ci", "github actions",
                "terraform", "ansible", "chef", "puppet", "vagrant", "ci/cd"
            ],
            "data_science": [
                "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
                "pandas", "numpy", "matplotlib", "seaborn", "jupyter", "spark", "hadoop"
            ],
            "mobile_development": [
                "react native", "flutter", "ionic", "xamarin", "android", "ios",
                "swift", "kotlin", "objective-c"
            ],
            "version_control": [
                "git", "github", "gitlab", "bitbucket", "svn", "mercurial"
            ],
            "testing": [
                "unit testing", "integration testing", "selenium", "jest", "pytest",
                "junit", "cypress", "mocha", "chai", "test driven development", "tdd"
            ],
            "soft_skills": [
                "leadership", "communication", "teamwork", "problem solving",
                "project management", "agile", "scrum", "kanban", "mentoring"
            ]
        }

    def _train_skill_vectors(self):
        """Train TF-IDF vectors for skill matching"""
        all_skills = []
        for category, skills in self.skill_database.items():
            all_skills.extend(skills)
        
        # Create skill contexts for better matching
        skill_contexts = []
        for skill in all_skills:
            # Add variations and contexts
            contexts = [
                skill,
                skill.replace(" ", ""),
                skill.replace("-", " "),
                f"experience with {skill}",
                f"proficient in {skill}",
                f"skilled in {skill}"
            ]
            skill_contexts.extend(contexts)
        
        try:
            if len(skill_contexts) > 0:
                self.vectorizer.fit(skill_contexts)
                self.skill_vectors = self.vectorizer.transform(all_skills)
                self.all_skills = all_skills
            else:
                self.skill_vectors = None
                self.all_skills = []
        except Exception as e:
            print(f"Warning: Could not train skill vectors: {e}")
            self.skill_vectors = None
            self.all_skills = []

    def extract_skills_ai(self, text: str) -> Dict[str, any]:
        """Extract skills using AI/ML techniques"""
        try:
            # Clean and process text
            cleaned_text = self.text_processor.clean_text(text)
            
            # Extract using multiple methods
            keyword_skills = self._extract_keyword_skills(cleaned_text)
            semantic_skills = self._extract_semantic_skills(cleaned_text)
            context_skills = self._extract_contextual_skills(text)
            
            # Combine and score skills
            all_detected = set(keyword_skills + semantic_skills + context_skills)
            
            # Calculate confidence scores
            skill_scores = {}
            for skill in all_detected:
                score = self._calculate_skill_confidence(skill, text)
                if score > 0.3:  # Threshold for inclusion
                    skill_scores[skill] = min(int(score * 100), 99)
            
            # Categorize skills
            categorized_skills = self._categorize_skills(list(skill_scores.keys()))
            
            # Extract additional metadata
            experience_years = self.text_processor.extract_experience_years(text)
            education_level = self.text_processor.extract_education_level(text)
            
            return {
                "detected_skills": list(skill_scores.keys()),
                "skill_scores": skill_scores,
                "categorized_skills": categorized_skills,
                "experience_years": experience_years,
                "education_level": education_level,
                "confidence_threshold": 0.3
            }
        except Exception as e:
            print(f"AI extraction error: {e}")
            # Fallback to basic keyword extraction
            return self._fallback_extraction(text)
    
    def _fallback_extraction(self, text: str) -> Dict[str, any]:
        """Fallback extraction method"""
        keyword_skills = self._extract_keyword_skills(text.lower())
        skill_scores = {skill: 75 for skill in keyword_skills}
        
        return {
            "detected_skills": keyword_skills,
            "skill_scores": skill_scores,
            "categorized_skills": self._categorize_skills(keyword_skills),
            "experience_years": 0,
            "education_level": "unknown",
            "confidence_threshold": 0.3
        }

    def _extract_keyword_skills(self, text: str) -> List[str]:
        """Extract skills using keyword matching with fuzzy logic"""
        detected = []
        text_words = set(text.split())
        
        for category, skills in self.skill_database.items():
            for skill in skills:
                skill_words = skill.lower().split()
                
                # Exact match
                if skill.lower() in text.lower():
                    detected.append(skill)
                # Partial match for multi-word skills
                elif len(skill_words) > 1 and all(word in text_words for word in skill_words):
                    detected.append(skill)
                # Fuzzy match for similar terms
                elif any(self._fuzzy_match(word, skill.lower()) for word in text_words):
                    detected.append(skill)
        
        return detected

    def _extract_semantic_skills(self, text: str) -> List[str]:
        """Extract skills using semantic similarity"""
        if self.skill_vectors is None:
            return []
        
        try:
            # Transform input text
            text_vector = self.vectorizer.transform([text])
            
            # Calculate similarities
            similarities = cosine_similarity(text_vector, self.skill_vectors)[0]
            
            # Get skills above threshold
            threshold = 0.2
            detected_skills = []
            for i, similarity in enumerate(similarities):
                if float(similarity) > threshold:
                    detected_skills.append(self.all_skills[i])
            
            return detected_skills
        except Exception as e:
            print(f"Semantic analysis error: {e}")
            return []

    def _extract_contextual_skills(self, text: str) -> List[str]:
        """Extract skills using contextual patterns"""
        try:
            patterns = [
                r'(?:experience|skilled|proficient|expert)\s+(?:in|with|at)\s+([^,.]+)',
                r'(?:knowledge|understanding)\s+of\s+([^,.]+)',
                r'(?:worked|working)\s+with\s+([^,.]+)',
                r'(?:using|utilized|implemented)\s+([^,.]+)',
                r'(?:familiar|comfortable)\s+with\s+([^,.]+)'
            ]
            
            detected = []
            for pattern in patterns:
                matches = re.findall(pattern, text.lower())
                for match in matches:
                    # Clean and validate the match
                    cleaned_match = match.strip()
                    if len(cleaned_match) < 20:  # Reasonable skill name length
                        # Check if it matches known skills
                        for category, skills in self.skill_database.items():
                            for skill in skills:
                                if skill.lower() in cleaned_match or cleaned_match in skill.lower():
                                    detected.append(skill)
            
            return detected
        except Exception as e:
            print(f"Contextual extraction error: {e}")
            return []

    def _calculate_skill_confidence(self, skill: str, text: str) -> float:
        """Calculate confidence score for a detected skill"""
        text_lower = text.lower()
        skill_lower = skill.lower()
        
        confidence = 0.0
        
        # Exact match bonus
        if skill_lower in text_lower:
            confidence += 0.5
        
        # Context bonus
        context_patterns = [
            f"experience with {skill_lower}",
            f"skilled in {skill_lower}",
            f"proficient in {skill_lower}",
            f"expert in {skill_lower}",
            f"years of {skill_lower}",
            f"using {skill_lower}",
            f"worked with {skill_lower}"
        ]
        
        for pattern in context_patterns:
            if pattern in text_lower:
                confidence += 0.3
                break
        
        # Frequency bonus
        frequency = text_lower.count(skill_lower)
        confidence += min(frequency * 0.1, 0.3)
        
        return min(confidence, 1.0)

    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize detected skills"""
        categorized = {}
        
        for category, category_skills in self.skill_database.items():
            categorized[category] = []
            for skill in skills:
                if skill.lower() in [s.lower() for s in category_skills]:
                    categorized[category].append(skill)
        
        return {k: v for k, v in categorized.items() if v}

    def _fuzzy_match(self, word1: str, word2: str, threshold: float = 0.8) -> bool:
        """Simple fuzzy matching for similar words"""
        if len(word1) < 3 or len(word2) < 3:
            return word1 == word2
        
        # Simple character overlap ratio
        common_chars = set(word1) & set(word2)
        total_chars = set(word1) | set(word2)
        
        if not total_chars:
            return False
        
        similarity = len(common_chars) / len(total_chars)
        return similarity >= threshold