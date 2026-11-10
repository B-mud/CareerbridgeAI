"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, BookOpen, Code, Trophy, Clock, Star, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { SessionManager } from "@/lib/session-manager"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { logUserActivity } from "@/lib/activity-logger"

// Lazy load heavy components for better initial load performance
const RoadmapGraph = dynamic(() => import("@/components/roadmap-graph").then(m => ({ default: m.RoadmapGraph })), {
  loading: () => <div className="h-96 bg-muted rounded-lg animate-pulse" />,
  ssr: false
})
const RoadmapInteractive = dynamic(() => import("@/components/roadmap-interactive").then(m => ({ default: m.RoadmapInteractive })), {
  loading: () => <div className="h-96 bg-muted rounded-lg animate-pulse" />,
  ssr: false
})
const LearningRoadmap = dynamic(() => import("@/components/learning-roadmap").then(m => ({ default: m.LearningRoadmap })), {
  loading: () => <div className="h-96 bg-muted rounded-lg animate-pulse" />,
  ssr: false
})

// Import performance and caching utilities
import { responseCache } from "@/lib/response-cache"
import { performanceMonitor } from "@/lib/performance-monitor"

interface LeetCodeProblem {
  title: string
  difficulty: string
  link: string
  platform?: string
}

interface Course {
  title: string
  platform?: string
  provider?: string
  duration: string
  rating: number
  link: string
  instructor?: string
  cost_efficiency?: string
}

interface FreeResource {
  title: string
  type: string
  link: string
}

interface LearningResource {
  leetcode_problems: LeetCodeProblem[]
  courses: Course[]
  personalized_recommendations: Array<{
    skill: string
    priority: string
    action: string
    estimated_time: string
    resources: Array<{
      type?: string
      name: string
      platform: string
      link?: string
    }>
  }>
  free_resources?: FreeResource[]
  youtube_channels?: any[]
  target_role?: string
  detected_skills?: string[]
  missing_skills?: string[]
}

export default function RecommendationsPage() {
  const [resources, setResources] = useState<LearningResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStep, setLoadingStep] = useState("Loading your profile...")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [hasResume, setHasResume] = useState(false)
  const [resumeFileId, setResumeFileId] = useState<string | null>(null)
  const [completedRoadmap, setCompletedRoadmap] = useState<Record<number, boolean>>({})
  const [savedCourses, setSavedCourses] = useState<string[]>([])
  const [fetchingUrlFor, setFetchingUrlFor] = useState<number | string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoading(true)

      // Step 1: Get auth token
      setLoadingStep("Authenticating...")
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Step 2: Try to get fileId from localStorage first
      let fileId = SessionManager.getFileId()
      let profile = SessionManager.getUserProfile()
      setUserProfile(profile)

      // Step 3: If no fileId, fetch from backend (returning user)
      if (!fileId && token) {
        setLoadingStep("Retrieving your resume data...")
        try {
          const latestRes = await fetch('http://localhost:8000/api/resume/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (latestRes.ok) {
            const latestData = await latestRes.json()
            if (latestData.has_resume && typeof latestData.file_id === 'string') {
              fileId = latestData.file_id as string
              SessionManager.saveFileId(fileId as string)
            }
          }
        } catch (e) {
          console.error("Failed to fetch latest resume:", e)
        }
      }

      if (!fileId) {
        // Truly no resume uploaded yet
        setHasResume(false)
        setResources(null)
        setLoading(false)
        return
      }

      setHasResume(true)
      setResumeFileId(fileId)

      // Step 4: Fetch full analysis from backend to restore session data
      setLoadingStep("Analyzing your skills...")
      let analysis: any = SessionManager.getResumeAnalysis()
      if (token) {
        try {
          const analysisRes = await fetch(`http://localhost:8000/api/resume/full-analysis/${fileId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (analysisRes.ok) {
            const freshAnalysis = await analysisRes.json()
            analysis = { ...analysis, ...freshAnalysis }
            SessionManager.saveResumeAnalysis(analysis)
          }
        } catch (e) {
          console.error("Failed to fetch full analysis:", e)
        }
      }

      // Step 5: Fetch recommendations with timeout and partial loading
      setLoadingStep("Loading your learning resources...")
      
      performanceMonitor.mark("fetch-recommendations")

      // Quick timeout fetcher with caching and error handling
      const fetchWithCacheAndTimeout = async (
        url: string,
        timeout = 5000,
        cacheTTL = 10 * 60 * 1000 // 10 minutes
      ): Promise<Response | null> => {
        // Check cache first
        const cached = responseCache.get(url)
        if (cached) {
          console.log(`Cache hit for ${url}`)
          return new Response(JSON.stringify(cached), { status: 200 })
        }

        try {
          const response = await Promise.race<Response | null>([
            fetch(url),
            new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), timeout)
            ),
          ])
          return response
        } catch (error) {
          console.error(`Fetch failed for ${url}:`, error)
          return null
        }
      }

      // Start all fetches in parallel with caching
      const promises: Promise<Response | null>[] = [
        fetchWithCacheAndTimeout(`http://localhost:8000/api/recommendations/courses/${fileId}?timeout=4`, 5000, 10 * 60 * 1000),
        fetchWithCacheAndTimeout(`http://localhost:8000/api/recommendations/personalized/${fileId}?timeout=10`, 12000, 15 * 60 * 1000),
        fetchWithCacheAndTimeout(`http://localhost:8000/api/recommendations/leetcode/${fileId}?timeout=3`, 4000, 10 * 60 * 1000),
      ]

      // Wait for all but handle partial failures
      const results = await Promise.all(promises)
      
      // Cast results to proper type
      const [courseRes, personalizedRes, leetcodeRes] = results as (Response | null)[]
      
      // Parse responses safely with proper type checking and caching
      let coursesData: Course[] = []
      let personalizedData: any = null
      let leetcodeData: LeetCodeProblem[] = []

      try {
        if (courseRes?.ok) {
          coursesData = await courseRes.json()
          responseCache.set(`courses-${fileId}`, coursesData, 10 * 60 * 1000)
        }
      } catch (e) {
        console.error("Failed to parse courses:", e)
      }

      try {
        if (personalizedRes?.ok) {
          personalizedData = await personalizedRes.json()
          responseCache.set(`personalized-${fileId}`, personalizedData, 15 * 60 * 1000)
        }
      } catch (e) {
        console.error("Failed to parse personalized:", e)
      }

      try {
        if (leetcodeRes?.ok) {
          leetcodeData = await leetcodeRes.json()
          responseCache.set(`leetcode-${fileId}`, leetcodeData, 10 * 60 * 1000)
        }
      } catch (e) {
        console.error("Failed to parse leetcode:", e)
      }

      performanceMonitor.measure("fetch-recommendations", {
        courses: coursesData.length,
        personalized: !!personalizedData,
        leetcode: leetcodeData.length
      })

      // Validate and normalize missing_skills to array
      const missing_skills = Array.isArray(analysis?.missing_skills) 
        ? analysis.missing_skills 
        : (typeof analysis?.missing_skills === 'string' 
            ? [analysis.missing_skills] 
            : [])
      
      const detected_skills = Array.isArray(analysis?.detected_skills)
        ? analysis.detected_skills
        : (typeof analysis?.detected_skills === 'string'
            ? [analysis.detected_skills]
            : [])
      
      // Build the roadmap from personalized data with validation
      const roadmap = buildRoadmap(personalizedData, analysis)

      setResources({
        courses: coursesData.length > 0 ? coursesData : getFallbackCourses(analysis),
        personalized_recommendations: roadmap,
        leetcode_problems: leetcodeData.length > 0 ? leetcodeData : getDefaultPractice(analysis),
        target_role: "Software Engineer", // Changed from Ai Ml Engineer
        detected_skills: detected_skills,
        missing_skills: missing_skills,
      })

      await logUserActivity({
        action_type: "learning_path_accessed",
        details: {
          file_id: fileId,
          target_role: analysis?.target_role || personalizedData?.target_role || "unknown",
          roadmap_steps: roadmap.length,
          course_count: coursesData.length,
          problem_count: leetcodeData.length,
        },
      })
    } catch (error) {
      console.error("Failed to load recommendations:", error)
      setResources(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!resumeFileId || typeof window === "undefined") return
    const storedRoadmap = localStorage.getItem(`roadmap_progress_${resumeFileId}`)
    const storedCourses = localStorage.getItem(`saved_courses_${resumeFileId}`)
    if (storedRoadmap) {
      setCompletedRoadmap(JSON.parse(storedRoadmap))
    }
    if (storedCourses) {
      setSavedCourses(JSON.parse(storedCourses))
    }
  }, [resumeFileId])

  const toggleRoadmapStep = async (index: number, skill: string) => {
    const updated = { ...completedRoadmap, [index]: !completedRoadmap[index] }
    setCompletedRoadmap(updated)
    if (resumeFileId && typeof window !== "undefined") {
      localStorage.setItem(`roadmap_progress_${resumeFileId}`, JSON.stringify(updated))
    }
    await logUserActivity({
      action_type: "course_completed",
      details: {
        step_index: index,
        skill,
        completed: updated[index],
      },
    })
  }

  const toggleCourseSave = async (courseTitle: string) => {
    const alreadySaved = savedCourses.includes(courseTitle)
    const updated = alreadySaved
      ? savedCourses.filter((c) => c !== courseTitle)
      : [...savedCourses, courseTitle]
    setSavedCourses(updated)
    if (resumeFileId && typeof window !== "undefined") {
      localStorage.setItem(`saved_courses_${resumeFileId}`, JSON.stringify(updated))
    }
    await logUserActivity({
      action_type: alreadySaved ? "course_started" : "course_completed",
      details: {
        course_title: courseTitle,
        saved: !alreadySaved,
      },
    })
  }

  const handleStartCourse = async (course: Course) => {
    await logUserActivity({
      action_type: "course_started",
      details: {
        course_name: course.title,
        platform: course.platform || course.provider || "Unknown",
        duration: course.duration,
      },
    })
  }

  const handleSolveProblem = async (problem: LeetCodeProblem) => {
    await logUserActivity({
      action_type: "practice_problem_solved",
      details: {
        problem_name: problem.title,
        difficulty: problem.difficulty,
      },
    })
  }

  /** Build roadmap nodes for interactive component */
  const buildRoadmapNodes = (personalizedData: any, analysis: any) => {
    // Safe type conversion for missing_skills
    let missing: string[] = []
    if (Array.isArray(analysis?.missing_skills)) {
      missing = analysis.missing_skills.filter((s: any) => typeof s === 'string' || typeof s === 'number')
    } else if (typeof analysis?.missing_skills === 'string') {
      missing = [analysis.missing_skills]
    }
    
    const target = analysis?.target_role || 'Software Engineer'
    
    if (missing.length === 0) {
      // Return default roadmap if no missing skills
      return [
        {
          skill: "Programming Fundamentals",
          action: "Master the basics of programming",
          priority: "Critical",
          estimated_time: "4-6 weeks",
          resources: [
            { name: "Fundamentals Course", platform: "freeCodeCamp", link: "https://freecodecap.org" }
          ]
        }
      ]
    }
    
    return missing.slice(0, 8).map((skill: any, i: number) => {
      const skillStr = String(skill).trim()
      const lowerSkill = skillStr.toLowerCase()
      const difficulty: "beginner" | "intermediate" | "advanced" = i < 2 ? "beginner" : i < 5 ? "intermediate" : "advanced"
      
      let defaultLink1 = `https://youtube.com/results?search_query=${encodeURIComponent(skillStr + ' tutorial')}`
      let defaultProvider1 = "YouTube"
      let defaultLink2 = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillStr)}`
      let defaultProvider2 = "Udemy"
      
      if (lowerSkill.includes("data structure") || lowerSkill.includes("algorithm")) {
        defaultLink1 = `https://leetcode.com/problemset/all/?search=${encodeURIComponent(skillStr)}`
        defaultProvider1 = "LeetCode"
        defaultLink2 = `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(skillStr)}`
        defaultProvider2 = "GeeksforGeeks"
      } else if (lowerSkill.includes("react") || lowerSkill.includes("web") || lowerSkill.includes("html") || lowerSkill.includes("css")) {
        defaultLink1 = `https://www.freecodecamp.org/learn/`
        defaultProvider1 = "freeCodeCamp"
        defaultLink2 = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skillStr)}`
        defaultProvider2 = "MDN Web Docs"
      } else if (lowerSkill.includes("python") || lowerSkill.includes("machine learning") || lowerSkill.includes("ai")) {
        defaultLink1 = `https://www.coursera.org/search?query=${encodeURIComponent(skillStr)}`
        defaultProvider1 = "Coursera"
        defaultLink2 = `https://www.kaggle.com/search?q=${encodeURIComponent(skillStr)}`
        defaultProvider2 = "Kaggle"
      }

      const resources = [
        {
          title: `Interactive ${skillStr}`,
          type: "course" as const,
          link: defaultLink1,
          provider: defaultProvider1,
          duration: difficulty === "beginner" ? "2-3 hours" : "4-6 hours",
        },
        {
          title: `${skillStr} Documentation`,
          type: "documentation" as const,
          link: defaultLink2,
          provider: defaultProvider2,
          duration: "Self-paced",
        },
      ]

      return {
        id: `skill-${i}`,
        title: skillStr,
        description: `Master ${skillStr} to advance your ${target} career`,
        skills: [skillStr],
        resources,
        difficulty,
        estimatedTime: i < 2 ? "2-3 weeks" : i < 5 ? "3-4 weeks" : "4-6 weeks",
        completed: completedRoadmap[i] || false,
      }
    })
  }

  /** Build step-by-step roadmap from backend data - Returns RoadmapNode[] */
  const buildRoadmap = (personalizedData: any, analysis: any) => {
    // Use roadmap array if backend returns it
    if (personalizedData?.roadmap && Array.isArray(personalizedData.roadmap)) {
      return personalizedData.roadmap.map((step: any, i: number) => ({
        id: `roadmap-${i}`,
        title: step.step_title || step.skill || `Step ${i + 1}`,
        description: step.description || step.action || "Complete this step",
        skills: [step.skill || `Step ${i + 1}`],
        resources: (step.resources || []).map((r: any) => ({
          title: r.name || r.title || "Resource",
          type: (r.type || "documentation") as "course" | "article" | "video" | "documentation",
          link: r.link || "",
          provider: r.platform || r.provider || "Provider",
          duration: r.duration || r.estimated_time || ""
        })),
        difficulty: ((i < 2 ? "beginner" : i < 4 ? "intermediate" : "advanced") as "beginner" | "intermediate" | "advanced"),
        estimatedTime: step.estimated_time || "2-4 weeks",
        completed: completedRoadmap[i] || false
      }))
    }

    // Build from learning_path (from Gemini or fallback)
    if (personalizedData?.learning_path && Array.isArray(personalizedData.learning_path)) {
      return personalizedData.learning_path.map((item: any, i: number) => {
        // Build resources: prioritize item.resource, then fall back to milestones
        const resourcesArray = []
        
        // Add primary resource if it exists (e.g., Coursera, Udemy link)
        if (item.resource) {
          resourcesArray.push({
            title: `${item.phase || `Phase ${i + 1}`} Course`,
            type: "course" as const,
            link: item.resource,
            provider: item.resource.includes('coursera') ? 'Coursera' : item.resource.includes('udemy') ? 'Udemy' : 'Course Platform',
            duration: item.duration || "Self-paced"
          })
        }
        
        // Add milestone-based resources
        if (item.milestones) {
          const milestoneResources = (item.milestones || []).map((m: string) => {
            const mLower = m.toLowerCase()
            let mLink = `https://youtube.com/results?search_query=${encodeURIComponent(m + ' tutorial')}`
            
            if (mLower.includes("data structure") || mLower.includes("algorithm")) {
              mLink = `https://leetcode.com/problemset/all/?search=${encodeURIComponent(m)}`
            } else if (mLower.includes("react") || mLower.includes("web") || mLower.includes("html") || mLower.includes("css")) {
              mLink = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(m)}`
            } else if (mLower.includes("python") || mLower.includes("machine learning") || mLower.includes("ai")) {
              mLink = `https://www.kaggle.com/search?q=${encodeURIComponent(m)}`
            }

            return {
              title: m,
              type: "documentation" as const,
              link: mLink,
              provider: "Self-study",
              duration: "Self-paced"
            }
          })
          resourcesArray.push(...milestoneResources)
        }
        
        return {
          id: `phase-${i}`,
          title: item.phase || item.skill || `Phase ${i + 1}`,
          description: item.description || (item.skills_to_learn ? `Learn: ${item.skills_to_learn.join(', ')}` : "Complete this phase"),
          skills: item.skills_to_learn || [item.skill || item.phase || `Phase ${i + 1}`],
          resources: resourcesArray,
          difficulty: ((i === 0 ? "beginner" : i < 2 ? "intermediate" : "advanced") as "beginner" | "intermediate" | "advanced"),
          estimatedTime: item.duration || "4-6 weeks",
          completed: completedRoadmap[i] || false
        }
      })
    }

    // Build from missing skills as fallback
    const missing = Array.isArray(analysis?.missing_skills) 
      ? analysis.missing_skills.filter((s: any) => typeof s === 'string' || typeof s === 'number').map(String)
      : (typeof analysis?.missing_skills === 'string' ? [analysis.missing_skills] : [])
    
    if (missing.length > 0) {
      return missing.slice(0, 6).map((skill: string, i: number) => {
        const skillName = String(skill).trim()
        const lowerSkill = skillName.toLowerCase()
        
        // Custom resource routing 
        let defaultLink1 = `https://youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial')}`
        let defaultProvider1 = "YouTube"
        let defaultLink2 = `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillName)}`
        let defaultProvider2 = "Udemy"
        
        if (lowerSkill.includes("data structure") || lowerSkill.includes("algorithm")) {
          defaultLink1 = `https://leetcode.com/problemset/all/?search=${encodeURIComponent(skillName)}`
          defaultProvider1 = "LeetCode"
          defaultLink2 = `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(skillName)}`
          defaultProvider2 = "GeeksforGeeks"
        } else if (lowerSkill.includes("react") || lowerSkill.includes("web") || lowerSkill.includes("html") || lowerSkill.includes("css")) {
          defaultLink1 = `https://www.freecodecamp.org/learn/`
          defaultProvider1 = "freeCodeCamp"
          defaultLink2 = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(skillName)}`
          defaultProvider2 = "MDN Web Docs"
        } else if (lowerSkill.includes("python") || lowerSkill.includes("machine learning") || lowerSkill.includes("ai")) {
          defaultLink1 = `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`
          defaultProvider1 = "Coursera"
          defaultLink2 = `https://www.kaggle.com/search?q=${encodeURIComponent(skillName)}`
          defaultProvider2 = "Kaggle"
        }

        return {
          id: `skill-${i}`,
          title: skillName,
          description: `Build proficiency in ${skillName} through hands-on projects and real-world practice.`,
          skills: [skillName],
          resources: [
            {
              title: `${skillName} - Interactive Learning`,
              type: "course" as const,
              link: defaultLink1,
              provider: defaultProvider1,
              duration: "Self-paced"
            },
            {
              title: `${skillName} Documentation & Practice`,
              type: "documentation" as const,
              link: defaultLink2,
              provider: defaultProvider2,
              duration: "4-6 hours"
            },
          ],
          difficulty: ((i === 0 ? "beginner" : i < 3 ? "intermediate" : "advanced") as "beginner" | "intermediate" | "advanced"),
          estimatedTime: i < 2 ? "2-4 weeks" : "4-6 weeks",
          completed: completedRoadmap[i] || false
        }
      })
    }

    // Ultimate fallback - generic path with correct RoadmapNode structure
    return [
      {
        id: "fund-001",
        title: "Programming Fundamentals",
        description: "Master the basics of programming and problem-solving",
        skills: ["Programming Basics"],
        resources: [
          {
            title: "freeCodeCamp - Responsive Web Design",
            type: "course" as const,
            link: "https://www.freecodecamp.org/",
            provider: "freeCodeCamp",
            duration: "300 hours"
          },
          {
            title: "YouTube - Programming Basics",
            type: "video" as const,
            link: "https://youtube.com/results?search_query=programming+basics",
            provider: "YouTube",
            duration: "10-20 hours"
          },
        ],
        difficulty: "beginner" as const,
        estimatedTime: "4-6 weeks",
        completed: false
      },
      {
        id: "core-002",
        title: "Core Technologies",
        description: "Learn industry-standard tools and frameworks",
        skills: ["Frameworks", "Tools"],
        resources: [
          {
            title: "Udemy - Complete Course",
            type: "course" as const,
            link: "https://www.udemy.com/",
            provider: "Udemy",
            duration: "40-50 hours"
          },
          {
            title: "Coursera - University Courses",
            type: "course" as const,
            link: "https://www.coursera.org/",
            provider: "Coursera",
            duration: "50-60 hours"
          },
        ],
        difficulty: "intermediate" as const,
        estimatedTime: "6-8 weeks",
        completed: false
      },
      {
        id: "proj-003",
        title: "Project Building",
        description: "Apply your skills by building real-world projects",
        skills: ["Project Management", "Implementation"],
        resources: [
          {
            title: "GitHub - Project Ideas",
            type: "documentation" as const,
            link: "https://github.com/",
            provider: "GitHub",
            duration: "Self-paced"
          },
          {
            title: "LeetCode - Practice Problems",
            type: "article" as const,
            link: "https://leetcode.com/",
            provider: "LeetCode",
            duration: "2-3 hours per problem"
          },
        ],
        difficulty: "advanced" as const,
        estimatedTime: "4-6 weeks",
        completed: false
      }
    ]
  }

  const getFallbackCourses = (analysis: any): Course[] => {
    const missing: string[] = (analysis?.missing_skills || []).slice(0, 6)
    const targetRole = String(analysis?.target_role || 'software_engineer').toLowerCase()
    const roleLabel = targetRole.replace(/_/g, ' ')

    const roleCourses: Course[] = [
      { title: `Career Essentials for ${roleLabel}`, platform: "Google Career Certificates", duration: "3-6 months", rating: 4.7, link: "https://grow.google/certificates/", cost_efficiency: "Low cost / Aid available" },
      { title: `University-level foundation for ${roleLabel}`, platform: "OpenLearn", duration: "Self-paced", rating: 4.6, link: "https://www.open.edu/openlearn/", cost_efficiency: "FREE" },
      { title: `Verified ${roleLabel} pathway`, platform: "edX", duration: "6-12 weeks", rating: 4.8, link: "https://www.edx.org/", cost_efficiency: "Audit FREE" },
      { title: `Best free courses for ${roleLabel}`, platform: "Class Central", duration: "Curated", rating: 4.6, link: "https://www.classcentral.com/", cost_efficiency: "Mostly FREE" },
      { title: `Core foundations refresh`, platform: "Khan Academy", duration: "Self-paced", rating: 4.8, link: "https://www.khanacademy.org/", cost_efficiency: "FREE" },
      { title: `Professional skills modules`, platform: "Alison", duration: "2-8 weeks", rating: 4.5, link: "https://alison.com/", cost_efficiency: "FREE / Certificate optional" },
    ]

    const skillCourses: Course[] = missing.map((skill) => ({
      title: `${skill} for ${roleLabel}`,
      platform: "Class Central",
      duration: "4-8 weeks",
      rating: 4.6,
      link: `https://www.classcentral.com/search?q=${encodeURIComponent(skill + ' ' + roleLabel)}`,
      cost_efficiency: "Mostly FREE",
    }))

    return [...skillCourses, ...roleCourses].slice(0, 12)
  }

  const getDefaultPractice = (analysis: any): LeetCodeProblem[] => {
    const missing: string[] = (analysis?.missing_skills || []).map((s: string) => s.toLowerCase())
    const targetRole = String(analysis?.target_role || '').toLowerCase()
    const isDesignRole = /ui|ux|designer|product/.test(targetRole)

    if (isDesignRole) {
      return [
        { title: "UX heuristics challenge", difficulty: "Medium", link: "https://www.nngroup.com/articles/ten-usability-heuristics/", platform: "NN/g" },
        { title: "UI design foundations", difficulty: "Easy", link: "https://www.interaction-design.org/literature/topics/ui-design", platform: "IxDF" },
        { title: "Figma practical exercise", difficulty: "Medium", link: "https://help.figma.com/hc/en-us/articles/360040314193", platform: "Figma" },
        { title: "UX case-study practice", difficulty: "Easy", link: "https://careerfoundry.com/en/blog/ux-design/how-to-write-a-ux-case-study/", platform: "CareerFoundry" },
      ]
    }

    const focusSkill = missing[0] || "algorithms"
    return [
      { title: `${focusSkill} interview set`, difficulty: "Medium", link: `https://leetcode.com/problemset/?search=${encodeURIComponent(focusSkill)}`, platform: "LeetCode" },
      { title: `${focusSkill} coding track`, difficulty: "Easy", link: "https://www.hackerrank.com/domains/tutorials/10-days-of-javascript", platform: "HackerRank" },
      { title: `${focusSkill} kata`, difficulty: "Medium", link: `https://www.codewars.com/kata/search/${encodeURIComponent(focusSkill)}`, platform: "Codewars" },
      { title: `${focusSkill} challenge list`, difficulty: "Medium", link: "https://www.codechef.com/practice", platform: "CodeChef" },
      { title: `${focusSkill} mentored exercises`, difficulty: "Easy", link: "https://exercism.org/tracks", platform: "Exercism" },
      { title: `${focusSkill} advanced problems`, difficulty: "Hard", link: `https://leetcode.com/problemset/all/?search=${encodeURIComponent(focusSkill)}`, platform: "LeetCode" },
    ]
  }



  const getDifficultyColor = (difficulty?: string | null) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800'
    switch (difficulty.toLowerCase().trim()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string | null) => {
    if (!priority) return 'bg-blue-100 text-blue-800'
    switch (priority.toLowerCase().trim()) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">{loadingStep}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!hasResume || !resources) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="text-center py-20">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Resume Data Found</h2>
            <p className="text-muted-foreground mb-6">Upload your resume once to get personalized course recommendations and a learning roadmap.</p>
            <Button asChild size="lg">
              <Link href="/resume-upload">Upload Your Resume</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container-mobile max-w-6xl pt-20 sm:pt-24 pb-6 sm:pb-8 md:pb-12">
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-responsive-title mb-2 sm:mb-3">
            Personalized Learning Path
          </h1>
          <p className="text-responsive-sm text-muted-foreground mb-3 sm:mb-4">
            Based on your resume analysis — targeted courses, roadmap, and practice problems
          </p>
          
          {/* Target Role Badge */}
          {resources.target_role && (
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 mb-3">
              <MapPin className="h-3 w-3 mr-1" />
              Target Role: {resources.target_role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Badge>
          )}
          
          {/* Skills Display - Mobile Wrap */}
          {(resources.detected_skills?.length ?? 0) > 0 && (
            <div className="mobile-stack mt-3 sm:mt-4">
              <span className="text-xs text-muted-foreground font-medium">You have these skills:</span>
              <div className="flex flex-wrap gap-2">
                {resources.detected_skills?.slice(0, 5).map((s, i) => (
                  <Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                    {s}
                  </Badge>
                ))}
                {(resources.detected_skills?.length ?? 0) > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{(resources.detected_skills?.length ?? 0) - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {(resources.missing_skills?.length ?? 0) > 0 && (
            <div className="mobile-stack mt-2 sm:mt-3">
              <span className="text-xs text-muted-foreground font-medium">Skills to learn:</span>
              <div className="flex flex-wrap gap-2">
                {resources.missing_skills?.slice(0, 4).map((s, i) => (
                  <Badge key={i} className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                    {s}
                  </Badge>
                ))}
                {(resources.missing_skills?.length ?? 0) > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{(resources.missing_skills?.length ?? 0) - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Minimalist UI */}
        <Card className="mb-6 sm:mb-8 border-primary/20 shadow-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <CardTitle className="text-responsive-heading flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              {resources.target_role ? resources.target_role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Software Engineer"} Roadmap
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your personalized fast-track guide. We've hidden skills you already mastered. Click 'Start Learning' to jump into curated free resources.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {resources?.personalized_recommendations && resources.personalized_recommendations.length > 0 ? (
              <div className="space-y-4">
                {resources.personalized_recommendations.map((rec: any, index) => {
                  const skillName = rec.title || rec.skill || (rec.skills && rec.skills[0]) || `Skill ${index + 1}`
                  const time = rec.estimatedTime || rec.estimated_time || "Self-paced"
                  
                  // Filter out completed logic & skills already detected
                  const isDetected = resources?.detected_skills?.some(
                    (ds: string) => ds.toLowerCase() === skillName.toLowerCase() || skillName.toLowerCase().includes(ds.toLowerCase())
                  );
                  
                  if (isDetected) return null;
                  
                  const isCompleted = !!completedRoadmap[index];

                  const handleStartLearning = async () => {
                    setFetchingUrlFor(index);
                    try {
                      const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(skillName)}`);
                      const data = await res.json();
                      if (data.url) {
                        window.open(data.url, '_blank');
                      }
                    } catch (error) {
                      console.error("Failed to fetch resource:", error);
                      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial for beginners')}`, '_blank');
                    } finally {
                      setFetchingUrlFor(null);
                    }
                  }

                  return (
                    <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between border bg-card rounded-lg p-4 transition-all gap-4 ${isCompleted ? 'opacity-50 grayscale-[50%] border-border' : 'border-border/50 hover:border-primary/30 hover:shadow-sm'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${isCompleted ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-semibold text-base ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{skillName}</h3>
                          <p className={`text-sm mt-1 ${isCompleted ? 'text-muted-foreground/70 line-through' : 'text-muted-foreground'}`}>
                            {rec.description || `Master ${skillName} to advance your AI ML career`} • {time}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:shrink-0 justify-end">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
                           <input
                             type="checkbox"
                             checked={isCompleted}
                             onChange={() => toggleRoadmapStep(index, skillName)}
                             className="rounded border-gray-300 h-4 w-4 text-primary focus:ring-primary"
                           />
                           {isCompleted ? 'Done' : 'Done?'}
                         </label>
                         
                         {isCompleted ? (
                           <Button variant="secondary" className="min-w-[140px] font-semibold cursor-default" disabled>
                             Completed
                           </Button>
                         ) : (
                           <Button 
                             onClick={handleStartLearning} 
                             disabled={fetchingUrlFor === index}
                             className="min-w-[140px] shadow-md hover:shadow-lg transition-all font-semibold"
                           >
                             {fetchingUrlFor === index ? (
                               <>
                                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                 Finding...
                               </>
                             ) : (
                               <>
                                 <Code className="h-4 w-4 mr-2" />
                                 Start Learning
                               </>
                             )}
                           </Button>
                         )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-foreground font-medium mb-1">Roadmap Completed!</p>
                <p className="text-muted-foreground text-sm">
                  You've mastered all the required skills for this role.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Structured Learning Path from Skills Page */}
        <div className="mb-6 sm:mb-8 mt-6">
          <div className="mb-6">
            <h2 className="text-responsive-title font-bold mb-2">Structured Learning Path</h2>
            <p className="text-sm text-muted-foreground">
              Follow this comprehensive roadmap to become a professional in your field. Click on any topic to explore courses and resources.
            </p>
          </div>
          <LearningRoadmap role={resources.target_role?.toLowerCase() || "software-engineer"} />
        </div>

        {/* Tabs - Mobile Optimized */}
        <Tabs defaultValue="personalized" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="personalized" className="text-xs sm:text-sm">
              Plan
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm">
              Courses
            </TabsTrigger>
            <TabsTrigger value="practice" className="text-xs sm:text-sm">
              Practice
            </TabsTrigger>
          </TabsList>

            <TabsContent value="personalized" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-responsive-heading">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Your Learning Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="card-padding">
                  {resources?.personalized_recommendations && resources.personalized_recommendations.length > 0 ? (
                    <div className="mobile-stack">
                      {resources.personalized_recommendations.map((rec, index) => {
                        const skill = rec.skill || `Step ${index + 1}`
                        const description = rec.action || "Complete this step"
                        const priority = rec.priority || "Medium"
                        const time = rec.estimated_time || "Self-paced"
                        
                        return (
                        <div key={index} className="border border-border/30 rounded-lg p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{skill}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getPriorityColor(priority)} text-xs whitespace-nowrap`}>
                                {priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {time}
                          </p>
                          {rec.resources && rec.resources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {rec.resources.slice(0, 3).map((resource, rIndex) => {
                                const resourceName = resource.name || (resource as any).title || "Resource"
                                
                                const handleStartLearning = async () => {
                                  setFetchingUrlFor(index * 100 + rIndex); // Unique ID hack
                                  try {
                                    const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(resourceName)}`);
                                    const data = await res.json();
                                    if (data.url) {
                                      window.open(data.url, '_blank');
                                    }
                                  } catch (error) {
                                    console.error("Failed to fetch resource:", error);
                                    window.open(`https://www.google.com/search?q=${encodeURIComponent(resourceName + ' tutorial for beginners')}`, '_blank');
                                  } finally {
                                    setFetchingUrlFor(null);
                                  }
                                }
                                
                                return (
                                  <Button key={rIndex} size="sm" variant="outline" onClick={handleStartLearning} disabled={fetchingUrlFor === (index * 100 + rIndex)}>
                                     {fetchingUrlFor === (index * 100 + rIndex) ? (
                                       <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Fetching...</>
                                     ) : (
                                       <>{resourceName} <ExternalLink className="h-3 w-3 ml-2" /></>
                                     )}
                                  </Button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm sm:text-base text-center py-4">
                      No roadmap available. Please upload your resume.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resources?.courses?.map((course, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-lg">{course.title}</span>
                        {course.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm">{course.rating}</span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Platform:</span>
                          <Badge variant="secondary">{course.platform || course.provider}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        </div>
                        {course.cost_efficiency && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Cost:</span>
                            <Badge variant={course.cost_efficiency.toLowerCase().includes('free') ? 'default' : 'outline'} className={course.cost_efficiency.toLowerCase().includes('free') ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {course.cost_efficiency}
                            </Badge>
                          </div>
                        )}
                        {course.instructor && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Instructor:</span>
                            <span className="text-sm">{course.instructor}</span>
                          </div>
                        )}
                        <Button className="w-full" disabled={fetchingUrlFor === ('course' + index)} onClick={async (e) => {
                          e.preventDefault();
                          handleStartCourse(course);
                          setFetchingUrlFor('course' + index);
                          try {
                            const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(course.title)}`);
                            const data = await res.json();
                            if (data.url) {
                              window.open(data.url, '_blank');
                            } else {
                              window.open(course.link, '_blank');
                            }
                          } catch (error) {
                            window.open(course.link, '_blank');
                          } finally {
                            setFetchingUrlFor(null);
                          }
                        }}>
                          {fetchingUrlFor === ('course' + index) ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>
                          ) : (
                            <><BookOpen className="h-4 w-4 mr-2" /> Start Course <ExternalLink className="h-3 w-3 ml-2" /></>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Free Resources Section */}
              {resources?.free_resources && resources.free_resources.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Free Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {resources.free_resources.map((resource: FreeResource, index: number) => (
                      <Card key={index} className="p-4">
                        <h4 className="font-medium">{resource.title}</h4>
                        <Badge variant="outline" className="mt-2 mb-3">{resource.type}</Badge>
                        <Button variant="outline" size="sm" className="w-full" disabled={fetchingUrlFor === ('free' + index)} onClick={async (e) => {
                          e.preventDefault();
                          setFetchingUrlFor('free' + index);
                          try {
                            const res = await fetch(`/api/get-resource?skillName=${encodeURIComponent(resource.title)}`);
                            const data = await res.json();
                            if (data.url) {
                              window.open(data.url, '_blank');
                            } else {
                              window.open(resource.link, '_blank');
                            }
                          } catch (error) {
                            window.open(resource.link, '_blank');
                          } finally {
                            setFetchingUrlFor(null);
                          }
                        }}>
                          {fetchingUrlFor === ('free' + index) ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Fetching...</> : <>Visit <ExternalLink className="h-3 w-3 ml-1" /></>}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="practice" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-blue-600" />
                    Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resources?.leetcode_problems?.map((problem, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{problem.title}</span>
                          {problem.platform && (
                            <Badge variant="secondary">{problem.platform}</Badge>
                          )}
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" asChild onClick={() => handleSolveProblem(problem)}>
                          <a href={problem.link} target="_blank" rel="noopener noreferrer">
                            Solve
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    )
}