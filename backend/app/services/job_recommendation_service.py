"""
Job Recommendation Engine
=========================
Algorithms used:
  1. TF-IDF Vectorization  – converts skill lists and job descriptions to vectors
  2. Cosine Similarity     – ranks jobs against user skill vector
  3. Content-Based Filtering – suggests jobs from user's current skill profile
  4. Priority Ranking      – sorts by match score DESC, then salary tier DESC

Live-job fetching strategy:
  - Primary  : JSearch API via RapidAPI (free tier, 10 req/s)
  - Fallback : curated dataset with real Naukri / LinkedIn /  apply-links
    (links are constructed with the job title + skill query so they always open
     a live, relevant search results page on that platform)
"""

import math
import re
import json
import logging
from typing import Dict, List, Optional
from pathlib import Path
try:
    import requests as _requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

from .tfidf_engine import TFIDFVectorizer, cosine_similarity, tokenize, skills_to_document, score_skill_match

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Curated Job Dataset
# (Each entry has: title, company, location, skills_required, description,
#  salary_range, experience_level, job_type, portals dict)
# ---------------------------------------------------------------------------

CURATED_JOBS: List[Dict] = [
    # ── SOFTWARE ENGINEERING ──────────────────────────────────────────────
    {
        "id": "j001", "title": "Software Engineer",
        "company": "Google", "location": "Bangalore / Remote",
        "skills_required": ["python", "java", "algorithms", "dsa", "system design", "sql", "git"],
        "description": "Build large-scale distributed systems, write clean code, and work on cutting-edge products used by billions.",
        "salary_range": "₹18–40 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 120,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Software+Engineer+Google",
            "naukri":   "https://www.naukri.com/software-engineer-jobs-in-bangalore",

        }
    },
    {
        "id": "j002", "title": "Full Stack Developer",
        "company": "Flipkart", "location": "Bangalore",
        "skills_required": ["javascript", "react", "nodejs", "sql", "restapi", "git", "html", "css"],
        "description": "Design and build scalable web applications, collaborate with cross-functional teams, and ship products to millions of users.",
        "salary_range": "₹12–28 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 80,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Full+Stack+Developer+Flipkart",
            "naukri":   "https://www.naukri.com/full-stack-developer-jobs",

        }
    },
    {
        "id": "j003", "title": "Backend Developer (Python)",
        "company": "Razorpay", "location": "Bangalore / Pune",
        "skills_required": ["python", "django", "restapi", "sql", "redis", "docker", "git"],
        "description": "Build payment infrastructure and APIs that process millions of transactions daily. Strong Python fundamentals required.",
        "salary_range": "₹10–22 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 45,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Backend+Developer+Python+Razorpay",
            "naukri":   "https://www.naukri.com/python-backend-developer-jobs",

        }
    },
    {
        "id": "j004", "title": "Java Developer",
        "company": "Infosys", "location": "Multiple Cities",
        "skills_required": ["java", "spring boot", "sql", "restapi", "microservices", "git"],
        "description": "Develop enterprise Java applications, work on Spring Boot microservices and REST APIs for banking and insurance clients.",
        "salary_range": "₹6–15 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 300,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Java+Developer+Infosys",
            "naukri":   "https://www.naukri.com/java-developer-jobs",

        }
    },
    # ── DATA / AI / ML ───────────────────────────────────────────────────
    {
        "id": "j005", "title": "Data Scientist",
        "company": "Amazon", "location": "Hyderabad / Bangalore",
        "skills_required": ["python", "machinelearning", "sql", "pandas", "numpy", "tensorflow", "statistics"],
        "description": "Build ML models that power Amazon's recommendation engine and logistics optimization.",
        "salary_range": "₹20–45 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 60,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Data+Scientist+Amazon",
            "naukri":   "https://www.naukri.com/data-scientist-jobs",

        }
    },
    {
        "id": "j006", "title": "Machine Learning Engineer",
        "company": "Microsoft", "location": "Hyderabad / Remote",
        "skills_required": ["python", "machinelearning", "deeplearning", "tensorflow", "pytorch", "docker", "git", "azure"],
        "description": "Develop, train, and deploy ML models at scale on Azure. Work on NLP, computer vision, and recommendation systems.",
        "salary_range": "₹22–50 LPA", "experience_level": "senior",
        "job_type": "Full-time", "openings": 35,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=ML+Engineer+Microsoft",
            "naukri":   "https://www.naukri.com/machine-learning-engineer-jobs",

        }
    },
    {
        "id": "j007", "title": "AI/ML Intern",
        "company": "Swiggy", "location": "Bangalore",
        "skills_required": ["python", "machinelearning", "pandas", "numpy", "sql"],
        "description": "6-month internship working on food recommendation and ETA prediction models. Great for freshers with ML fundamentals.",
        "salary_range": "₹30,000–60,000 /month", "experience_level": "fresher",
        "job_type": "Internship", "openings": 20,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=ML+Intern+Swiggy",
            "naukri":   "https://www.naukri.com/machine-learning-intern-jobs",

        }
    },
    {
        "id": "j008", "title": "Data Analyst",
        "company": "Zomato", "location": "Gurgaon / Remote",
        "skills_required": ["sql", "python", "pandas", "excel", "tableau", "statistics"],
        "description": "Analyse user behaviour data, build dashboards, and surface insights to product and marketing teams.",
        "salary_range": "₹6–14 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 55,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Data+Analyst+Zomato",
            "naukri":   "https://www.naukri.com/data-analyst-jobs",

        }
    },
    {
        "id": "j009", "title": "NLP Engineer",
        "company": "Sarvam AI", "location": "Bangalore / Remote",
        "skills_required": ["python", "nlp", "transformers", "pytorch", "machinelearning", "llm"],
        "description": "Build multilingual NLP pipelines and fine-tune large language models for Indian languages.",
        "salary_range": "₹18–35 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 15,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=NLP+Engineer",
            "naukri":   "https://www.naukri.com/nlp-engineer-jobs",

        }
    },
    # ── DEVOPS / CLOUD ───────────────────────────────────────────────────
    {
        "id": "j010", "title": "DevOps Engineer",
        "company": "Paytm", "location": "Noida / Bangalore",
        "skills_required": ["docker", "kubernetes", "cicd", "aws", "bash", "python", "git", "linux"],
        "description": "Manage CI/CD pipelines, container orchestration on Kubernetes, and cloud infrastructure on AWS.",
        "salary_range": "₹10–25 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 40,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=DevOps+Engineer+Paytm",
            "naukri":   "https://www.naukri.com/devops-engineer-jobs",

        }
    },
    {
        "id": "j011", "title": "Cloud Engineer (AWS)",
        "company": "Accenture", "location": "Multiple Cities",
        "skills_required": ["aws", "terraform", "docker", "python", "linux", "networking"],
        "description": "Design and maintain cloud infrastructure for enterprise clients. AWS certification is a plus.",
        "salary_range": "₹8–20 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 200,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=AWS+Cloud+Engineer+Accenture",
            "naukri":   "https://www.naukri.com/aws-cloud-engineer-jobs",

        }
    },
    # ── FRONTEND / UI ────────────────────────────────────────────────────
    {
        "id": "j012", "title": "React Developer",
        "company": "CRED", "location": "Bangalore",
        "skills_required": ["react", "javascript", "typescript", "css", "html", "restapi", "git"],
        "description": "Build pixel-perfect, performant UIs for CRED's fintech app. Strong React hooks and state management skills needed.",
        "salary_range": "₹12–24 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 25,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=React+Developer+CRED",
            "naukri":   "https://www.naukri.com/react-developer-jobs",

        }
    },
    # ── CYBERSECURITY ────────────────────────────────────────────────────
    {
        "id": "j013", "title": "Cybersecurity Analyst",
        "company": "HCL Technologies", "location": "Multiple Cities",
        "skills_required": ["networking", "linux", "python", "security", "ethical hacking", "sql"],
        "description": "Monitor security events, perform vulnerability assessments, and respond to incidents for global enterprise clients.",
        "salary_range": "₹7–18 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 80,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Cybersecurity+Analyst+HCL",
            "naukri":   "https://www.naukri.com/cyber-security-jobs",

        }
    },
    # ── MOBILE ───────────────────────────────────────────────────────────
    {
        "id": "j014", "title": "Android Developer",
        "company": "PhonePe", "location": "Bangalore",
        "skills_required": ["java", "kotlin", "android", "restapi", "git", "sql"],
        "description": "Build high-performance Android apps for PhonePe's 450M+ users. Kotlin preferred.",
        "salary_range": "₹12–28 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 30,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Android+Developer+PhonePe",
            "naukri":   "https://www.naukri.com/android-developer-jobs",

        }
    },
    {
        "id": "j015", "title": "Flutter Developer",
        "company": "Meesho", "location": "Bangalore / Remote",
        "skills_required": ["flutter", "dart", "restapi", "firebase", "git"],
        "description": "Develop cross-platform mobile apps with Flutter for Meesho's social commerce platform.",
        "salary_range": "₹10–22 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 20,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Flutter+Developer+Meesho",
            "naukri":   "https://www.naukri.com/flutter-developer-jobs",

        }
    },
    # ── FRESHER / CAMPUS ─────────────────────────────────────────────────
    {
        "id": "j016", "title": "Software Developer Trainee",
        "company": "TCS", "location": "Pan India",
        "skills_required": ["java", "python", "sql", "git", "dsa"],
        "description": "Join TCS as a fresher, go through structured training, and work on real client projects within 6 months.",
        "salary_range": "₹3.5–7 LPA", "experience_level": "fresher",
        "job_type": "Full-time", "openings": 5000,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=TCS+Software+Trainee",
            "naukri":   "https://www.naukri.com/tcs-jobs",

        }
    },
    {
        "id": "j017", "title": "Graduate Engineer Trainee",
        "company": "Wipro", "location": "Pan India",
        "skills_required": ["java", "python", "sql", "communication", "git"],
        "description": "Kickstart your career with Wipro's WILP program. Work on diverse technologies and client projects.",
        "salary_range": "₹3.5–6.5 LPA", "experience_level": "fresher",
        "job_type": "Full-time", "openings": 3000,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Wipro+Graduate+Engineer",
            "naukri":   "https://www.naukri.com/wipro-jobs",

        }
    },
    # ── PRODUCT / TECH ────────────────────────────────────────────────────
    {
        "id": "j018", "title": "SDE-1 (Backend)",
        "company": "Ola", "location": "Bangalore",
        "skills_required": ["python", "golang", "restapi", "sql", "docker", "redis", "git"],
        "description": "Build reliable backend services for Ola's ride-hailing platform handling millions of concurrent requests.",
        "salary_range": "₹14–28 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 50,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=SDE+Backend+Ola",
            "naukri":   "https://www.naukri.com/backend-developer-jobs-in-bangalore",

        }
    },
    {
        "id": "j019", "title": "Generative AI Engineer",
        "company": "Persistent Systems", "location": "Pune / Remote",
        "skills_required": ["python", "llm", "genai", "machinelearning", "restapi", "docker"],
        "description": "Build GenAI applications using LLMs, prompt engineering, and RAG pipelines for enterprise clients.",
        "salary_range": "₹15–35 LPA", "experience_level": "intermediate",
        "job_type": "Full-time", "openings": 40,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Generative+AI+Engineer",
            "naukri":   "https://www.naukri.com/generative-ai-engineer-jobs",

        }
    },
    {
        "id": "j020", "title": "SQL/Data Engineer",
        "company": "MakeMyTrip", "location": "Gurgaon / Remote",
        "skills_required": ["sql", "python", "spark", "hadoop", "tableau", "etl"],
        "description": "Design and maintain data pipelines, work on petabyte-scale data warehouses, and power BI dashboards.",
        "salary_range": "₹8–18 LPA", "experience_level": "junior",
        "job_type": "Full-time", "openings": 35,
        "portals": {
            "linkedin": "https://www.linkedin.com/jobs/search/?keywords=Data+Engineer+SQL",
            "naukri":   "https://www.naukri.com/data-engineer-jobs",

        }
    },
]


# ---------------------------------------------------------------------------
# Job Recommender
# ---------------------------------------------------------------------------

class JobRecommender:
    """
    Content-Based Job Recommendation using TF-IDF + Cosine Similarity.

    Algorithm pipeline:
      1. Convert each job's required skills → TF-IDF vector
      2. Convert user's current skills → TF-IDF vector
      3. Compute cosine similarity (user_vec, job_vec)
      4. Optionally boost with: set-overlap bonus + experience tier match
      5. Rank by final score DESC
    """

    def __init__(self):
        self._vectorizer = TFIDFVectorizer()
        self._corpus_fitted = False
        self._job_vectors: Dict[str, Dict[str, float]] = {}
        self._build_index()

    def _build_index(self):
        """Pre-compute TF-IDF vectors for all curated jobs (offline indexing)."""
        corpus_docs = [
            skills_to_document(job["skills_required"]) for job in CURATED_JOBS
        ]
        self._vectorizer.fit(corpus_docs)
        for job in CURATED_JOBS:
            doc = skills_to_document(job["skills_required"])
            self._job_vectors[job["id"]] = self._vectorizer.transform(doc)
        self._corpus_fitted = True
        logger.info(f"✅ Job index built: {len(CURATED_JOBS)} jobs vectorized")

    def recommend(
        self,
        user_skills: List[str],
        target_role: Optional[str] = None,
        experience_level: Optional[str] = None,
        top_n: int = 10
    ) -> List[Dict]:
        """
        Recommend jobs ranked by TF-IDF cosine similarity + rule bonuses.

        Parameters
        ----------
        user_skills      : skills extracted from resume / earned via mock tests
        target_role      : preferred role (used as keyword filter, optional)
        experience_level : "fresher" | "junior" | "intermediate" | "senior"
        top_n            : number of results to return
        """
        if not user_skills:
            return self._fallback_jobs(top_n)

        user_doc = skills_to_document(user_skills)
        user_vec = self._vectorizer.transform(user_doc)

        scored: List[Dict] = []
        for job in CURATED_JOBS:
            job_vec  = self._job_vectors.get(job["id"], {})
            cos_sim  = cosine_similarity(user_vec, job_vec)

            # Set-overlap bonus (0-0.3)
            user_norm = {t.lower() for t in user_skills}
            req_norm  = {t.lower() for t in job["skills_required"]}
            overlap   = len(user_norm & req_norm) / max(len(req_norm), 1)
            overlap_bonus = overlap * 0.3

            # Experience tier bonus / penalty (±0.1)
            exp_bonus = 0.0
            if experience_level and job.get("experience_level"):
                tiers = ["fresher", "junior", "intermediate", "senior"]
                user_tier = tiers.index(experience_level) if experience_level in tiers else 1
                job_tier  = tiers.index(job["experience_level"]) if job["experience_level"] in tiers else 1
                diff = abs(user_tier - job_tier)
                exp_bonus = 0.1 if diff == 0 else (-0.05 * diff)

            # Target role bonus: strongly prefer jobs semantically aligned to selected role
            role_bonus = 0.0
            if target_role:
                role_terms = set(target_role.lower().replace("_", " ").split())
                job_terms = set((job.get("title", "") + " " + job.get("description", "")).lower().split())
                overlap_terms = len(role_terms & job_terms)
                if overlap_terms > 0:
                    role_bonus = min(0.2, 0.08 * overlap_terms)
                else:
                    role_bonus = -0.04

            final_score = cos_sim + overlap_bonus + exp_bonus + role_bonus
            match_pct   = round(min(100, max(0, (cos_sim + overlap) / 2 * 100)), 1)

            scored.append({
                **job,
                "match_score": match_pct,
                "cosine_similarity": round(cos_sim, 4),
                "_sort_key": final_score
            })

        # Sort by final score
        scored.sort(key=lambda x: x["_sort_key"], reverse=True)

        # Clean private sort key
        results = []
        for item in scored[:top_n]:
            item.pop("_sort_key", None)
            results.append(item)

        return results

    def recommend_after_skill_gain(
        self,
        user_skills: List[str],
        newly_learned_skill: str,
        top_n: int = 6
    ) -> List[Dict]:
        """
        Re-rank jobs after user earns a new skill (mock test passed / course completed).
        Returns jobs where the newly learned skill is listed as required.
        """
        enhanced = list(user_skills) + [newly_learned_skill]
        all_recs = self.recommend(enhanced, top_n=top_n * 2)
        # Prioritise jobs that explicitly need the new skill
        priority = [j for j in all_recs if newly_learned_skill.lower() in [s.lower() for s in j["skills_required"]]]
        rest     = [j for j in all_recs if j not in priority]
        return (priority + rest)[:top_n]

    def search(self, query: str, top_n: int = 10) -> List[Dict]:
        """
        Free-text search against job title + skills using TF-IDF cosine sim.
        """
        query_vec = self._vectorizer.transform(query)
        scored = []
        for job in CURATED_JOBS:
            title_doc = skills_to_document([job["title"]] + job["skills_required"])
            title_vec = self._vectorizer.transform(title_doc)
            sim = cosine_similarity(query_vec, title_vec)
            # Keyword fallback: plain substring match adds 0.3
            if query.lower() in job["title"].lower():
                sim = min(1.0, sim + 0.3)
            scored.append(({**job, "match_score": round(sim * 100, 1)}, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return [item[0] for item in scored[:top_n]]

    def _fallback_jobs(self, top_n: int) -> List[Dict]:
        return [{**j, "match_score": 50.0} for j in CURATED_JOBS[:top_n]]


# Singleton
_recommender: Optional[JobRecommender] = None

def get_job_recommender() -> JobRecommender:
    global _recommender
    if _recommender is None:
        _recommender = JobRecommender()
    return _recommender
