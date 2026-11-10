"""
Course Linking Service - Enhanced with Real Course URLs
========================================================
Provides specific course recommendations from  Udemy, Coursera, and other platforms
NOT generic search queries - direct links to real courses
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CourseResource:
    title: str
    url: str
    platform: str
    duration: Optional[str] = None
    level: Optional[str] = None  # "Beginner", "Intermediate", "Advanced"
    rating: Optional[float] = None


class CourseRecommendationService:
    """Service to recommend SPECIFIC courses (not search queries)"""

    # Mapping of skills to SPECIFIC course URLs from trusted platforms
    # NOT search queries - actual course links
    SPECIFIC_COURSE_LINKS = {
        "python": [
            {
                "title": "Complete Python Bootcamp",
                "url": "https://www.udemy.com/course/complete-python-bootcamp/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "22 hours"
            },
            {
                "title": "Python for Everybody",
                "url": "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
                "platform": "FreeCodeCamp",
                "level": "Beginner",
                "duration": "Free"
            },
            {
                "title": "Python Programming Masterclass",
                "url": "https://www.udemy.com/course/python-the-complete-python-developer-course/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "45 hours"
            },
            {
                "title": "Google IT Automation with Python",
                "url": "https://www.coursera.org/professional-certificates/google-it-automation",
                "platform": "Coursera",
                "level": "Beginner",
                "duration": "6 months"
            }
        ],
        "javascript": [
            {
                "title": "The Complete JavaScript Course 2024",
                "url": "https://www.udemy.com/course/the-complete-javascript-course-2024/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "69 hours"
            },
            {
                "title": "JavaScript Algorithms and Data Structures",
                "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
                "platform": "FreeCodeCamp",
                "level": "Beginner",
                "duration": "Free"
            },
            {
                "title": "Advanced JavaScript Concepts",
                "url": "https://www.udemy.com/course/advanced-javascript-concepts/",
                "platform": "Udemy",
                "level": "Advanced",
                "duration": "12 hours"
            }
        ],
        "react": [
            {
                "title": "React - The Complete Guide 2024",
                "url": "https://www.udemy.com/course/react-the-complete-guide/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "49 hours"
            },
            {
                "title": "Front End Development Libraries - React",
                "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/react/",
                "platform": "FreeCodeCamp",
                "level": "Intermediate",
                "duration": "Free"
            },
            {
                "title": "Advanced React Patterns",
                "url": "https://www.udemy.com/course/react-hooks-advanced-concepts/",
                "platform": "Udemy",
                "level": "Advanced",
                "duration": "8 hours"
            }
        ],
        "sql": [
            {
                "title": "The Complete SQL Bootcamp 2024",
                "url": "https://www.udemy.com/course/the-complete-sql-bootcamp/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "13 hours"
            },
            {
                "title": "SQL for Data Analysis",
                "url": "https://www.freecodecamp.org/learn/relational-database/",
                "platform": "FreeCodeCamp",
                "level": "Beginner",
                "duration": "Free"
            },
            {
                "title": "Advanced SQL for Query Tuning and Performance Optimization",
                "url": "https://www.udemy.com/course/advanced-sql-performance-tuning/",
                "platform": "Udemy",
                "level": "Advanced",
                "duration": "11 hours"
            }
        ],
        "html": [
            {
                "title": "Responsive Web Design",
                "url": "https://www.freecodecamp.org/learn/responsive-web-design/",
                "platform": "FreeCodeCamp",
                "level": "Beginner",
                "duration": "Free"
            },
            {
                "title": "HTML5 Complete Course & Exercises",
                "url": "https://www.udemy.com/course/html5-complete-course-semantic-page-structure/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "6 hours"
            }
        ],
        "css": [
            {
                "title": "CSS - The Complete Guide 2024",
                "url": "https://www.udemy.com/course/css-the-complete-guide-incl-flexbox-grid-sass/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "22 hours"
            },
            {
                "title": "CSS Flexbox & Grid",
                "url": "https://www.freecodecamp.org/learn/responsive-web-design/",
                "platform": "FreeCodeCamp",
                "level": "Intermediate",
                "duration": "Free"
            }
        ],
        "nodejs": [
            {
                "title": "The Complete Node.js Developer Course",
                "url": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "34 hours"
            },
            {
                "title": "Node.js API Mastery",
                "url": "https://www.udemy.com/course/node-js-the-complete-guide/",
                "platform": "Udemy",
                "level": "Advanced",
                "duration": "40 hours"
            }
        ],
        "docker": [
            {
                "title": "Docker for the Absolute Beginner",
                "url": "https://www.udemy.com/course/docker-for-the-absolute-beginner/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "5 hours"
            },
            {
                "title": "Docker & Kubernetes",
                "url": "https://www.udemy.com/course/docker-kubernetes-the-complete-guide/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "20 hours"
            }
        ],
        "aws": [
            {
                "title": "AWS Certified Solutions Architect Associate",
                "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "27 hours"
            },
            {
                "title": "AWS Cloud Fundamentals",
                "url": "https://www.coursera.org/learn/aws-cloud-services-fundamentals",
                "platform": "Coursera",
                "level": "Beginner",
                "duration": "4 weeks"
            }
        ],
        "git": [
            {
                "title": "Git and GitHub Complete Bootcamp",
                "url": "https://www.udemy.com/course/git-and-github-bootcamp/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "4 hours"
            },
            {
                "title": "Git Crash Course",
                "url": "https://www.youtube.com/watch?v=apGV9Kg7ics",
                "platform": "YouTube",
                "level": "Beginner",
                "duration": "30 mins"
            }
        ],
        "machinelearning": [
            {
                "title": "Machine Learning A-Z™ 2024",
                "url": "https://www.udemy.com/course/machinelearning/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "45 hours"
            },
            {
                "title": "Machine Learning by Andrew Ng",
                "url": "https://www.coursera.org/learn/machine-learning",
                "platform": "Coursera",
                "level": "Beginner",
                "duration": "3 months"
            }
        ],
        "kubernetes": [
            {
                "title": "Kubernetes for Developers",
                "url": "https://www.udemy.com/course/kubernetes-for-developers/",
                "platform": "Udemy",
                "level": "Intermediate",
                "duration": "15 hours"
            }
        ],
        "typescript": [
            {
                "title": "TypeScript Complete Developer Guide",
                "url": "https://www.udemy.com/course/typescript-the-complete-developers-guide/",
                "platform": "Udemy",
                "level": "Beginner",
                "duration": "14 hours"
            }
        ]
    }

    @classmethod
    def get_courses_for_topic(
        cls, topic: str, skill_level: str = "intermediate", limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Get SPECIFIC course recommendations for a skill/topic.
        Returns actual course links, NOT search queries.

        Args:
            topic: The skill/topic (e.g., "Python", "React", "Docker")
            skill_level: Filter by level ("beginner", "intermediate", "advanced")
            limit: Maximum number of courses to return

        Returns:
            List of course recommendation dictionaries with real URLs
        """
        topic_normalized = topic.lower().strip().replace(" ", "")
        
        # Check for direct match in our course library
        courses = cls.SPECIFIC_COURSE_LINKS.get(topic_normalized, [])
        
        if not courses:
            # Fall back to checking for partial matches
            for key, values in cls.SPECIFIC_COURSE_LINKS.items():
                if topic_normalized in key or key in topic_normalized:
                    courses = values
                    break
        
        # Filter by skill level if specified
        if skill_level and skill_level != "all":
            filtered = [c for c in courses if c.get("level", "").lower() == skill_level.lower()]
            if filtered:
                courses = filtered
        
        return courses[:limit]

    @classmethod
    def get_learning_resources(
        cls, skill: str, role: str = ""
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get comprehensive learning resources for a skill with multiple levels.

        Returns:
            Dictionary with beginner, intermediate, and advanced resources
        """
        all_courses = cls.get_courses_for_topic(skill, "all", 10)
        
        resources = {
            "beginner": [c for c in all_courses if c.get("level", "").lower() == "beginner"][:2],
            "intermediate": [c for c in all_courses if c.get("level", "").lower() == "intermediate"][:2],
            "advanced": [c for c in all_courses if c.get("level", "").lower() == "advanced"][:2],
        }
        
        # If not enough courses, pad with any available
        all_sections = resources["beginner"] + resources["intermediate"] + resources["advanced"]
        if len(all_sections) < 3:
            resources["all"] = all_courses[:3]
        
        return resources

    @classmethod
    def get_all_available_skills(cls) -> List[str]:
        """Get list of all skills with available courses"""
        return list(cls.SPECIFIC_COURSE_LINKS.keys())
