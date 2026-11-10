"""
Mock Test Service - Enhanced with Real MCQ Questions
=====================================================
Source: Skill Validation AI Powered Mock Tests & Industry Standard Questions
Algorithms:
  - Skill-specific MCQ bank with difficulty levels (easy/medium/hard)
  - Weighted scoring based on difficulty
  - Skill unlock logic: passing score (>=60%) marks skill as 'tested'
  - Achievement badges: Expert (90+%), Proficient (70+%), Beginner (60+%), Keep Practicing (<60%)

Question difficulty levels: easy (1.0x), medium (1.5x), hard (2.0x)
"""

from typing import Dict, List, Optional
import random
import logging

logger = logging.getLogger(__name__)

__all__ = ["MockTestService", "get_mock_test_service"]

# ---------------------------------------------------------------------------
# MCQ Question Bank (keyed by normalised skill name)
# ---------------------------------------------------------------------------

QUESTION_BANK: Dict[str, List[Dict]] = {
    "python": [
        {"id": "py001", "question": "Which of the following is used to define a function in Python?", "options": ["func", "define", "def", "function"], "answer": "def", "difficulty": "easy", "explanation": "Python uses the `def` keyword to declare functions."},
        {"id": "py002", "question": "What is the output of: print(type([]))", "options": ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "list"], "answer": "<class 'list'>", "difficulty": "easy", "explanation": "[] creates an empty list object."},
        {"id": "py003", "question": "Which data structure uses LIFO order?", "options": ["Queue", "Stack", "Deque", "Heap"], "answer": "Stack", "difficulty": "easy", "explanation": "Stack follows Last-In-First-Out (LIFO) order."},
        {"id": "py004", "question": "What does the `yield` keyword do in Python?", "options": ["Returns a value and exits the function", "Creates a generator function", "Imports a module", "Pauses execution permanently"], "answer": "Creates a generator function", "difficulty": "medium", "explanation": "`yield` makes a function a generator, producing values lazily."},
        {"id": "py005", "question": "What is the time complexity of dictionary lookup in Python?", "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"], "answer": "O(1)", "difficulty": "medium", "explanation": "Python dict uses hash table, giving O(1) average lookup."},
        {"id": "py006", "question": "Which of the following creates a shallow copy of a list?", "options": ["list.copy()", "list[:]", "list(list)", "All of the above"], "answer": "All of the above", "difficulty": "medium", "explanation": "All three methods create a shallow copy."},
        {"id": "py007", "question": "What is a decorator in Python?", "options": ["A CSS class for Python UI", "A function that takes a function and returns a modified function", "A loop construct", "A type annotation"], "answer": "A function that takes a function and returns a modified function", "difficulty": "hard", "explanation": "Decorators use the @syntax and wrap functions to add behaviour."},
        {"id": "py008", "question": "What does `__slots__` do in a Python class?", "options": ["Defines allowed attribute names, reducing memory overhead", "Creates private methods", "Enables multiple inheritance", "Defines class constants"], "answer": "Defines allowed attribute names, reducing memory overhead", "difficulty": "hard", "explanation": "`__slots__` prevents per-instance `__dict__`, saving memory."},
    ],
    "javascript": [
        {"id": "js001", "question": "Which keyword declares a block-scoped variable in JavaScript?", "options": ["var", "let", "int", "local"], "answer": "let", "difficulty": "easy", "explanation": "`let` creates block-scoped variables, unlike `var` which is function-scoped."},
        {"id": "js002", "question": "What does `===` check in JavaScript?", "options": ["Value only", "Type only", "Value and type", "Reference"], "answer": "Value and type", "difficulty": "easy", "explanation": "Strict equality `===` checks both value and type."},
        {"id": "js003", "question": "What is a Promise in JavaScript?", "options": ["A variable declaration", "An object representing eventual completion or failure of an async operation", "A loop construct", "A CSS selector"], "answer": "An object representing eventual completion or failure of an async operation", "difficulty": "medium", "explanation": "Promises handle asynchronous operations, replacing callback hell."},
        {"id": "js004", "question": "What is the output of: typeof null?", "options": ["null", "undefined", "object", "NaN"], "answer": "object", "difficulty": "medium", "explanation": "This is a known JavaScript bug — typeof null returns 'object'."},
        {"id": "js005", "question": "What is event bubbling?", "options": ["DOM events propagating from child to parent", "A CSS animation", "A memory leak", "An error type"], "answer": "DOM events propagating from child to parent", "difficulty": "hard", "explanation": "Events bubble from the target element up through ancestors."},
    ],
    "react": [
        {"id": "rc001", "question": "What is the purpose of `useState` hook?", "options": ["To fetch data from API", "To add state to functional components", "To manage routing", "To create class components"], "answer": "To add state to functional components", "difficulty": "easy", "explanation": "`useState` returns a state variable and a setter function."},
        {"id": "rc002", "question": "Which prop is used as a unique identifier in React lists?", "options": ["id", "key", "ref", "name"], "answer": "key", "difficulty": "easy", "explanation": "The `key` prop helps React efficiently re-render list items."},
        {"id": "rc003", "question": "What does `useEffect` with an empty dependency array `[]` do?", "options": ["Runs on every render", "Runs only once after initial render", "Never runs", "Runs on state change only"], "answer": "Runs only once after initial render", "difficulty": "medium", "explanation": "Empty `[]` means the effect has no dependencies and runs once on mount."},
        {"id": "rc004", "question": "What is the Virtual DOM?", "options": ["A real browser DOM copy", "A lightweight JS object representation of the DOM for efficient diffing", "A CSS property", "A React routing system"], "answer": "A lightweight JS object representation of the DOM for efficient diffing", "difficulty": "medium", "explanation": "React computes diffs on the Virtual DOM and batches real DOM updates."},
        {"id": "rc005", "question": "What is React Context used for?", "options": ["HTTP requests", "Sharing state across components without prop drilling", "Styling components", "Testing"], "answer": "Sharing state across components without prop drilling", "difficulty": "hard", "explanation": "Context API provides a way to share values between components."},
    ],
    "sql": [
        {"id": "sq001", "question": "Which SQL clause filters rows AFTER grouping?", "options": ["WHERE", "HAVING", "FILTER", "ORDER BY"], "answer": "HAVING", "difficulty": "easy", "explanation": "HAVING filters groups created by GROUP BY, WHERE filters rows before grouping."},
        {"id": "sq002", "question": "What does INNER JOIN return?", "options": ["All rows from left table", "All rows from right table", "Only matching rows from both tables", "All rows from both tables"], "answer": "Only matching rows from both tables", "difficulty": "easy", "explanation": "INNER JOIN returns rows where the join condition matches in both tables."},
        {"id": "sq003", "question": "Which of the following is NOT an aggregate function?", "options": ["COUNT()", "SUM()", "UPPER()", "AVG()"], "answer": "UPPER()", "difficulty": "medium", "explanation": "UPPER() is a string function, not an aggregate."},
        {"id": "sq004", "question": "What is a database index used for?", "options": ["Storing extra data", "Speeding up SELECT queries by allowing quick lookups", "Encrypting data", "Joining tables"], "answer": "Speeding up SELECT queries by allowing quick lookups", "difficulty": "medium", "explanation": "Indexes create a data structure that allows fast column lookups."},
        {"id": "sq005", "question": "What is a correlated subquery?", "options": ["A subquery that runs once", "A subquery that references a column from the outer query and runs per row", "A JOIN operation", "A stored procedure"], "answer": "A subquery that references a column from the outer query and runs per row", "difficulty": "hard", "explanation": "Correlated subqueries are evaluated once for each row of the outer query."},
    ],
    "machinelearning": [
        {"id": "ml001", "question": "What does overfitting mean in machine learning?", "options": ["Model performs well on training but poorly on new data", "Model trains too slowly", "Model is too simple", "Model has no parameters"], "answer": "Model performs well on training but poorly on new data", "difficulty": "easy", "explanation": "Overfitting = model memorises training data but fails to generalise."},
        {"id": "ml002", "question": "Which algorithm is used for classification?", "options": ["Linear Regression", "K-Means", "Logistic Regression", "PCA"], "answer": "Logistic Regression", "difficulty": "easy", "explanation": "Logistic Regression outputs probabilities and is used for binary classification."},
        {"id": "ml003", "question": "What is the bias-variance tradeoff?", "options": ["Balance between training speed and accuracy", "Balance between underfitting (high bias) and overfitting (high variance)", "Balance between CPU and GPU usage", "Balance between data size and model size"], "answer": "Balance between underfitting (high bias) and overfitting (high variance)", "difficulty": "medium", "explanation": "High bias → underfitting; high variance → overfitting. Good models minimise both."},
        {"id": "ml004", "question": "What does gradient descent minimise?", "options": ["Training time", "Number of parameters", "The loss function", "Dataset size"], "answer": "The loss function", "difficulty": "medium", "explanation": "Gradient descent iteratively adjusts weights to minimise the loss."},
        {"id": "ml005", "question": "What is a confusion matrix used for?", "options": ["Visualising neural network layers", "Evaluating classification model performance", "Normalising data", "Feature selection"], "answer": "Evaluating classification model performance", "difficulty": "hard", "explanation": "Confusion matrix shows TP, TN, FP, FN to evaluate classifiers."},
    ],
    "docker": [
        {"id": "dk001", "question": "What is the purpose of a Dockerfile?", "options": ["A script to create container images", "A network config file", "A database schema", "A cloud deployment script"], "answer": "A script to create container images", "difficulty": "easy", "explanation": "Dockerfile contains instructions to assemble a Docker image."},
        {"id": "dk002", "question": "Which command builds a Docker image?", "options": ["docker run", "docker build", "docker pull", "docker start"], "answer": "docker build", "difficulty": "easy", "explanation": "`docker build` reads a Dockerfile and creates an image."},
        {"id": "dk003", "question": "What is Docker Compose used for?", "options": ["Single-container management", "Defining and running multi-container Docker applications", "CI/CD pipelines", "Image compression"], "answer": "Defining and running multi-container Docker applications", "difficulty": "medium", "explanation": "Docker Compose uses a YAML file to configure multi-service applications."},
    ],
    "git": [
        {"id": "gt001", "question": "What does `git rebase` do?", "options": ["Merges two branches", "Moves or replays commits onto another base branch", "Deletes a branch", "Creates a new branch"], "answer": "Moves or replays commits onto another base branch", "difficulty": "medium", "explanation": "Rebase rewrites commit history by applying commits on top of another branch."},
        {"id": "gt002", "question": "Which command undoes the last commit but keeps changes staged?", "options": ["git reset --hard HEAD~1", "git reset --soft HEAD~1", "git revert HEAD", "git checkout HEAD~1"], "answer": "git reset --soft HEAD~1", "difficulty": "hard", "explanation": "`--soft` undoes the commit but leaves changes in the staging area."},
    ],
    "dsa": [
        {"id": "ds001", "question": "What is the time complexity of binary search?", "options": ["O(n)", "O(n log n)", "O(log n)", "O(1)"], "answer": "O(log n)", "difficulty": "easy", "explanation": "Binary search halves the search space each iteration → O(log n)."},
        {"id": "ds002", "question": "Which data structure is best for BFS traversal?", "options": ["Stack", "Queue", "Heap", "Tree"], "answer": "Queue", "difficulty": "easy", "explanation": "BFS uses a queue (FIFO) to explore nodes level by level."},
        {"id": "ds003", "question": "What is the worst-case time complexity of Quick Sort?", "options": ["O(n log n)", "O(n)", "O(n²)", "O(log n)"], "answer": "O(n²)", "difficulty": "medium", "explanation": "Quick Sort degrades to O(n²) on an already-sorted array with bad pivot choice."},
        {"id": "ds004", "question": "What is memoization?", "options": ["A sorting technique", "Caching function call results to avoid redundant computation", "A graph algorithm", "A data compression method"], "answer": "Caching function call results to avoid redundant computation", "difficulty": "medium", "explanation": "Memoization is the core of Dynamic Programming — store and reuse results."},
    ],
    "aws": [
        {"id": "aw001", "question": "What is Amazon S3 used for?", "options": ["Compute instances", "Object/file storage", "DNS management", "Container orchestration"], "answer": "Object/file storage", "difficulty": "easy", "explanation": "Amazon S3 (Simple Storage Service) stores files as objects in buckets."},
        {"id": "aw002", "question": "What is an EC2 instance?", "options": ["A managed database", "A virtual server in the cloud", "A CDN service", "A messaging queue"], "answer": "A virtual server in the cloud", "difficulty": "easy", "explanation": "EC2 (Elastic Compute Cloud) provides scalable virtual machines."},
        {"id": "aw003", "question": "What does Auto Scaling do in AWS?", "options": ["Encrypts data automatically", "Adjusts the number of EC2 instances based on demand", "Backs up databases", "Routes DNS queries"], "answer": "Adjusts the number of EC2 instances based on demand", "difficulty": "medium", "explanation": "Auto Scaling automatically adds/removes EC2 instances to match traffic."},
    ],
    "nlp": [
        {"id": "nl001", "question": "What does TF-IDF stand for?", "options": ["Text Filter - Inverse Data Format", "Term Frequency–Inverse Document Frequency", "Token Frequency–Indexed Document Field", "Text Feature–Image Data Function"], "answer": "Term Frequency–Inverse Document Frequency", "difficulty": "easy", "explanation": "TF-IDF weights terms by how frequent they are in a doc vs. rare across docs."},
        {"id": "nl002", "question": "What is tokenisation in NLP?", "options": ["Encrypting text", "Breaking text into words or sub-word units", "Translating text", "Compressing a document"], "answer": "Breaking text into words or sub-word units", "difficulty": "easy", "explanation": "Tokenisation splits raw text into tokens (words, sentences, or sub-words)."},
        {"id": "nl003", "question": "What is Named Entity Recognition (NER)?", "options": ["Classifying sentences", "Identifying entities like Person, Organisation, Location in text", "Machine translation", "Summarising documents"], "answer": "Identifying entities like Person, Organisation, Location in text", "difficulty": "medium", "explanation": "NER is a sequence labelling task that extracts structured entities."},
    ],
}

# ---------------------------------------------------------------------------
# Scoring engine
# ---------------------------------------------------------------------------

DIFFICULTY_WEIGHTS = {"easy": 1.0, "medium": 1.5, "hard": 2.0}
PASS_THRESHOLD = 60  # % needed to 'unlock' the skill


class MockTestService:
    """
    Manages skill-specific mock tests.

    Incremental Progress Scoring formula:
      raw_score   = sum(weight_i for each correct_i) / max_possible * 100
      badge_level = "🥇 Expert" if ≥90 | "🥈 Proficient" if ≥70 | "🥉 Beginner" if ≥pass_threshold
    """

    def get_questions(
        self,
        skill: str,
        difficulty: Optional[str] = None,
        count: int = 5
    ) -> List[Dict]:
        """Return questions for a skill, optionally filtered by difficulty."""
        norm_skill = self._normalize_skill(skill)
        bank = QUESTION_BANK.get(norm_skill, [])

        if not bank:
            # Fallback: generic problem-solving questions
            bank = self._generic_questions(skill)

        if difficulty and difficulty != "all":
            bank = [q for q in bank if q["difficulty"] == difficulty]

        random.shuffle(bank)
        questions = bank[:count]

        # Strip answer before sending to frontend
        return [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "difficulty": q["difficulty"],
                "skill": norm_skill,
            }
            for q in questions
        ]

    def score_submission(
        self,
        skill: str,
        answers: Dict[str, str],   # { question_id: selected_option }
    ) -> Dict:
        """
        Score submitted answers.

        Returns:
          score_pct   : 0-100 float
          passed      : bool (score >= PASS_THRESHOLD)
          correct     : int
          total       : int
          details     : per-question feedback
          badge       : achievement badge label
        """
        norm_skill = self._normalize_skill(skill)
        bank = QUESTION_BANK.get(norm_skill, self._generic_questions(skill))
        bank_map = {q["id"]: q for q in bank}

        total_weight = 0.0
        earned_weight = 0.0
        details = []
        correct_count = 0

        for qid, selected in answers.items():
            q = bank_map.get(qid)
            if not q:
                continue
            weight = DIFFICULTY_WEIGHTS.get(q["difficulty"], 1.0)
            total_weight += weight
            is_correct = selected.strip() == q["answer"].strip()
            if is_correct:
                earned_weight += weight
                correct_count += 1
            details.append({
                "question_id": qid,
                "correct": is_correct,
                "your_answer": selected,
                "correct_answer": q["answer"],
                "explanation": q.get("explanation", ""),
                "difficulty": q["difficulty"],
            })

        score_pct = round((earned_weight / total_weight * 100) if total_weight > 0 else 0, 1)
        passed = score_pct >= PASS_THRESHOLD

        if score_pct >= 90:
            badge = "🥇 Expert"
        elif score_pct >= 70:
            badge = "🥈 Proficient"
        elif passed:
            badge = "🥉 Beginner"
        else:
            badge = "📖 Keep Practicing"

        return {
            "skill": norm_skill,
            "score_pct": score_pct,
            "passed": passed,
            "correct": correct_count,
            "total": len(answers),
            "badge": badge,
            "details": details,
            "pass_threshold": PASS_THRESHOLD,
        }

    def get_available_skills(self) -> List[Dict]:
        """Return list of skills with question counts."""
        return [
            {
                "skill": skill,
                "label": skill.replace("machinelearning", "Machine Learning")
                              .replace("dsa", "Data Structures & Algorithms")
                              .title(),
                "question_count": len(questions),
                "difficulties": list({q["difficulty"] for q in questions}),
            }
            for skill, questions in QUESTION_BANK.items()
        ]

    # ------------------------------------------------------------------
    def _normalize_skill(self, skill: str) -> str:
        norm_map = {
            "machine learning": "machinelearning",
            "ml": "machinelearning",
            "data structures": "dsa",
            "algorithms": "dsa",
            "node.js": "nodejs",
            "node": "nodejs",
        }
        return norm_map.get(skill.lower().strip(), skill.lower().strip().replace(" ", ""))

    def _generic_questions(self, skill: str) -> List[Dict]:
        return [
            {"id": "gen001", "question": f"Which of the following best describes {skill}?",
             "options": ["A programming language", "A tool/framework/technology", "A database", "An operating system"],
             "answer": "A tool/framework/technology", "difficulty": "easy", "explanation": f"{skill} is a technology in this domain."},
            {"id": "gen002", "question": f"What is the primary use case of {skill}?",
             "options": ["Web development", "Data analysis", "System administration", "All of the above"],
             "answer": "All of the above", "difficulty": "medium", "explanation": f"{skill} can be applied across multiple domains."},
        ]


# Singleton
_mock_test_service: Optional[MockTestService] = None

def get_mock_test_service() -> MockTestService:
    global _mock_test_service
    if _mock_test_service is None:
        _mock_test_service = MockTestService()
    return _mock_test_service
