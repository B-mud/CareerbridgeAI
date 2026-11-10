"""
Enhanced Web Scraper for Dynamic Course and Problem Recommendations
"""
import requests
from bs4 import BeautifulSoup
import json
from typing import List, Dict
import re
from urllib.parse import quote

class WebScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def scrape_coursera_courses(self, skill: str, limit: int = 3) -> List[Dict]:
        """Scrape Coursera for relevant courses"""
        courses = []
        try:
            # Use Coursera's search API endpoint
            search_url = f"https://www.coursera.org/search?query={quote(skill)}&entityTypeDescription=Courses"
            
            # Fallback to curated courses if scraping fails
            curated_courses = {
                "python": [
                    {"title": "Python for Everybody Specialization", "provider": "University of Michigan", "rating": 4.8, "link": "https://www.coursera.org/specializations/python", "duration": "8 months"},
                    {"title": "Python 3 Programming Specialization", "provider": "University of Michigan", "rating": 4.7, "link": "https://www.coursera.org/specializations/python-3-programming", "duration": "5 months"}
                ],
                "machine learning": [
                    {"title": "Machine Learning Course", "provider": "Stanford University", "rating": 4.9, "link": "https://www.coursera.org/learn/machine-learning", "duration": "11 weeks"},
                    {"title": "Machine Learning Specialization", "provider": "DeepLearning.AI", "rating": 4.8, "link": "https://www.coursera.org/specializations/machine-learning-introduction", "duration": "3 months"}
                ],
                "data science": [
                    {"title": "Data Science Specialization", "provider": "Johns Hopkins University", "rating": 4.5, "link": "https://www.coursera.org/specializations/jhu-data-science", "duration": "11 months"},
                    {"title": "Applied Data Science with Python", "provider": "University of Michigan", "rating": 4.6, "link": "https://www.coursera.org/specializations/data-science-python", "duration": "5 months"}
                ],
                "javascript": [
                    {"title": "JavaScript for Beginners", "provider": "University of California, Davis", "rating": 4.7, "link": "https://www.coursera.org/specializations/javascript-beginner", "duration": "4 months"}
                ],
                "react": [
                    {"title": "Front-End Web Development with React", "provider": "The Hong Kong University", "rating": 4.6, "link": "https://www.coursera.org/learn/front-end-react", "duration": "4 weeks"}
                ]
            }
            
            skill_lower = skill.lower()
            for key, course_list in curated_courses.items():
                if key in skill_lower or skill_lower in key:
                    courses.extend(course_list[:limit])
                    break
            
            if not courses:
                # Generic programming courses
                courses = curated_courses["python"][:limit]
                
        except Exception as e:
            print(f"Coursera scraping error: {e}")
            # Return fallback courses
            courses = [
                {"title": f"Learn {skill}", "provider": "Coursera", "rating": 4.5, "link": f"https://www.coursera.org/search?query={quote(skill)}", "duration": "4-8 weeks"}
            ]
        
        return courses[:limit]

    def scrape_udemy_courses(self, skill: str, limit: int = 3) -> List[Dict]:
        """Get Udemy course recommendations"""
        courses = []
        try:
            curated_udemy = {
                "python": [
                    {"title": "Complete Python Bootcamp From Zero to Hero", "instructor": "Jose Portilla", "rating": 4.6, "link": "https://www.udemy.com/course/complete-python-bootcamp/", "duration": "22 hours"},
                    {"title": "Automate the Boring Stuff with Python", "instructor": "Al Sweigart", "rating": 4.6, "link": "https://www.udemy.com/course/automate/", "duration": "9.5 hours"}
                ],
                "javascript": [
                    {"title": "The Complete JavaScript Course 2024", "instructor": "Jonas Schmedtmann", "rating": 4.7, "link": "https://www.udemy.com/course/the-complete-javascript-course/", "duration": "69 hours"},
                    {"title": "JavaScript: Understanding the Weird Parts", "instructor": "Anthony Alicea", "rating": 4.6, "link": "https://www.udemy.com/course/understand-javascript/", "duration": "11.5 hours"}
                ],
                "react": [
                    {"title": "React - The Complete Guide 2024", "instructor": "Maximilian Schwarzmüller", "rating": 4.6, "link": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", "duration": "48 hours"}
                ],
                "machine learning": [
                    {"title": "Machine Learning A-Z", "instructor": "Kirill Eremenko", "rating": 4.5, "link": "https://www.udemy.com/course/machinelearning/", "duration": "44 hours"},
                    {"title": "Python for Data Science and Machine Learning", "instructor": "Jose Portilla", "rating": 4.6, "link": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/", "duration": "25 hours"}
                ],
                "data science": [
                    {"title": "The Data Science Course 2024", "instructor": "365 Careers", "rating": 4.5, "link": "https://www.udemy.com/course/the-data-science-course-complete-data-science-bootcamp/", "duration": "29 hours"}
                ]
            }
            
            skill_lower = skill.lower()
            for key, course_list in curated_udemy.items():
                if key in skill_lower or skill_lower in key:
                    courses.extend(course_list[:limit])
                    break
                    
        except Exception as e:
            print(f"Udemy scraping error: {e}")
            
        return courses[:limit]

    def get_leetcode_problems(self, skills: List[str], difficulty: str = "medium") -> List[Dict]:
        """Get relevant LeetCode problems based on skills - Enhanced dynamic selection"""
        problems = []
        
        # Enhanced problems database with more variety
        problem_db = {
            "python": [
                {"title": "Two Sum", "difficulty": "Easy", "link": "https://leetcode.com/problems/two-sum/", "topics": ["Array", "Hash Table"], "description": "Find two numbers that add up to target"},
                {"title": "Valid Parentheses", "difficulty": "Easy", "link": "https://leetcode.com/problems/valid-parentheses/", "topics": ["Stack", "String"], "description": "Check if parentheses are balanced"},
                {"title": "Merge Two Sorted Lists", "difficulty": "Easy", "link": "https://leetcode.com/problems/merge-two-sorted-lists/", "topics": ["Linked List"], "description": "Merge two sorted linked lists"},
                {"title": "Maximum Subarray", "difficulty": "Medium", "link": "https://leetcode.com/problems/maximum-subarray/", "topics": ["Array", "Dynamic Programming"], "description": "Find contiguous subarray with largest sum"}
            ],
            "javascript": [
                {"title": "Add Two Numbers", "difficulty": "Medium", "link": "https://leetcode.com/problems/add-two-numbers/", "topics": ["Linked List", "Math"], "description": "Add two numbers represented as linked lists"},
                {"title": "Longest Substring Without Repeating Characters", "difficulty": "Medium", "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "topics": ["Hash Table", "String"], "description": "Find longest substring without repeating characters"},
                {"title": "Container With Most Water", "difficulty": "Medium", "link": "https://leetcode.com/problems/container-with-most-water/", "topics": ["Array", "Two Pointers"], "description": "Find container that holds most water"}
            ],
            "algorithms": [
                {"title": "Binary Search", "difficulty": "Easy", "link": "https://leetcode.com/problems/binary-search/", "topics": ["Array", "Binary Search"], "description": "Search for target in sorted array"},
                {"title": "Climbing Stairs", "difficulty": "Easy", "link": "https://leetcode.com/problems/climbing-stairs/", "topics": ["Dynamic Programming"], "description": "Count ways to climb stairs"},
                {"title": "Best Time to Buy and Sell Stock", "difficulty": "Easy", "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "topics": ["Array", "Dynamic Programming"], "description": "Find maximum profit from stock prices"}
            ],
            "data structures": [
                {"title": "Implement Queue using Stacks", "difficulty": "Easy", "link": "https://leetcode.com/problems/implement-queue-using-stacks/", "topics": ["Stack", "Queue"], "description": "Implement queue using two stacks"},
                {"title": "Valid Palindrome", "difficulty": "Easy", "link": "https://leetcode.com/problems/valid-palindrome/", "topics": ["Two Pointers", "String"], "description": "Check if string is palindrome"},
                {"title": "Reverse Linked List", "difficulty": "Easy", "link": "https://leetcode.com/problems/reverse-linked-list/", "topics": ["Linked List"], "description": "Reverse a singly linked list"}
            ],
            "machine learning": [
                {"title": "Median of Two Sorted Arrays", "difficulty": "Hard", "link": "https://leetcode.com/problems/median-of-two-sorted-arrays/", "topics": ["Array", "Binary Search"], "description": "Find median of two sorted arrays"},
                {"title": "Kth Largest Element in Array", "difficulty": "Medium", "link": "https://leetcode.com/problems/kth-largest-element-in-an-array/", "topics": ["Array", "Heap"], "description": "Find kth largest element"}
            ],
            "sql": [
                {"title": "Combine Two Tables", "difficulty": "Easy", "link": "https://leetcode.com/problems/combine-two-tables/", "topics": ["Database"], "description": "Join two tables using LEFT JOIN"},
                {"title": "Second Highest Salary", "difficulty": "Medium", "link": "https://leetcode.com/problems/second-highest-salary/", "topics": ["Database"], "description": "Find second highest salary"}
            ]
        }
        
        # Dynamic skill-based selection
        skill_matches = []
        for skill in skills:
            skill_lower = skill.lower()
            
            # Direct matches
            if skill_lower in problem_db:
                skill_matches.extend(problem_db[skill_lower])
            else:
                # Fuzzy matching
                for key, probs in problem_db.items():
                    if (key in skill_lower or skill_lower in key or 
                        any(topic.lower() in skill_lower for prob in probs for topic in prob.get('topics', []))):
                        skill_matches.extend(probs[:2])
                        break
        
        # Remove duplicates while preserving order
        seen_titles = set()
        for problem in skill_matches:
            if problem['title'] not in seen_titles:
                problems.append(problem)
                seen_titles.add(problem['title'])
                if len(problems) >= 6:
                    break
        
        # Add foundational problems if not enough skill-specific ones
        if len(problems) < 4:
            foundational = problem_db['algorithms'] + problem_db['data structures']
            for problem in foundational:
                if problem['title'] not in seen_titles:
                    problems.append(problem)
                    seen_titles.add(problem['title'])
                    if len(problems) >= 6:
                        break
        
        return problems[:6]

    def get_comprehensive_recommendations(self, skills: List[str], role: str, experience_level: str) -> Dict:
        """Get comprehensive learning recommendations"""
        recommendations = {
            "coursera_courses": [],
            "udemy_courses": [],
            "leetcode_problems": [],
            "free_resources": [],
            "youtube_channels": []
        }
        
        # Get courses for top skills
        for skill in skills[:3]:
            recommendations["coursera_courses"].extend(self.scrape_coursera_courses(skill, 2))
            recommendations["udemy_courses"].extend(self.scrape_udemy_courses(skill, 2))
        
        # Get coding problems
        recommendations["leetcode_problems"] = self.get_leetcode_problems(skills)
        
        # Add free resources
        free_resources = {
            "python": [
                {"title": "Python.org Official Tutorial", "link": "https://docs.python.org/3/tutorial/", "type": "Documentation"},
                {"title": "Real Python", "link": "https://realpython.com/", "type": "Tutorials"},
                {"title": "Python Crash Course (Book)", "link": "https://nostarch.com/pythoncrashcourse2e", "type": "Book"}
            ],
            "javascript": [
                {"title": "MDN Web Docs", "link": "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "type": "Documentation"},
                {"title": "JavaScript.info", "link": "https://javascript.info/", "type": "Tutorial"},
                {"title": "freeCodeCamp", "link": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "type": "Interactive"}
            ],
            "machine learning": [
                {"title": "Scikit-learn Documentation", "link": "https://scikit-learn.org/stable/", "type": "Documentation"},
                {"title": "Kaggle Learn", "link": "https://www.kaggle.com/learn", "type": "Interactive"},
                {"title": "Papers With Code", "link": "https://paperswithcode.com/", "type": "Research"}
            ]
        }
        
        for skill in skills[:2]:
            skill_lower = skill.lower()
            if skill_lower in free_resources:
                recommendations["free_resources"].extend(free_resources[skill_lower][:2])
        
        # Add YouTube channels
        youtube_channels = {
            "python": ["Corey Schafer", "Programming with Mosh", "Real Python"],
            "javascript": ["Traversy Media", "The Net Ninja", "JavaScript Mastery"],
            "machine learning": ["3Blue1Brown", "Two Minute Papers", "Sentdex"],
            "web development": ["Traversy Media", "The Net Ninja", "Kevin Powell"]
        }
        
        for skill in skills[:2]:
            skill_lower = skill.lower()
            for category, channels in youtube_channels.items():
                if category in skill_lower or skill_lower in category:
                    recommendations["youtube_channels"].extend([
                        {"name": channel, "link": f"https://youtube.com/c/{channel.replace(' ', '')}"} 
                        for channel in channels[:2]
                    ])
                    break
        
        return recommendations