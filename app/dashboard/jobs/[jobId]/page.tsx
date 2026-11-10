"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, ExternalLink, MapPin, DollarSign, Briefcase, Clock, 
  BookOpen, AlertCircle, Loader2, CheckCircle, Target,
  Zap, ChevronRight
} from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { SessionManager } from "../../../../lib/session-manager"

interface JobDetail {
  id: string
  title: string
  company: string
  location: string
  salary_range: string
  description: string
  skills_required: string[]
  experience_level: string
  job_type: string
  openings: number
  user_skills: string[]
  missing_skills: string[]
  match_score: number
  portals?: {
    linkedin?: string
    naukri?: string
    
  }
}

interface LearningPath {
  required_skills: string[]
  missing_skills: string[]
  priority_skills: string[]
  estimated_weeks: number
}

export default function JobDetailPage({
  params,
}: {
  params: { jobId: string }
}) {
  const router = useRouter()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | null>(null)

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to get fileId from session
        let resumeId = SessionManager.getFileId()
        if (resumeId) {
          setFileId(resumeId)
        }

        // Fetch job details from backend
        const url = resumeId
          ? `http://localhost:8000/api/jobs/${params.jobId}?resume_id=${resumeId}`
          : `http://localhost:8000/api/jobs/${params.jobId}`

        const response = await fetch(url)

        if (response.status === 404) {
          setError("Job not found. It may have been removed or the ID is invalid.")
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch job: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.job) {
          setJob(data.job)
          if (data.learning_path) {
            setLearningPath(data.learning_path)
          }
        } else {
          setError("Failed to load job details")
        }
      } catch (err) {
        console.error("Error loading job details:", err)
        setError(err instanceof Error ? err.message : "Failed to load job details")
      } finally {
        setLoading(false)
      }
    }

    loadJobDetails()
  }, [params.jobId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-16">
          <Link href="/dashboard/jobs">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job Board
            </Button>
          </Link>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardContent className="pt-6 flex gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                  Unable to Load Job Details
                </h2>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  {error || "The job you're looking for doesn't exist."}
                </p>
                <Link href="/dashboard/jobs">
                  <Button size="sm" variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Return to Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-40 border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard/jobs">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>

      <div className="container-mobile max-w-6xl py-6 sm:py-8">
        {/* Header Card */}
        <Card className="mb-6 sm:mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                    {job.title}
                  </h1>
                  {job.match_score > 0 && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {job.match_score}% Match
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">{job.company}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{job.salary_range}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{job.job_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {job.description || "No description available for this role."}
                </p>
              </CardContent>
            </Card>

            {/* Skills Required */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill, idx) => {
                    const hasSkill = job.user_skills?.some(
                      (s) => s.toLowerCase() === skill.toLowerCase()
                    )
                    return (
                      <Badge
                        key={idx}
                        className={hasSkill
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }
                      >
                        {hasSkill && <CheckCircle className="h-3 w-3 mr-1" />}
                        {skill}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            {/* Learning Path Card */}
            {learningPath && learningPath.missing_skills.length > 0 && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                    Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Skills to Learn:</p>
                    <div className="space-y-2">
                      {learningPath.priority_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-purple-600" />
                          <span className="text-muted-foreground">{skill}</span>
                        </div>
                      ))}
                      {learningPath.missing_skills.length > 3 && (
                        <div className="text-xs text-muted-foreground pt-2 border-t border-purple-200 dark:border-purple-800">
                          +{learningPath.missing_skills.length - 3} more skills
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Est. Time:</strong> {learningPath.estimated_weeks} weeks
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Learning Button */}
            {fileId && learningPath && learningPath.missing_skills.length > 0 && (
              <Link href={`/dashboard/recommendations?job_id=${job.id}&skills=${encodeURIComponent(learningPath.missing_skills.join(','))}`}>
                <Button className="w-full gap-2" size="lg">
                  <BookOpen className="h-4 w-4" />
                  Start Learning Path
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {/* Already Qualified */}
            {learningPath && learningPath.missing_skills.length === 0 && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="font-semibold text-green-900 dark:text-green-200 text-sm">
                    You have all required skills!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Apply Now */}
            {job.portals?.linkedin && (
              <a href={job.portals.linkedin} target="_blank" rel="noopener noreferrer">
                <Button variant="default" className="w-full gap-2" size="lg">
                  <ExternalLink className="h-4 w-4" />
                  Apply Now
                </Button>
              </a>
            )}

            {/* Mock Test */}
            <Link href="/dashboard/mock-test">
              <Button variant="outline" className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Take Mock Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        {job.user_skills && job.user_skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Your Matching Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.user_skills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
