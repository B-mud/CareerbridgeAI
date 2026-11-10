"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase, MapPin, DollarSign, Users, ExternalLink,
  Search, Filter, Sparkles, TrendingUp, BarChart3,
  BookOpen, Trophy, Target, ChevronRight, Zap,
  Building2, Clock, Star, RefreshCw
} from "lucide-react"
import { SessionManager } from "@/lib/session-manager"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Job {
  id: string
  title: string
  company: string
  location: string
  skills_required: string[]
  description: string
  salary_range: string
  experience_level: string
  job_type: string
  openings: number
  match_score: number
  portals: {
    linkedin?: string
    naukri?: string
  }
}

type TabType = "recommended" | "trending" | "search" | "chennai"

const EXP_LABELS: Record<string, string> = {
  fresher: "🌱 Fresher",
  junior: "🔰 Junior",
  intermediate: "⚡ Mid-Level",
  senior: "🏆 Senior",
}

const EXP_COLORS: Record<string, string> = {
  fresher: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  junior: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  intermediate: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  senior: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400"
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-500 dark:text-red-400"
}

function matchBg(score: number) {
  if (score >= 75) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Card Component (-inspired)
// ─────────────────────────────────────────────────────────────────────────────

function JobCard({
  job,
  userSkills,
  isSaved,
  onToggleSave,
  onApply,
}: {
  job: Job
  userSkills: string[]
  isSaved: boolean
  onToggleSave: (job: Job) => void
  onApply: (job: Job, portal: string) => void
}) {
  const userSkillsLower = userSkills.map(s => s.toLowerCase())
  const matched   = job.skills_required.filter(s => userSkillsLower.includes(s.toLowerCase()))
  const unmatched = job.skills_required.filter(s => !userSkillsLower.includes(s.toLowerCase()))

  return (
    <div className="group bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
      <Link href={`/dashboard/jobs/${job.id}`} className="block">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 cursor-pointer">
          <div className="flex items-center gap-3">
            {/* Company avatar */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {job.company.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {job.company}
              </p>
            </div>
          </div>

        {/* Match score badge */}
        {job.match_score > 0 && (
          <div className="text-right shrink-0">
            <div className={`text-lg font-bold ${matchColor(job.match_score)}`}>
              {job.match_score}%
            </div>
            <div className="text-[10px] text-muted-foreground">match</div>
          </div>
        )}
      </div>

      {/* Match progress bar */}
      {job.match_score > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${matchBg(job.match_score)}`}
              style={{ width: `${job.match_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> {job.salary_range}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {job.openings} openings
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {job.job_type}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {matched.slice(0, 4).map(s => (
          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            ✓ {s}
          </span>
        ))}
        {unmatched.slice(0, 3).map(s => (
          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
            {s}
          </span>
        ))}
        {job.skills_required.length > 7 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
            +{job.skills_required.length - 7} more
          </span>
        )}
      </div>
      </Link>

      {/* Footer: exp badge + apply buttons */}
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${EXP_COLORS[job.experience_level] ?? "bg-muted text-muted-foreground"}`}>
          {EXP_LABELS[job.experience_level] ?? job.experience_level}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave(job)
            }}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSaved
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          
          {job.portals.naukri && (
            <a
              href={job.portals.naukri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                onApply(job, "naukri")
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors border border-primary/20"
            >
              Naukri <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {job.portals.linkedin && (
            <a
              href={job.portals.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                onApply(job, "linkedin")
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              LinkedIn <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>("recommended")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Job[]>([])
  const [searching, setSearching] = useState(false)
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [expFilter, setExpFilter] = useState<string>("all")
  const [hasResume, setHasResume] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const supabase = createClientComponentClient()

  // ── load user skills + recommendations ──────────────────────────────────
  const loadRecommendations = useCallback(async (rid: string, token: string) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/jobs/recommend/${rid}?top_n=15`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        setUserSkills(data.skills_used || [])
      }
    } catch (e) {
      console.error("Jobs fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTrending = useCallback(async () => {
    setLoading(true)
    try {
      const url = expFilter === "all"
        ? "http://localhost:8000/api/jobs/trending?top_n=15"
        : `http://localhost:8000/api/jobs/trending?experience_level=${expFilter}&top_n=15`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (e) {
      console.error("Trending fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [expFilter])

  const loadChennaiJobs = useCallback(async () => {
    setLoading(true)
    try {
      const sessionSkills = SessionManager.getResumeAnalysis()?.detected_skills || []
      const skillsForMatch = (userSkills.length > 0 ? userSkills : sessionSkills).slice(0, 20)
      const params = new URLSearchParams()
      if (resumeId) {
        params.set("resume_id", resumeId)
      }
      if (skillsForMatch.length > 0) {
        params.set("user_skills", skillsForMatch.join(","))
      }
      const query = params.toString() ? `?${params.toString()}` : ""
      const res = await fetch(`http://localhost:8000/api/jobs/adzuna/chennai${query}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        if (Array.isArray(data.skills_used)) {
          setUserSkills(data.skills_used)
        }
      }
    } catch (e) {
      console.error("Chennai jobs fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [resumeId, userSkills])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const uid = session?.user?.id || null
      setUserId(uid)
      setAuthToken(token || null)

      if (uid && typeof window !== "undefined") {
        localStorage.setItem("user_id", uid)
        const saved = localStorage.getItem(`saved_jobs_${uid}`)
        if (saved) {
          setSavedJobIds(JSON.parse(saved))
        }
      }

      // Try to get fileId
      let fileId = SessionManager.getFileId()
      if (!fileId && token) {
        try {
          const r = await fetch("http://localhost:8000/api/resume/latest", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (r.ok) {
            const d = await r.json()
            if (d.has_resume && d.file_id) {
              fileId = d.file_id
              SessionManager.saveFileId(d.file_id)
            }
          }
        } catch {}
      }

      if (fileId && token) {
        setHasResume(true)
        setResumeId(fileId)
        await loadRecommendations(fileId, token)
      } else {
        await loadTrending()
      }
    }
    init()
  }, [supabase, loadRecommendations, loadTrending])

  // When tab changes to trending, reload
  useEffect(() => {
    if (tab === "trending") loadTrending()
    if (tab === "chennai") loadChennaiJobs()
  }, [tab, loadTrending, loadChennaiJobs])

  // ── search ───────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `http://localhost:8000/api/jobs/live-search?q=${encodeURIComponent(searchQuery)}&top_n=12`
      )
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.jobs || [])
      }
    } catch (e) {
      console.error("Search error:", e)
    } finally {
      setSearching(false)
      setTab("search")
    }
  }

  // ── filter displayed jobs ────────────────────────────────────────────────
  const displayJobs = (() => {
    const base = tab === "search" ? searchResults : jobs
    const byExp = expFilter === "all" ? base : base.filter(j => j.experience_level === expFilter)
    if (locationFilter === "all") return byExp
    return byExp.filter(j => j.location.toLowerCase().includes(locationFilter.toLowerCase()))
  })()

  const persistSavedJobs = (nextSaved: string[]) => {
    setSavedJobIds(nextSaved)
    if (userId && typeof window !== "undefined") {
      localStorage.setItem(`saved_jobs_${userId}`, JSON.stringify(nextSaved))
    }
  }

  const handleToggleSave = async (job: Job) => {
    const alreadySaved = savedJobIds.includes(job.id)
    const next = alreadySaved ? savedJobIds.filter((id) => id !== job.id) : [...savedJobIds, job.id]
    persistSavedJobs(next)

    if (!alreadySaved && authToken && userId) {
      await fetch("http://localhost:8000/api/jobs/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ user_id: userId, job }),
      }).catch(() => null)
    }
  }

  const handleApply = async (job: Job, portal: string) => {
    if (!authToken || !userId) return
    await fetch("http://localhost:8000/api/jobs/track-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        source: portal,
      }),
    }).catch(() => null)
  }

  // ── skill coverage stat ───────────────────────────────────────────────────
  const avgMatch = displayJobs.length
    ? Math.round(displayJobs.reduce((s, j) => s + j.match_score, 0) / displayJobs.length)
    : 0

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="flex">
        {/* Sidebar - Desktop Only */}
        <aside className="sidebar-desktop" role="navigation" aria-label="Dashboard navigation">
          <nav className="p-4 sm:p-6 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/skills" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <Target className="h-4 w-4" /> Skills
            </Link>
            <Link href="/dashboard/recommendations" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="h-4 w-4" /> Learning Path
            </Link>
            <Link href="/dashboard/mock-test" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
              <Trophy className="h-4 w-4" /> Mock Tests
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium" aria-current="page">
              <Briefcase className="h-4 w-4" /> Job Board
            </Link>
          </nav>

          {/* Skill coverage mini card */}
          {userSkills.length > 0 && (
            <div className="mx-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs font-medium text-foreground mb-1">Your Skills ({userSkills.length})</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {userSkills.slice(0, 8).map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    {s}
                  </span>
                ))}
                {userSkills.length > 8 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    +{userSkills.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="main-content">
          <div className="container-max-lg page-padding">

            {/* Hero banner - Mobile Responsive */}
            <div className="rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/20 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-responsive-heading flex items-center gap-2 mb-1 sm:mb-2">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                    <span className="truncate">AI Job Recommendations</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Jobs ranked by <strong>skill match</strong>. Each job unlocks from the Learning Path.
                  </p>
                </div>
                {hasResume && resumeId && (
                  <div className="flex gap-2">
                    <Link href="/dashboard/recommendations">
                      <Button size="sm" variant="outline" className="gap-2 text-xs sm:text-sm flex-shrink-0">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" /> 
                        <span className="hidden sm:inline">Roadmap</span>
                        <span className="sm:hidden">Map</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/mock-test">
                      <Button size="sm" className="gap-2 text-xs sm:text-sm flex-shrink-0">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4" /> 
                        <span className="hidden sm:inline">Take Mock Test</span>
                        <span className="sm:hidden">Test</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Stats row - Mobile Wrap */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{displayJobs.length} jobs</span>
                </div>
                {avgMatch > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Avg: <strong className="text-foreground">{avgMatch}%</strong></span>
                  </div>
                )}
                {userSkills.length > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{userSkills.length} skills</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by role, skill, or company…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} className="h-11 px-5 rounded-xl gap-2">
                {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            {/* Tab bar + filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                {([
                  { key: "recommended", label: "✨ For You", show: hasResume },
                  { key: "trending",    label: "🔥 Trending", show: true },
                  { key: "chennai",     label: "📍 Chennai", show: true },
                  { key: "search",      label: "🔍 Search",   show: searchResults.length > 0 },
                ] as { key: TabType; label: string; show: boolean }[])
                  .filter(t => t.show)
                  .map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                        tab === t.key
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
              </div>

              {/* Experience filter */}
              <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                {(["all", "fresher", "junior", "intermediate", "senior"] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setExpFilter(lvl)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all capitalize ${
                      expFilter === lvl
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lvl === "all" ? "All Levels" : lvl}
                  </button>
                ))}
              </div>

              {/* Location filter */}
              <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                {(["all", "remote", "bengaluru", "hyderabad", "pune"] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationFilter(loc)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all capitalize ${
                      locationFilter === loc
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {loc === "all" ? "All Locations" : loc}
                  </button>
                ))}
              </div>
            </div>

            {/* No resume notice */}
            {!hasResume && tab === "recommended" && (
              <div className="mb-6 p-5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl flex items-center gap-4">
                <div className="text-3xl">📄</div>
                <div>
                  <p className="font-medium text-foreground">Upload your resume to get personalised job recommendations</p>
                  <p className="text-sm text-muted-foreground mt-0.5">We use AI to match your skills against thousands of job descriptions.</p>
                </div>
                <Link href="/resume-upload" className="ml-auto shrink-0">
                  <Button size="sm" variant="outline">Upload Resume</Button>
                </Link>
              </div>
            )}

            {/* Job grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : displayJobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No jobs found. Try a different filter or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    userSkills={userSkills}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={handleToggleSave}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}

            {/* CTA: improve match */}
            {!loading && displayJobs.length > 0 && (
              <div className="mt-10 p-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Want higher match scores?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Complete a mock test → unlock better job recommendations automatically.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link href="/dashboard/recommendations">
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookOpen className="h-4 w-4" /> Learn Skills
                    </Button>
                  </Link>
                  <Link href="/dashboard/mock-test">
                    <Button size="sm" className="gap-2">
                      <Trophy className="h-4 w-4" /> Take a Test <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
