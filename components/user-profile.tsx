"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, ChevronRight, User, LogOut, BarChart2 } from "lucide-react"
import Link from "next/link"
import { SessionManager } from "@/lib/session-manager"
import { useAuth } from "@/lib/auth-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function UserProfile() {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadData = async () => {
      const profile = SessionManager.getUserProfile()
      let analysis: any = SessionManager.getResumeAnalysis()
      let fileId: string | null = SessionManager.getFileId()

      // If no local data, try to hydrate from backend (returning user)
      if (!fileId || !analysis) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          try {
            const latestRes = await fetch('http://localhost:8000/api/resume/latest', {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            if (latestRes.ok) {
              const latestData = await latestRes.json()
              if (latestData.has_resume && typeof latestData.file_id === 'string') {
                fileId = latestData.file_id as string
                SessionManager.saveFileId(fileId)
                // Fetch full analysis
                const analysisRes = await fetch(`http://localhost:8000/api/resume/full-analysis/${fileId}`, {
                  headers: { 'Authorization': `Bearer ${session.access_token}` }
                })
                if (analysisRes.ok) {
                  analysis = await analysisRes.json()
                  SessionManager.saveResumeAnalysis(analysis)
                }
              }
            }
          } catch (e) {
            console.error('UserProfile: failed to hydrate from backend', e)
          }
        }
      }

      setUserProfile(profile)
      setResumeAnalysis(analysis)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getProfileCompletion = () => {
    let completion = 0
    // Profile name (25%)
    if (userProfile?.name || user?.user_metadata?.name || user?.email) completion += 25
    // Profession/role (25%)
    if (userProfile?.profession || resumeAnalysis?.ai_analysis?.experience_level) completion += 25
    // Resume uploaded (25%)
    if (resumeAnalysis?.detected_skills?.length > 0) completion += 25
    // Learning path started (25%)
    if (resumeAnalysis?.missing_skills?.length > 0) completion += 25
    return Math.min(100, completion) // Cap at 100%
  }

  const hasResumeData = (resumeAnalysis?.detected_skills?.length ?? 0) > 0

  const displayName = user?.user_metadata?.name || resumeAnalysis?.personal_info?.name || userProfile?.name || user?.email?.split('@')[0] || "Guest User"
  const displaySkills = resumeAnalysis?.detected_skills?.slice(0, 4) || []
  const profileCompletion = getProfileCompletion()

  const handleSignOut = async () => {
    await signOut()
    SessionManager.clearUserData()
  }

  return (
    <Card className="hover:bg-card/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {displayName !== "Guest User" ? getInitials(displayName) : <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <CardDescription className="truncate">
              {user?.email || resumeAnalysis?.personal_info?.email || 'No email set'}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Profile Completion</span>
            <span className="text-sm font-medium">{profileCompletion}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displaySkills.length > 0 ? (
              displaySkills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))
            ) : (
              <Badge variant="outline">No skills detected yet</Badge>
            )}
          </div>
          {hasResumeData ? (
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/dashboard/recommendations">
                <span className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  View Learning Path
                </span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="w-full justify-between" asChild>
              <Link href="/resume-upload">
                Upload Resume to Get Started
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}