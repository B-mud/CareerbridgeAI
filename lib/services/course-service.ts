/**
 * Course Fetching Service
 * Fetches learning resources from various platforms
 */

export interface CourseResource {
  title: string
  type: "course" | "article" | "video" | "documentation"
  link: string
  provider: string
  duration?: string
  rating?: number
  free: boolean
}

export async function fetchRoadmapShRoadmap(
  roadmapPath: string
): Promise<any> {
  try {
    // Fetch from roadmap.sh API - public endpoint
    // Path like: 'python', 'backend', 'frontend', etc.
    const res = await fetch(
      `https://roadmap.sh/api/v1/roadmaps/${roadmapPath}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!res.ok) {
      console.warn(`Failed to fetch roadmap: ${roadmapPath}`)
      return null
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.warn(`Error fetching roadmap ${roadmapPath}:`, error)
    return null
  }
}

export async function searchCourses(
  skill: string,
  preferences?: {
    free?: boolean
    platform?: string
    maxDuration?: number
  }
): Promise<CourseResource[]> {
  // Curated course database with direct links
  const courseDatabase: Record<string, CourseResource[]> = {
    python: [
      {
        title: "Python for Everybody",
        type: "course",
        link: "https://www.py4e.com/",
        provider: "Python.org",
        duration: "12 weeks",
        free: true,
      },
      {
        title: "Python Basics",
        type: "video",
        link: "https://www.youtube.com/watch?v=rfscVS0vtik",
        provider: "YouTube",
        duration: "11 hours",
        free: true,
      },
      {
        title: "Complete Python Bootcamp",
        type: "course",
        link: "https://www.udemy.com/course/complete-python-bootcamp/",
        provider: "Udemy",
        duration: "22 hours",
        free: false,
      },
    ],
    javascript: [
      {
        title: "JavaScript.info",
        type: "documentation",
        link: "https://javascript.info/",
        provider: "JavaScript.info",
        free: true,
      },
      {
        title: "The Complete JavaScript Course",
        type: "course",
        link: "https://www.udemy.com/course/the-complete-javascript-course/",
        provider: "Udemy",
        duration: "69 hours",
        free: false,
      },
      {
        title: "JavaScript Tutorial",
        type: "video",
        link: "https://www.youtube.com/watch?v=W6NZfCO5tTE",
        provider: "YouTube",
        duration: "4 hours",
        free: true,
      },
    ],
    react: [
      {
        title: "React Official Tutorial",
        type: "documentation",
        link: "https://react.dev/learn",
        provider: "React",
        free: true,
      },
      {
        title: "React Complete Guide",
        type: "course",
        link: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        provider: "Udemy",
        duration: "48 hours",
        free: false,
      },
      {
        title: "React Fundamentals",
        type: "video",
        link: "https://www.youtube.com/watch?v=sBws8MSXN7s",
        provider: "YouTube",
        duration: "11 hours",
        free: true,
      },
    ],
    nodejs: [
      {
        title: "Node.js Official Docs",
        type: "documentation",
        link: "https://nodejs.org/docs/",
        provider: "Node.js",
        free: true,
      },
      {
        title: "The Complete Node.js Developer",
        type: "course",
        link: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",
        provider: "Udemy",
        duration: "39 hours",
        free: false,
      },
    ],
    sql: [
      {
        title: "SQL Tutorial",
        type: "documentation",
        link: "https://www.w3schools.com/sql/",
        provider: "W3Schools",
        free: true,
      },
      {
        title: "SQL for Beginners",
        type: "video",
        link: "https://www.youtube.com/watch?v=xiUTqnI6xk8",
        provider: "YouTube",
        duration: "4 hours",
        free: true,
      },
      {
        title: "The Complete SQL Bootcamp",
        type: "course",
        link: "https://www.udemy.com/course/the-complete-sql-bootcamp/",
        provider: "Udemy",
        duration: "14 hours",
        free: false,
      },
    ],
    docker: [
      {
        title: "Docker Official Docs",
        type: "documentation",
        link: "https://docs.docker.com/",
        provider: "Docker",
        free: true,
      },
      {
        title: "Docker for Beginners",
        type: "video",
        link: "https://www.youtube.com/watch?v=3c-iBn73dDE",
        provider: "YouTube",
        duration: "2 hours",
        free: true,
      },
    ],
    kubernetes: [
      {
        title: "Kubernetes Official Docs",
        type: "documentation",
        link: "https://kubernetes.io/docs/",
        provider: "Kubernetes",
        free: true,
      },
      {
        title: "Kubernetes for Beginners",
        type: "video",
        link: "https://www.youtube.com/watch?v=X48VuDVv0cw",
        provider: "YouTube",
        duration: "4 hours",
        free: true,
      },
    ],
    "machine learning": [
      {
        title: "Fast.ai",
        type: "course",
        link: "https://www.fast.ai/",
        provider: "Fast.ai",
        free: true,
      },
      {
        title: "Andrew Ng ML Specialization",
        type: "course",
        link: "https://www.coursera.org/specializations/machine-learning-introduction",
        provider: "Coursera",
        free: false,
      },
    ],
    git: [
      {
        title: "Git Official Book",
        type: "documentation",
        link: "https://git-scm.com/book/en/v2",
        provider: "Git",
        free: true,
      },
      {
        title: "Git & GitHub Tutorial",
        type: "video",
        link: "https://www.youtube.com/watch?v=RGOj5yH7evk",
        provider: "YouTube",
        duration: "1 hour",
        free: true,
      },
    ],
  }

  const lowerSkill = skill.toLowerCase()
  let courses = courseDatabase[lowerSkill] || []

  // Filter by preferences
  if (preferences?.free) {
    courses = courses.filter((c) => c.free)
  }

  if (preferences?.platform) {
    courses = courses.filter(
      (c) =>
        c.provider.toLowerCase().includes(preferences.platform!.toLowerCase()) ||
        c.type === preferences.platform
    )
  }

  return courses
}

export async function buildRoadmapNodes(
  targetRole: string,
  skills: string[],
  missingSkills: string[]
) {
  // Map role to roadmap path
  const roleToRoadmap: Record<string, string> = {
    "software engineer": "backend",
    "backend developer": "backend",
    "frontend developer": "frontend",
    "full stack developer": "full-stack",
    "devops engineer": "devops",
    "data scientist": "datastructures-and-algorithms",
    "ui/ux designer": "ux-design",
  }

  const roadmapPath =
    roleToRoadmap[targetRole.toLowerCase()] || "backend"

  // Build nodes from missing skills
  const nodes = await Promise.all(
    missingSkills.slice(0, 8).map(async (skill, index) => {
      const resources = await searchCourses(skill)

      return {
        id: `node-${index}`,
        title: skill.charAt(0).toUpperCase() + skill.slice(1),
        description: `Master ${skill} to improve your ${targetRole} capabilities`,
        skills: [skill],
        resources: resources.slice(0, 3),
        difficulty: index < 2 ? "beginner" : index < 5 ? "intermediate" : "advanced",
        estimatedTime:
          index < 2 ? "2-3 weeks" : index < 5 ? "3-4 weeks" : "4-6 weeks",
        completed: false,
      }
    })
  )

  return nodes
}

export async function transformRoadmapShData(
  roadmapData: any,
  detectedSkills: string[]
) {
  // Transform roadmap.sh JSON format to our node format
  if (!roadmapData?.nodes) {
    return []
  }

  const nodes = roadmapData.nodes.map((node: any, index: number) => ({
    id: node.id || `node-${index}`,
    title: node.title || "Untitled",
    description: node.description || "",
    skills: node.skills || [],
    resources: (node.resources || []).map((r: any) => ({
      title: r.title || "Resource",
      type: r.type || "course",
      link: r.link || "#",
      provider: r.provider || "Unknown",
      duration: r.duration,
      free: r.free !== false,
    })),
    difficulty: node.difficulty || "intermediate",
    estimatedTime: node.estimatedTime || "2-3 weeks",
    completed:
      detectedSkills.some((s) =>
        node.skills?.some((ns: string) =>
          ns.toLowerCase().includes(s.toLowerCase())
        )
      ),
  }))

  return nodes
}
