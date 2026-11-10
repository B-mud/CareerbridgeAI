"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SessionManager } from "@/lib/session-manager"
import { useRouter } from "next/navigation"
import { User, Mail, Briefcase, Award, TrendingUp, Settings, ArrowRight, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const loadUserData = async () => {
    try {
      // Get authenticated user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/signin")
        return
      }

      const user = session.user
      setUser(user)

      // Get user profile from session manager
      const profile = SessionManager.getUserProfile()
      setProfile(profile)

      // Get dashboard data
      const analysis = SessionManager.getResumeAnalysis()
      if (analysis) {
        const totalSkills = (analysis.detected_skills?.length || 0) + (analysis.missing_skills?.length || 0)
        const matchScore = analysis.ai_analysis?.overall_match_score || 0
        setDashboardData({
          skillsMastered: analysis.detected_skills?.length || 0,
          skillsTotal: totalSkills,
          matchScore,
          experience: analysis.ai_analysis?.experience_level || "Not specified",
          yearsExperience: analysis.ai_analysis?.experience_years || 0
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">My Profile</h1>
            <Button asChild variant="outline">
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>

          {/* Profile Card */}
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {profile?.name || user?.email?.split("@")[0] || "User"}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-lg font-semibold">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Just now"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile?.profession && (
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-sm">Profession</span>
                    </div>
                    <p className="font-semibold">{profile.profession}</p>
                  </div>
                )}
                {dashboardData?.experience && (
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">Level</span>
                    </div>
                    <p className="font-semibold capitalize">{dashboardData.experience}</p>
                  </div>
                )}
                {dashboardData?.yearsExperience >= 0 && (
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Experience</span>
                    </div>
                    <p className="font-semibold">{dashboardData.yearsExperience}+ years</p>
                  </div>
                )}
                {profile?.interests?.length > 0 && (
                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Interests</span>
                    </div>
                    <p className="font-semibold">{profile.interests.length} areas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Skills Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{dashboardData.skillsMastered}</div>
                  <Progress value={(dashboardData.skillsMastered / dashboardData.skillsTotal) * 100} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {dashboardData.skillsTotal} total skills needed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Match Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{Math.round(dashboardData.matchScore)}%</div>
                  <Progress value={dashboardData.matchScore} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Role alignment score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">Active</div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/dashboard/recommendations">
                      View Path <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Personalized courses & resources
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Interests</CardTitle>
                <p className="text-sm text-muted-foreground">Areas you're focused on</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 flex-wrap">
            <Button asChild>
              <Link href="/dashboard">
                <TrendingUp className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resume-upload">
                <User className="h-4 w-4 mr-2" />
                Update Resume
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/recommendations">
                <Award className="h-4 w-4 mr-2" />
                Learning Path
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
