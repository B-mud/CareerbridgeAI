"""
TF-IDF + Cosine Similarity Engine
Implements core NLP algorithms used in Career Bridge AI:
  - TF-IDF vectorization (Term Frequency–Inverse Document Frequency)
  - Cosine Similarity scoring (Resume Vector vs Job/Role vector)
  - Skill tokenization & normalization

Used by:
  - Skill Gap Analysis (user skills vs role requirements)
  - Job Recommendation (resume vector vs job description vector)
  - Learning Path ranking (missing skill priority scoring)
"""

import math
import re
from typing import Dict, List, Tuple, Set


# ---------------------------------------------------------------------------
# 1.  TEXT PRE-PROCESSING  (Tokenisation + Normalisation)
# ---------------------------------------------------------------------------

# Common English stop-words that add no discriminative value
_STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "has", "have", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "this", "that", "these", "those",
    "it", "its", "we", "you", "he", "she", "they", "them", "their", "our",
    "your", "his", "her", "not", "no", "more", "also", "as", "well", "i",
    "use", "used", "using", "work", "working", "experience", "years",
    "year", "strong", "knowledge", "understanding", "familiarity",
    "proficiency", "ability", "skills", "skill"
}

# Canonical aliases – maps common variants to a single token so TF-IDF
# vectors are consistent across documents.
_ALIASES: Dict[str, str] = {
    "js": "javascript", "ts": "typescript",
    "nodejs": "nodejs", "node.js": "nodejs",
    "reactjs": "react", "vuejs": "vue",
    "k8s": "kubernetes",
    "ml": "machinelearning", "machine learning": "machinelearning",
    "deep learning": "deeplearning", "dl": "deeplearning",
    "tensorflow": "tensorflow", "tf": "tensorflow",
    "postgresql": "sql", "mysql": "sql", "postgres": "sql",
    "rest api": "restapi", "restful": "restapi", "api": "restapi",
    "ci/cd": "cicd", "ci": "cicd", "cd": "cicd",
    "bash scripting": "bash", "shell scripting": "bash",
    "object oriented": "oop", "oop": "oop",
    "data structures": "dsa", "algorithms": "dsa",
    "natural language processing": "nlp",
    "computer vision": "computervision",
    "large language model": "llm", "llm": "llm",
    "generative ai": "genai", "gen ai": "genai",
    "aws": "aws", "amazon web services": "aws",
    "azure": "azure", "microsoft azure": "azure",
    "gcp": "gcp", "google cloud": "gcp",
}


def tokenize(text: str) -> List[str]:
    """
    Convert raw text into a list of normalised tokens.

    Steps (matching NLP pipeline described in algorithm spec):
      1. Lowercase
      2. Replace punctuation / special chars with space
      3. Apply alias mapping (multi-word first, then single)
      4. Split on whitespace
      5. Remove stop-words and single-char tokens
    """
    if not text:
        return []

    text = text.lower().strip()

    # Apply multi-word aliases first (longest match wins)
    for phrase, canon in sorted(_ALIASES.items(), key=lambda x: -len(x[0])):
        if " " in phrase:
            text = text.replace(phrase, canon)

    # Replace punctuation with space (keep letters and digits)
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Apply single-word aliases
    tokens_raw = text.split()
    tokens: List[str] = []
    for tok in tokens_raw:
        canon = _ALIASES.get(tok, tok)
        if canon and canon not in _STOP_WORDS and len(canon) > 1:
            tokens.append(canon)

    return tokens


# ---------------------------------------------------------------------------
# 2.  TF-IDF VECTORIZER
# ---------------------------------------------------------------------------

class TFIDFVectorizer:
    """
    Lightweight TF-IDF implementation without external ML libraries.

    Vocabulary is built incrementally from documents added via fit().
    transform() converts any text into a sparse dict vector { term: tfidf }.

    Formula:
        tf(t, d)  = count(t in d) / len(d)               [normalised term freq]
        idf(t)    = log(1 + N / (1 + df(t))) + 1         [smoothed IDF]
        tfidf     = tf * idf
    """

    def __init__(self):
        self.vocabulary_: Dict[str, int] = {}          # term -> index
        self.idf_: Dict[str, float] = {}               # term -> idf value
        self._doc_count: int = 0
        self._df: Dict[str, int] = {}                  # document frequency

    def fit(self, documents: List[str]) -> "TFIDFVectorizer":
        """Build vocabulary and IDF from a list of documents."""
        self._doc_count = len(documents)
        self._df = {}
        self.vocabulary_ = {}

        for doc in documents:
            tokens = set(tokenize(doc))
            for tok in tokens:
                self._df[tok] = self._df.get(tok, 0) + 1

        # Build sorted vocabulary for reproducibility
        for idx, term in enumerate(sorted(self._df.keys())):
            self.vocabulary_[term] = idx

        # Compute IDF: log(1 + N / (1 + df)) + 1  (sklearn-style smooth)
        N = self._doc_count
        for term, df in self._df.items():
            self.idf_[term] = math.log((1 + N) / (1 + df)) + 1.0

        return self

    def transform(self, text: str) -> Dict[str, float]:
        """Return TF-IDF sparse vector as { term: weight }."""
        tokens = tokenize(text)
        if not tokens:
            return {}

        # TF: normalised count
        tf_raw: Dict[str, int] = {}
        for tok in tokens:
            tf_raw[tok] = tf_raw.get(tok, 0) + 1

        n_tokens = len(tokens)
        vec: Dict[str, float] = {}
        for term, count in tf_raw.items():
            if term in self.idf_:
                tf = count / n_tokens
                vec[term] = tf * self.idf_[term]
            else:
                # Unseen term — use default IDF assuming df=1
                tf = count / n_tokens
                idf_default = math.log((1 + self._doc_count) / 2) + 1.0
                vec[term] = tf * idf_default

        return vec

    def fit_transform(self, text: str, corpus: List[str]) -> Dict[str, float]:
        """Convenience: fit on corpus then transform a single document."""
        self.fit(corpus)
        return self.transform(text)


# ---------------------------------------------------------------------------
# 3.  COSINE SIMILARITY
# ---------------------------------------------------------------------------

def cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """
    Compute cosine similarity between two sparse TF-IDF vectors.

        sim(A, B) = (A · B) / (||A|| * ||B||)

    Returns float in [0.0, 1.0].
    """
    if not vec_a or not vec_b:
        return 0.0

    # Dot product over shared terms
    dot = sum(vec_a.get(term, 0.0) * val for term, val in vec_b.items())

    # Magnitudes
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if mag_a == 0 or mag_b == 0:
        return 0.0

    return dot / (mag_a * mag_b)


# ---------------------------------------------------------------------------
# 4.  SKILL-LIST HELPERS  (used by SkillGapService and JobRecommender)
# ---------------------------------------------------------------------------

def skills_to_document(skills: List[str]) -> str:
    """Convert a skill list to a single text document for TF-IDF."""
    # Repeat each skill proportionally — acts like boost factor
    return " ".join(skills)


def score_skill_match(user_skills: List[str], required_skills: List[str]) -> float:
    """
    Hybrid match score (0-100) combining:
      - Set-based precision  (what fraction of required skills do you have)
      - TF-IDF cosine similarity (semantic overlap, catches aliases)

    Final score = 0.6 * set_score + 0.4 * cosine_score
    """
    if not required_skills:
        return 0.0

    # Normalise both lists
    user_norm = {_ALIASES.get(s.lower(), s.lower()) for s in user_skills}
    req_norm  = {_ALIASES.get(s.lower(), s.lower()) for s in required_skills}

    # Set-based precision
    matched = len(user_norm & req_norm)
    set_score = matched / len(req_norm)

    # TF-IDF cosine
    user_doc = skills_to_document(list(user_norm))
    req_doc  = skills_to_document(list(req_norm))
    corpus   = [user_doc, req_doc]
    vec = TFIDFVectorizer()
    vec.fit(corpus)
    vec_user = vec.transform(user_doc)
    vec_req  = vec.transform(req_doc)
    cos_score = cosine_similarity(vec_user, vec_req)

    # Weighted hybrid
    hybrid = 0.6 * set_score + 0.4 * cos_score
    return round(min(100.0, hybrid * 100), 2)
