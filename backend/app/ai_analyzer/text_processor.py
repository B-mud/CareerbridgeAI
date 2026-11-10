import re
import nltk
from typing import List, Dict
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

class TextProcessor:
    def __init__(self):
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
        
        # Load spaCy model (fallback to basic if not available)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Warning: spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        self.tfidf = TfidfVectorizer(max_features=1000, stop_words='english')

    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s\-\+\#\.]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip().lower()

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities using spaCy"""
        if not self.nlp:
            return {"skills": [], "organizations": [], "technologies": []}
        
        doc = self.nlp(text)
        entities = {
            "skills": [],
            "organizations": [],
            "technologies": []
        }
        
        for ent in doc.ents:
            if ent.label_ in ["ORG"]:
                entities["organizations"].append(ent.text)
            elif ent.label_ in ["PRODUCT", "EVENT"]:
                entities["technologies"].append(ent.text)
        
        return entities

    def extract_technical_terms(self, text: str) -> List[str]:
        """Extract technical terms using patterns and NLP"""
        technical_patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms (SQL, API, etc.)
            r'\b\w+\.(js|py|java|cpp|cs|php|rb|go)\b',  # File extensions
            r'\b\w+[-_]\w+\b',  # Hyphenated/underscore terms
            r'\b[A-Z][a-z]+[A-Z][a-z]*\b',  # CamelCase
        ]
        
        terms = []
        for pattern in technical_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            terms.extend(matches)
        
        return list(set(terms))

    def get_tfidf_keywords(self, text: str, top_n: int = 20) -> List[str]:
        """Extract keywords using TF-IDF"""
        try:
            # Fit and transform the text
            tfidf_matrix = self.tfidf.fit_transform([text])
            feature_names = self.tfidf.get_feature_names_out()
            
            # Get TF-IDF scores
            scores = tfidf_matrix.toarray()[0]
            
            # Get top keywords
            top_indices = np.argsort(scores)[-top_n:][::-1]
            keywords = [feature_names[i] for i in top_indices if scores[i] > 0]
            
            return keywords
        except Exception:
            return []

    def extract_experience_years(self, text: str) -> int:
        """Extract years of experience from text"""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?experience',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
            r'experience\s*(?:of\s*)?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s*in\s*\w+',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                return max(int(match) for match in matches)
        
        return 0
    
    def extract_contact_info(self, text: str) -> dict:
        """Extract contact information from resume"""
        contact = {}
        
        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact['email'] = emails[0]
        
        # Phone extraction
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                contact['phone'] = phones[0]
                break
        
        # LinkedIn extraction
        linkedin_pattern = r'linkedin\.com/in/([\w-]+)'
        linkedin = re.search(linkedin_pattern, text.lower())
        if linkedin:
            contact['linkedin'] = f"linkedin.com/in/{linkedin.group(1)}"
        
        return contact
    
    def extract_work_experience(self, text: str) -> list:
        """Extract work experience details"""
        experiences = []
        
        # Look for job titles and companies
        job_patterns = [
            r'(software engineer|developer|analyst|manager|intern)\s*(?:at|@)\s*([\w\s&.,]+)',
            r'([\w\s]+)\s*(?:at|@)\s*(\w+(?:\s+\w+)*)',
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:3]:  # Limit to 3 experiences
                if len(match) == 2:
                    title, company = match
                    experiences.append({
                        'title': title.strip(),
                        'company': company.strip()
                    })
        
        return experiences
    
    def extract_education_details(self, text: str) -> dict:
        """Extract detailed education information"""
        education = {
            'level': self.extract_education_level(text),
            'institutions': [],
            'degrees': []
        }
        
        # Extract institutions
        institution_patterns = [
            r'(university|college|institute)\s+of\s+([\w\s]+)',
            r'([\w\s]+)\s+(university|college|institute)',
        ]
        
        for pattern in institution_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:2]:  # Limit to 2 institutions
                institution = ' '.join(match).strip()
                if len(institution) > 5:  # Filter out short matches
                    education['institutions'].append(institution)
        
        # Extract degrees
        degree_patterns = [
            r'(bachelor|master|phd|doctorate)\s*(?:of|in|degree)?\s*([\w\s]+)',
            r'(b\.?s\.?|m\.?s\.?|ph\.?d\.?)\s*(?:in)?\s*([\w\s]+)',
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:2]:  # Limit to 2 degrees
                degree = ' '.join(match).strip()
                if len(degree) > 3:
                    education['degrees'].append(degree)
        
        return education
    
    def extract_projects(self, text: str) -> list:
        """Extract project information"""
        projects = []
        
        # Look for project indicators
        project_patterns = [
            r'project[s]?[:\-]?\s*([^\n.]{10,100})',
            r'built\s+([^\n.]{10,80})',
            r'developed\s+([^\n.]{10,80})',
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches[:3]:  # Limit to 3 projects
                project = match.strip()
                if len(project) > 10:
                    projects.append(project)
        
        return projects

    def extract_education_level(self, text: str) -> str:
        """Extract education level from text"""
        education_keywords = {
            "phd": ["phd", "ph.d", "doctorate", "doctoral"],
            "masters": ["masters", "master's", "msc", "m.sc", "mba", "m.b.a"],
            "bachelors": ["bachelors", "bachelor's", "bsc", "b.sc", "ba", "b.a", "be", "b.e"],
            "diploma": ["diploma", "certificate", "certification"]
        }
        
        text_lower = text.lower()
        for level, keywords in education_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return level
        
        return "unknown"
    
    def extract_name(self, text: str) -> str:
        """Extract candidate name from resume"""
        lines = text.split('\n')[:5]  # Check first 5 lines
        
        for line in lines:
            line = line.strip()
            # Look for name patterns (2-3 words, proper case)
            if re.match(r'^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$', line):
                # Exclude common resume headers
                if not any(word.lower() in line.lower() for word in ['resume', 'cv', 'curriculum', 'profile']):
                    return line
        
        return "Candidate"