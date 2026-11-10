"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink, BookOpen, Video, Code, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CourseLink {
  title: string
  url: string
  type: "course" | "article" | "video" | "documentation"
  platform: string
}

interface Topic {
  id: string
  name: string
  description: string
  courses: CourseLink[]
  subtopics?: Topic[]
  completed?: boolean
}

interface RoadmapCategory {
  id: string
  title: string
  description: string
  topics: Topic[]
}

const SOFTWARE_ENGINEER_ROADMAP: RoadmapCategory[] = [
  {
    id: "foundation",
    title: "Foundation",
    description: "Core programming fundamentals",
    topics: [
      {
        id: "html-css",
        name: "HTML & CSS",
        description: "Web markup and styling basics",
        courses: [
          {
            title: "HTML Foundation",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "CSS Mastery",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Responsive Web Design",
            url: "https://www.freecodecamp.org/learn/responsive-web-design",
            type: "course",
            platform: "FreeCodeCamp"
          }
        ]
      },
      {
        id: "javascript",
        name: "JavaScript",
        description: "JavaScript fundamentals and ES6+",
        courses: [
          {
            title: "JavaScript Fundamentals",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "ES6+ Features",
            url: "https://www.udemy.com/course/the-complete-javascript-course-2024",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "JavaScript for Beginners",
            url: "https://www.youtube.com/playlist?list=PLlasXeu_Kxsr-PcMg4sDw4VCT9H9Zj1Yr",
            type: "video",
            platform: "YouTube"
          }
        ]
      }
    ]
  },
  {
    id: "frontend",
    title: "Frontend Development",
    description: "Build interactive user interfaces",
    topics: [
      {
        id: "react",
        name: "React.js",
        description: "Modern frontend libraries and components",
        courses: [
          {
            title: "React Complete Course",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "React Hooks & Context",
            url: "https://www.udemy.com/course/react-the-complete-guide",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "React Documentation",
            url: "https://react.dev",
            type: "documentation",
            platform: "Official"
          }
        ]
      },
      {
        id: "state-management",
        name: "State Management",
        description: "Redux, Context API, Zustand",
        courses: [
          {
            title: "Redux Essentials",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Redux Official Tutorial",
            url: "https://redux.js.org/tutorials/essentials/part-1-overview-concepts",
            type: "documentation",
            platform: "Official"
          },
          {
            title: "State Management Deep Dive",
            url: "https://www.udemy.com/course/react-redux-the-complete-guide",
            type: "course",
            platform: "Udemy"
          }
        ]
      },
      {
        id: "tailwind",
        name: "Tailwind CSS",
        description: "Utility-first CSS framework",
        courses: [
          {
            title: "Tailwind CSS Course",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Tailwind Documentation",
            url: "https://tailwindcss.com/docs",
            type: "documentation",
            platform: "Official"
          }
        ]
      }
    ]
  },
  {
    id: "backend",
    title: "Backend Development",
    description: "Server-side programming and APIs",
    topics: [
      {
        id: "nodejs",
        name: "Node.js & Express",
        description: "JavaScript runtime and web framework",
        courses: [
          {
            title: "Node.js Complete Course",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Express.js Fundamentals",
            url: "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "Node.js Documentation",
            url: "https://nodejs.org/en/docs",
            type: "documentation",
            platform: "Official"
          }
        ]
      },
      {
        id: "python",
        name: "Python",
        description: "Versatile backend language",
        courses: [
          {
            title: "Python Fundamentals",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Complete Python Course",
            url: "https://www.udemy.com/course/complete-python-bootcamp",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "Python for Everyone",
            url: "https://www.freecodecamp.org/learn/python-for-everybody",
            type: "course",
            platform: "FreeCodeCamp"
          }
        ]
      },
      {
        id: "fastapi",
        name: "FastAPI",
        description: "Modern Python web framework",
        courses: [
          {
            title: "FastAPI Complete Guide",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "FastAPI Documentation",
            url: "https://fastapi.tiangolo.com",
            type: "documentation",
            platform: "Official"
          }
        ]
      }
    ]
  },
  {
    id: "database",
    title: "Database & SQL",
    description: "Data persistence and management",
    topics: [
      {
        id: "sql",
        name: "SQL Fundamentals",
        description: "Relational databases and queries",
        courses: [
          {
            title: "SQL Mastery",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "The Complete SQL Bootcamp",
            url: "https://www.udemy.com/course/the-complete-sql-bootcamp",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "SQL Tutorial",
            url: "https://www.w3schools.com/sql",
            type: "documentation",
            platform: "W3Schools"
          }
        ]
      },
      {
        id: "postgresql",
        name: "PostgreSQL",
        description: "Advanced relational database",
        courses: [
          {
            title: "PostgreSQL Advanced",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "PostgreSQL Documentation",
            url: "https://www.postgresql.org/docs",
            type: "documentation",
            platform: "Official"
          }
        ]
      },
      {
        id: "mongodb",
        name: "MongoDB",
        description: "NoSQL document database",
        courses: [
          {
            title: "MongoDB Course",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "MongoDB University",
            url: "https://university.mongodb.com",
            type: "course",
            platform: "Official"
          }
        ]
      }
    ]
  },
  {
    id: "devops",
    title: "DevOps & Tools",
    description: "Deployment and infrastructure",
    topics: [
      {
        id: "docker",
        name: "Docker",
        description: "Containerization platform",
        courses: [
          {
            title: "Docker Complete Course",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Docker for Developers",
            url: "https://www.udemy.com/course/docker-kubernetes-complete-guide",
            type: "course",
            platform: "Udemy"
          },
          {
            title: "Docker Documentation",
            url: "https://docs.docker.com",
            type: "documentation",
            platform: "Official"
          }
        ]
      },
      {
        id: "git",
        name: "Git & GitHub",
        description: "Version control system",
        courses: [
          {
            title: "Git Mastery",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "Git Complete Course",
            url: "https://www.udemy.com/course/git-and-github-bootcamp",
            type: "course",
            platform: "Udemy"
          }
        ]
      },
      {
        id: "aws",
        name: "AWS Cloud",
        description: "Amazon Web Services",
        courses: [
          {
            title: "AWS Certified Solutions Architect",
            url: "",
            type: "course",
            platform: "Recommended"
          },
          {
            title: "AWS Fundamentals",
            url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate",
            type: "course",
            platform: "Udemy"
          }
        ]
      }
    ]
  }
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />
    case "article":
      return <BookOpen className="h-4 w-4" />
    case "code":
      return <Code className="h-4 w-4" />
    default:
      return <BookOpen className="h-4 w-4" />
  }
}

function TopicCard({ topic, onExpand }: { topic: Topic; onExpand: () => void }) {
  const [fetchingFor, setFetchingFor] = useState<number | null>(null);

  const handleCourseClick = async (course: CourseLink, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (course.url) {
      window.open(course.url, "_blank");
      return;
    }
    setFetchingFor(idx);
    try {
      const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(course.title)}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(course.title + ' tutorial')}`, "_blank");
    } finally {
      setFetchingFor(null);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{topic.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="ml-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topic.courses.slice(0, 3).map((course, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={(e) => handleCourseClick(course, idx, e)}
            >
              {fetchingFor === idx ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Fetching...</>
              ) : (
                <>
                  {course.type === "video" && <Video className="h-3 w-3 mr-1" />}
                  {course.type === "documentation" && <Code className="h-3 w-3 mr-1" />}
                  {course.type === "article" && <BookOpen className="h-3 w-3 mr-1" />}
                  {course.platform}
                </>
              )}
            </Badge>
          ))}
          {topic.courses.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{topic.courses.length - 3} more</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function LearningRoadmap({ role = "software-engineer" }) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [fetchingForId, setFetchingForId] = useState<string | null>(null)

  const handleOpenCourse = async (course: CourseLink, id: string) => {
    if (course.url) {
      window.open(course.url, "_blank");
      return;
    }
    setFetchingForId(id);
    try {
      const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(course.title)}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(course.title + ' tutorial')}`, "_blank");
    } finally {
      setFetchingForId(null);
    }
  }

  return (
    <div className="space-y-8 py-6">
      {SOFTWARE_ENGINEER_ROADMAP.map((category) => (
        <div key={category.id} className="space-y-4">
          {/* Category Title */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
            <h2 className="text-2xl font-bold">{category.title}</h2>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.topics.map((topic) => (
              <div key={topic.id}>
                <TopicCard
                  topic={topic}
                  onExpand={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                />

                {/* Expanded View */}
                {expandedTopic === topic.id && (
                  <Card className="mt-3 border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Available Courses & Resources:</h4>
                        {topic.courses.map((course, idx) => {
                           const courseId = `${topic.id}-${idx}`;
                           return (
                          <Button
                            key={idx}
                            variant="outline"
                            className="w-full justify-between h-auto py-3 px-4"
                            onClick={() => handleOpenCourse(course, courseId)}
                            disabled={fetchingForId === courseId}
                          >
                            <div className="flex items-start gap-3 flex-1 text-left">
                              {getTypeIcon(course.type)}
                              <div>
                                <p className="font-medium text-sm">{course.title}</p>
                                <p className="text-xs text-muted-foreground">{course.platform}</p>
                              </div>
                            </div>
                            {fetchingForId === courseId ? (
                              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-muted-foreground" />
                            ) : (
                              <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            )}
                          </Button>
                        )})}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
