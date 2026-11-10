"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SessionManager } from "@/lib/session-manager"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Target, BookOpen, ArrowRight, User, Briefcase } from "lucide-react"
import Link from "next/link"

interface ResumeAnalysis {
  personal_info: {
    name: string
    email?: string
    phone?: string
  }
  detected_skills: string[]
  missing_skills: string[]
  skill_scores: Record<string, number>
  recommendations: string[]
  experience: Array<{
    title: string
    company: string
  }>
  education: {
    level: string
    institutions: string[]
  }
  ai_analysis: {
    experience_years: number
    experience_level: string
    overall_match_score: number
  }
}

export default function ParseResumePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileId = searchParams.get('fileId')
  
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)

  const fetchAnalysis = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/resume/full-analysis/${fileId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch analysis")
      }
      
      const data = await response.json()
      
      // Merge with session data if available to preserve personal_info
      const sessionAnalysis = SessionManager.getResumeAnalysis() as any
      let finalAnalysis = data
      
      if (sessionAnalysis && sessionAnalysis.personal_info) {
        finalAnalysis = {
          ...data,
          personal_info: sessionAnalysis.personal_info,
          experience: sessionAnalysis.experience || data.experience,
          education: sessionAnalysis.education || data.education,
          ai_analysis: {
            ...data.ai_analysis,
            experience_years: sessionAnalysis.ai_analysis?.experience_years || data.ai_analysis?.experience_years || 0
          }
        }
      }
      
      setAnalysis(finalAnalysis)
      
      // Store merged analysis for dashboard
      SessionManager.saveResumeAnalysis(finalAnalysis)
      
    } catch (err) {
      console.error("Analysis fetch error:", err)
      setError("Failed to analyze resume. Please try uploading again.")
    } finally {
      setLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    const profile = SessionManager.getUserProfile()
    setUserProfile(profile)

    if (fileId) {
      // Check if we already have the full analysis in session
      const sessionAnalysis = SessionManager.getResumeAnalysis() as any
      if (sessionAnalysis && sessionAnalysis.file_id === fileId && sessionAnalysis.personal_info) {
        console.log("Using full analysis from session storage")
        setAnalysis(sessionAnalysis)
        setLoading(false)
      } else {
        console.log("Fetching analysis from backend")
        fetchAnalysis()
      }
    } else {
      setError("No file ID provided")
      setLoading(false)
    }
  }, [fileId, fetchAnalysis])

  const getTargetRole = () => {
    if (!userProfile?.profession) return "software_engineer"
    
    const roleMap: Record<string, string> = {
      "Software Engineer": "software_engineer",
      "Data Scientist": "data_scientist", 
      "Frontend Developer": "frontend_developer",
      "Backend Developer": "software_engineer",
      "Full Stack Developer": "software_engineer",
      "DevOps Engineer": "devops_engineer",
      "UI/UX Designer": "ui_ux_designer",
      "Student": "software_engineer", // Default for students
      "Machine Learning Engineer": "ai_ml_engineer"
    }
    
    // Check if user has AI/ML interests or is a CSE AI/ML student
    const hasAIInterests = userProfile?.interests?.some((interest: string) => 
      ['ai-ml', 'data-science'].includes(interest)
    )
    
    if (hasAIInterests) {
      return "ai_ml_engineer"
    }
    if (userProfile.profession === "Student") {
      return "software_engineer"
    }
    
    return roleMap[userProfile.profession] || "software_engineer"
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
            <h1 className="text-2xl font-bold mb-4">Analyzing Your Resume</h1>
            <p className="text-muted-foreground mb-8">
              Our AI is extracting skills, experience, and generating personalized recommendations...
            </p>
            <Progress value={75} className="w-full" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Analysis Failed</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button asChild>
              <Link href="/resume-upload">Try Again</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const matchScore = analysis.ai_analysis?.overall_match_score || 0
  const targetRole = getTargetRole()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">
              Resume Analysis Complete!
            </h1>
            <p className="text-muted-foreground">
              {userProfile?.name ? `Hi ${userProfile.name}! ` : ""}
              Here's your personalized career analysis
            </p>
          </div>

          {/* Personal Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{analysis.personal_info?.name || "Not detected"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience Level</p>
                  <p className="font-medium capitalize">
                    {analysis.ai_analysis?.experience_level === "fresher" 
                      ? "Fresher" 
                      : analysis.ai_analysis?.experience_level || "Intermediate"}
                    {analysis.ai_analysis?.experience_years > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({analysis.ai_analysis.experience_years} years)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Role Match</p>
                  <div className="flex items-center gap-2">
                    <Progress value={matchScore} className="flex-1" />
                    <span className="text-sm font-medium">{matchScore}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Skills Found ({analysis.detected_skills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.detected_skills?.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {skill}
                    </Badge>
                  )) || <p className="text-muted-foreground">No skills detected</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Skills to Learn ({analysis.missing_skills?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills?.map((skill) => (
                    <Badge key={skill} variant="outline" className="border-orange-300 text-orange-700">
                      {skill}
                    </Badge>
                  )) || <p className="text-muted-foreground">No missing skills identified</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience & Education */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.experience?.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.experience.slice(0, 3).map((exp, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4">
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work experience detected</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Highest Qualification</p>
                    <p className="font-medium">
                      {analysis.education?.level || "Not specified"}
                    </p>
                  </div>
                  {analysis.education?.institutions && analysis.education.institutions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Institutions</p>
                      <div className="space-y-1">
                        {analysis.education.institutions.slice(0, 3).map((inst, index) => (
                          <p key={index} className="text-sm pl-3 border-l-2 border-primary/50">{inst}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.slice(0, 5).map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">
                View Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/skills">
                Detailed Skills Analysis
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard/recommendations">
                Get Learning Resources
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}