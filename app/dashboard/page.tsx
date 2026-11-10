"use client"

import Link from "next/link"
import { Suspense, lazy, useEffect, useState } from "react"
import { BarChart3, Target, BookOpen, Trophy, Briefcase } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/navbar"
import { UserProfile } from "@/components/user-profile"
import { useDashboardData } from "@/lib/hooks/useDashboardData"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Lazy load the chart component for better performance
const DashboardChart = lazy(() => 
  import("@/components/dashboard-chart-new").then(module => ({ default: module.DashboardChart }))
)
import { ActivityHeatMap } from "@/components/activity-heat-map"
import { ActivityFeed } from "@/components/activity-feed"

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading chart">
      <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
        <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData()
  const [userId, setUserId] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Log when data changes for debugging
  useEffect(() => {
    console.log("📊 [Dashboard Page] Data state:", { 
      hasData: !!data, 
      loading, 
      error 
    })
    if (data) {
      console.log("📊 [Dashboard Page] Rendering with data:", data)
    }
  }, [data, loading, error])

  useEffect(() => {
    const resolveUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setAuthToken(session?.access_token || null)
      const uid = session?.user?.id || (typeof window !== "undefined" ? localStorage.getItem("user_id") : null)
      setUserId(uid)
      if (uid && typeof window !== "undefined") {
        localStorage.setItem("user_id", uid)
      }
    }
    resolveUser()
  }, [supabase])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 flex">
        {/* Fixed Sidebar */}
        <aside className="hidden md:block w-64 bg-card/50 border-r border-border/50 fixed left-0 top-16 bottom-0 overflow-y-auto" role="navigation" aria-label="Dashboard navigation">
          <nav className="p-6 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium" aria-current="page">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
            <Link href="/skills" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Go to skills page">
              <Target className="h-4 w-4" aria-hidden="true" />
              Skills
            </Link>
            <Link href="/dashboard/recommendations" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Go to learning path page">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Learning Path
            </Link>
            <Link href="/dashboard/mock-test" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Go to mock tests page">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Mock Tests
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" aria-label="Go to job board page">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              Job Board
            </Link>
          </nav>
        </aside>

        <main className="flex-1 md:pl-64" role="main" aria-label="Dashboard main content">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">Error loading dashboard: {error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <UserProfile />
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {loading ? (
                    <>
                      <Card className="col-span-1"><CardHeader><CardTitle><div className="h-4 w-20 bg-muted animate-pulse rounded" /></CardTitle></CardHeader><CardContent><div className="h-8 w-16 bg-muted animate-pulse rounded" /></CardContent></Card>
                      <Card className="col-span-1"><CardHeader><CardTitle><div className="h-4 w-20 bg-muted animate-pulse rounded" /></CardTitle></CardHeader><CardContent><div className="h-8 w-16 bg-muted animate-pulse rounded" /></CardContent></Card>
                      <Card className="col-span-1"><CardHeader><CardTitle><div className="h-4 w-20 bg-muted animate-pulse rounded" /></CardTitle></CardHeader><CardContent><div className="h-8 w-16 bg-muted animate-pulse rounded" /></CardContent></Card>
                    </>
                  ) : data ? (
                    <>
                      <Card className="hover:bg-card/50 transition-colors" role="region" aria-label="Skills Matched">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Matched Skills</CardTitle>
                          <Target className="h-4 w-4 text-green-600" aria-hidden="true" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" aria-live="polite">
                            {data.skillsMastered}
                          </div>
                          {data.initialMissingSkills > 0 ? (
                            <>
                              <Progress 
                                value={Math.max(0, Math.min(100, (data.skillsMastered / (data.skillsMastered + data.initialMissingSkills)) * 100))} 
                                className="mt-2"
                                role="progressbar"
                                aria-valuenow={data.skillsMastered}
                                aria-valuemin={0}
                                aria-valuemax={data.skillsMastered + data.initialMissingSkills}
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                {data.initialMissingSkills} more needed
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">All skills detected!</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="hover:bg-card/50 transition-colors" role="region" aria-label="Skill Progress">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Learning Gap</CardTitle>
                          <BookOpen className="h-4 w-4 text-orange-600" aria-hidden="true" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold" aria-live="polite">
                            {data.initialMissingSkills || 0}
                          </div>
                          {data.initialMissingSkills > 0 ? (
                            <p className="text-xs text-muted-foreground mt-2">
                              Skills completely missing from resume
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-2">✓ No gap detected!</p>
                          )}
                        </CardContent>
                      </Card>

                      <Link href="/dashboard/recommendations" className="block">
                        <Card className="hover:bg-card/50 transition-colors cursor-pointer h-full" role="region" aria-label="Progress">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Next Action</CardTitle>
                            <Trophy className="h-4 w-4 text-blue-600" aria-hidden="true" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold" aria-live="polite">
                              {data.remainingGap} Tasks
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {data.remainingGap > 0 ? "left on your roadmap ↗" : "Up Next: View roadmap ↗"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </>
                  ) : (
                    <Card className="col-span-3 py-8">
                      <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">No resume analysis data found.</p>
                        <Link href="/resume-upload" className="text-primary hover:underline">
                          Upload your resume to get started
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <Suspense fallback={
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Skill Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartSkeleton />
                  </CardContent>
                </Card>
              }>
                <DashboardChart data={data ? {
                  skillsMastered: data.skillsMastered,
                  skillsTotal: data.skillsMastered + data.initialMissingSkills,
                  missingSkillsTotal: data.initialMissingSkills,
                  mockTestScore: data.tasksCompleted
                } : undefined} />
              </Suspense>
              <Card className="hover:bg-card/50 transition-colors lg:col-span-1 flex flex-col justify-center" role="region" aria-label="Resume Snapshot">
                <CardHeader className="pb-2">
                  <CardTitle>Resume Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center gap-6 py-4">
                  <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Detected Skills</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{data?.skillsMastered || 0}</p>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Missing Skills</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{data?.missingSkillsTotal || 0}</p>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary uppercase tracking-wider">Role Match</p>
                    <p className="text-3xl font-bold text-primary mt-1">{data?.overallMatchScore || 0}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {userId && authToken && (
              <div className="space-y-6 mt-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Activity Tracking</h2>
                  <ActivityHeatMap userId={userId} authToken={authToken} />
                </div>
                <ActivityFeed userId={userId} authToken={authToken} limit={12} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}