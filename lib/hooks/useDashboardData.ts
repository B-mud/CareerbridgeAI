"use client"

import { useState, useEffect } from "react"
import { SessionManager, ResumeAnalysis } from "@/lib/session-manager"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const DASHBOARD_VISIT_KEY_PREFIX = "dashboard_visit_logged"

async function logDashboardVisit(token: string, fileId?: string) {
  const today = new Date().toISOString().slice(0, 10)
  const visitKey = `${DASHBOARD_VISIT_KEY_PREFIX}_${today}`

  if (typeof window !== "undefined" && localStorage.getItem(visitKey)) {
    return
  }

  try {
    const response = await fetch("http://localhost:8000/api/user/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        action_type: "dashboard_visit",
        details: {
          source: "dashboard",
          resume_id: fileId || null,
        },
      }),
    })

    if (response.ok && typeof window !== "undefined") {
      localStorage.setItem(visitKey, "1")
      console.log("✅ [Dashboard] Visit activity logged")
    }
  } catch (error) {
    console.warn("⚠️ [Dashboard] Failed to log visit activity:", error)
  }
}

export interface DashboardData {
  skillsMastered: number
  skillsTotal: number
  skillsGapCovered: number      // How many missing skills you are actively targeting
  missingSkillsTotal: number    // Total missing skills from role analysis
  initialMissingSkills: number
  tasksCompleted: number
  matchedSkillsDynamic: number
  remainingGap: number
  resumeFileId: string | null
  mockTestScore: number
  detectedSkills: string[]
  missingSkills: string[]
  recommendedCourses: string[]
  recentActivity: Array<{
    type: "course" | "test" | "skill" | "milestone"
    title: string
    date: string
    color: string
  }>
  experienceLevel: string
  experienceYears: number
  overallMatchScore: number
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("📊 [Dashboard] Starting data fetch...")

        // Get JWT token for authenticated requests
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        console.log("🔐 [Dashboard] Auth status:", session ? "Authenticated" : "Guest")

        let sessionAnalysis = SessionManager.getResumeAnalysis()
        let fileId = SessionManager.getFileId()

        console.log("📊 [Dashboard] Session check:", {
          hasSessionAnalysis: !!sessionAnalysis,
          fileId: fileId || "none",
          hasToken: !!token
        })

        // If no fileId but we have a token, try to fetch the latest resume from backend
        if (!fileId && token) {
          try {
            console.log("🌐 [Dashboard] Fetching latest resume for user...")
            const latestRes = await fetch(`http://localhost:8000/api/resume/latest`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (latestRes.ok) {
              const latestData = await latestRes.json()
              if (latestData.has_resume && typeof latestData.file_id === 'string') {
                fileId = latestData.file_id
                if (typeof fileId === 'string') {
                  SessionManager.saveFileId(fileId)
                  console.log("✅ [Dashboard] Found latest resume:", fileId)
                }
              }
            }
          } catch (e) {
            console.error("❌ [Dashboard] Failed to fetch latest resume:", e)
          }
        }

        if (!sessionAnalysis && !fileId) {
          console.warn("⚠️ [Dashboard] No resume data found. User needs to upload resume.")
          setData(null)
          setLoading(false)
          return
        }

        let analysis: ResumeAnalysis | null = sessionAnalysis

        // Always try to fetch fresh data from backend if we have a fileId
        if (fileId && token) {
          try {
            console.log("🌐 [Dashboard] Fetching from backend API with JWT...")
            const response = await fetch(`http://localhost:8000/api/resume/full-analysis/${fileId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            })
            
            console.log("🌐 [Dashboard] API Response status:", response.status)
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              console.error("❌ [Dashboard] API error:", errorData)
              throw new Error(errorData.detail || `API returned ${response.status}`)
            }
            
            const fetchedAnalysis = await response.json()
            console.log("✅ [Dashboard] API data received:", {
              detectedSkills: fetchedAnalysis?.detected_skills?.length || 0,
              missingSkills: fetchedAnalysis?.missing_skills?.length || 0,
              matchScore: fetchedAnalysis?.ai_analysis?.overall_match_score || 0
            })

            // Merge fetched data with session data to preserve personal_info, experience, etc.
            analysis = {
              ...sessionAnalysis,
              ...fetchedAnalysis,
              personal_info: sessionAnalysis?.personal_info || fetchedAnalysis.personal_info,
              experience: sessionAnalysis?.experience || fetchedAnalysis.experience,
              education: sessionAnalysis?.education || fetchedAnalysis.education,
              ai_analysis: {
                ...sessionAnalysis?.ai_analysis,
                ...fetchedAnalysis.ai_analysis,
                experience_years: sessionAnalysis?.ai_analysis?.experience_years || fetchedAnalysis.ai_analysis?.experience_years || 0
              }
            } as ResumeAnalysis

            if (analysis) {
              SessionManager.saveResumeAnalysis(analysis)
              console.log("💾 [Dashboard] Merged analysis saved to session storage")
            }
          } catch (apiError) {
            console.error("❌ [Dashboard] Backend API error:", apiError)
            console.warn("⚠️ [Dashboard] Falling back to session data")
            // analysis already has sessionAnalysis value as fallback
          }
        } else if (fileId && !token) {
          console.warn("⚠️ [Dashboard] No JWT token - using session data only")
        }

        if (!analysis) {
          console.error("❌ [Dashboard] No analysis data available")
          setData(null)
          setLoading(false)
          return
        }

        // ✅ PRODUCTION-READY: Use ONLY real Supabase data
        const detectedCount = analysis.detected_skills?.length || 0
        const missingCount = analysis.missing_skills?.length || 0
        const totalSkills = detectedCount + missingCount

        // Compute completion progress from local roadmap + activity logs.
        let localRoadmapCompleted = 0
        let localSavedCourses = 0
        if (typeof window !== "undefined" && fileId) {
          const roadmapRaw = localStorage.getItem(`roadmap_progress_${fileId}`)
          const coursesRaw = localStorage.getItem(`saved_courses_${fileId}`)

          if (roadmapRaw) {
            try {
              const parsed = JSON.parse(roadmapRaw) as Record<string, boolean>
              localRoadmapCompleted = Object.values(parsed).filter(Boolean).length
            } catch (parseError) {
              console.warn("⚠️ [Dashboard] Invalid roadmap progress in localStorage", parseError)
            }
          }

          if (coursesRaw) {
            try {
              const parsed = JSON.parse(coursesRaw) as string[]
              localSavedCourses = Array.isArray(parsed) ? parsed.length : 0
            } catch (parseError) {
              console.warn("⚠️ [Dashboard] Invalid saved courses in localStorage", parseError)
            }
          }
        }

        let serverCompletedTasks = 0
        if (token) {
          try {
            const summaryRes = await fetch("http://localhost:8000/api/activity/summary?days=60", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (summaryRes.ok) {
              const summary = await summaryRes.json()
              const byType = summary?.activities_by_type || {}
              serverCompletedTasks =
                (byType.course_completed || 0) +
                (byType.practice_problem_solved || 0) +
                (byType.mock_test_completed || 0)
            }
          } catch (summaryError) {
            console.warn("⚠️ [Dashboard] Activity summary unavailable:", summaryError)
          }
        }

        const localCompletedTasks = localRoadmapCompleted + localSavedCourses
        const tasksCompleted = Math.max(localCompletedTasks, serverCompletedTasks)
        
        // Strict mapping according to requirements
        // Matched Skills: strict count of user's detected skills
        const strictMatchedSkills = detectedCount;
        
        // Learning Gap: Total Required (detected + missing) - Matched
        const strictLearningGap = missingCount; // since (detected + missing) - detected = missing
        
        // Next Actions: Independent count of tasks the user has left to do
        // Assume total tasks = missingCount * 3 (arbitrary multiplier or just missingCount)
        // Let's use missingCount as a baseline for the roadmap items
        const totalAvailableTasks = missingCount > 0 ? missingCount * 4 : 0; 
        const tasksLeftToDo = Math.max(0, totalAvailableTasks - tasksCompleted);

        // Real match score calculated accurately as ratio of detected skills to total required skills
        const calculatedMatchScore = totalSkills > 0 
          ? Math.round((detectedCount / totalSkills) * 100)
          : (analysis.ai_analysis?.overall_match_score || 0)
        
        const matchScore = calculatedMatchScore
        
        // DEBUG: Log the exact values for troubleshooting
        console.log("📊 [Dashboard Hook] Gap Calculation Debug:", {
          detectedCount,
          missingCount,
          tasksCompleted,
          strictMatchedSkills,
          strictLearningGap,
          tasksLeftToDo,
          matchScore
        })
        
        // Clamp all values between 0-100 for safety
        const clampPercentage = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

        console.log("📊 [Dashboard] Calculated values:", {
          detectedCount,
          missingCount,
          totalSkills,
          matchScore
        })

        const dashboardData: DashboardData = {
          // ✅ Skills detected vs total skills needed for the role
          skillsMastered: strictMatchedSkills,
          skillsTotal: totalSkills,
          
          // ✅ Skill gap: how many missing skills are tracked
          skillsGapCovered: tasksCompleted,
          missingSkillsTotal: strictLearningGap,
          initialMissingSkills: missingCount,
          tasksCompleted,
          matchedSkillsDynamic: strictMatchedSkills,
          remainingGap: tasksLeftToDo, // Use remainingGap to represent Tasks Left To Do
          resumeFileId: fileId || null,
          
          // ✅ Match score — real value from skill gap engine
          mockTestScore: clampPercentage(matchScore),
          
          // ✅ Arrays — directly from Supabase analysis
          detectedSkills: analysis.detected_skills || [],
          missingSkills: analysis.missing_skills || [],
          recommendedCourses: analysis.recommendations || [],
          
          // ✅ Activity and experience — from stored data
          recentActivity: generateRecentActivity(analysis),
          experienceLevel: analysis.ai_analysis?.experience_level || "Not specified",
          experienceYears: analysis.ai_analysis?.experience_years ?? 0,
          overallMatchScore: clampPercentage(matchScore),
        }

        if (token) {
          await logDashboardVisit(token, fileId || undefined)
        }

        console.log("✅ [Dashboard] Final dashboard data:", {
          skillsMastered: dashboardData.skillsMastered,
          skillsTotal: dashboardData.skillsTotal,
          missingSkillsTotal: dashboardData.missingSkillsTotal,
          tasksCompleted: dashboardData.tasksCompleted,
          skillsGapCovered: dashboardData.skillsGapCovered,
          mockTestScore: dashboardData.mockTestScore,
          matchScore: dashboardData.overallMatchScore
        })
        
        setData(dashboardData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
        setError(errorMessage)
        console.error("❌ [Dashboard] Critical error:", err)
      } finally {
        setLoading(false)
        console.log("📊 [Dashboard] Data fetch complete")
      }
    }

    fetchDashboardData()
  }, [supabase])

  return { data, loading, error }
}

function generateRecentActivity(analysis: ResumeAnalysis) {
  const activities: DashboardData["recentActivity"] = []

  if (analysis.detected_skills && analysis.detected_skills.length > 0) {
    activities.push({
      type: "skill",
      title: `Detected ${analysis.detected_skills.length} skills`,
      date: new Date().toLocaleDateString(),
      color: "bg-green-500",
    })
  }

  if (analysis.experience && analysis.experience.length > 0) {
    const latestExperience = analysis.experience[0]
    activities.push({
      type: "milestone",
      title: `Experience: ${latestExperience.title} at ${latestExperience.company}`,
      date: new Date().toLocaleDateString(),
      color: "bg-blue-500",
    })
  }

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    activities.push({
      type: "course",
      title: `${analysis.recommendations.length} learning recommendations`,
      date: new Date().toLocaleDateString(),
      color: "bg-orange-500",
    })
  }

  if (analysis.ai_analysis?.overall_match_score) {
    const score = Math.max(0, Math.min(100, Math.round(analysis.ai_analysis.overall_match_score)))
    activities.push({
      type: "test",
      title: `Overall Match Score: ${score}%`,
      date: new Date().toLocaleDateString(),
      color: "bg-purple-500",
    })
  }

  // Add fallback activity if nothing else
  if (activities.length === 0) {
    activities.push({
      type: "milestone",
      title: "Resume uploaded - Analysis ready",
      date: new Date().toLocaleDateString(),
      color: "bg-blue-500",
    })
  }

  return activities.slice(0, 3)
}
