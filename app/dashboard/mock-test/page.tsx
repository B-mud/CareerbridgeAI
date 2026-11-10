"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy, Clock, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, BarChart3, Target, BookOpen, Briefcase,
  Zap, Star, TrendingUp, Play, ArrowRight, Flame
} from "lucide-react"
import { SessionManager } from "@/lib/session-manager"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { logUserActivity } from "@/lib/activity-logger"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SkillInfo {
  skill: string
  label: string
  question_count: number
  difficulties: string[]
}

interface Question {
  id: string
  question: string
  options: string[]
  difficulty: "easy" | "medium" | "hard"
  skill: string
}

interface AnswerDetail {
  question_id: string
  correct: boolean
  your_answer: string
  correct_answer: string
  explanation: string
  difficulty: string
}

interface TestResult {
  skill: string
  score_pct: number
  passed: boolean
  correct: number
  total: number
  badge: string
  details: AnswerDetail[]
  pass_threshold: number
  unlocked_jobs: UnlockedJob[]
  message: string
}

interface UnlockedJob {
  id: string
  title: string
  company: string
  location: string
  salary_range: string
  match_score: number
  portals: { linkedin?: string; naukri?: string }
}

type Phase = "select" | "quiz" | "result"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
  medium: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30",
  hard:   "text-red-600   dark:text-red-400   bg-red-100   dark:bg-red-900/30",
}

const SKILL_ICONS: Record<string, string> = {
  python: "🐍", javascript: "🟡", react: "⚛️", sql: "🗄️",
  machinelearning: "🤖", docker: "🐳", git: "🔀", dsa: "🧮",
  aws: "☁️", nlp: "🔤",
}

// ─────────────────────────────────────────────────────────────────────────────
// Skill Selection Card
// ─────────────────────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  onClick,
  isRecommended,
}: {
  skill: SkillInfo
  onClick: () => void
  isRecommended: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="relative group text-left w-full bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
    >
      {isRecommended && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
          ✨ Recommended
        </span>
      )}
      <div className="text-3xl mb-3">{SKILL_ICONS[skill.skill] ?? "📝"}</div>
      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {skill.label}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {skill.question_count} questions available
      </p>
      <div className="flex flex-wrap gap-1">
        {skill.difficulties.map(d => (
          <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[d]}`}>
            {d}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium">
        Start Test <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MockTestPage() {
  const [phase, setPhase] = useState<Phase>("select")
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [selectedSkill, setSelectedSkill] = useState<string>("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [result, setResult] = useState<TestResult | null>(null)
  const [timer, setTimer] = useState(0)
  const [loadingQ, setLoadingQ] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [missingSkills, setMissingSkills] = useState<string[]>([])
  const [dailyAttempts, setDailyAttempts] = useState<Record<string, number>>({})
  const [cooldownUntil, setCooldownUntil] = useState<Record<string, number>>({})
  const [limitError, setLimitError] = useState<string>("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClientComponentClient()

  // ── init: load skills + user resume ──────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Fetch available test skills
      try {
        const r = await fetch("http://localhost:8000/api/mock-test/skills")
        if (r.ok) {
          const d = await r.json()
          setSkills(d.skills || [])
        }
      } catch {}

      // Try to get resume context
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      let fid = SessionManager.getFileId()
      if (!fid && token) {
        try {
          const r = await fetch("http://localhost:8000/api/resume/latest", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (r.ok) {
            const d = await r.json()
            if (d.has_resume && d.file_id) {
              fid = d.file_id
              SessionManager.saveFileId(d.file_id)
            }
          }
        } catch {}
      }
      if (fid) {
        setResumeId(fid)
        // Get missing skills to suggest relevant tests
        try {
          const r = await fetch(`http://localhost:8000/api/resume/full-analysis/${fid}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (r.ok) {
            const d = await r.json()
            const missing: string[] = (d.missing_skills || []).map((s: string) => s.toLowerCase())
            setMissingSkills(missing)
          }
        } catch {}
      }
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedAttempts = localStorage.getItem("mock_test_daily_attempts")
    const storedCooldown = localStorage.getItem("mock_test_cooldown")
    const storedDate = localStorage.getItem("mock_test_attempt_date")
    const today = new Date().toISOString().slice(0, 10)

    if (storedDate !== today) {
      localStorage.setItem("mock_test_attempt_date", today)
      localStorage.setItem("mock_test_daily_attempts", JSON.stringify({}))
      setDailyAttempts({})
    } else if (storedAttempts) {
      setDailyAttempts(JSON.parse(storedAttempts))
    }

    if (storedCooldown) {
      setCooldownUntil(JSON.parse(storedCooldown))
    }
  }, [])

  // ── timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (phase === "select") setTimer(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // ── start test ───────────────────────────────────────────────────────────
  const startTest = async (skill: string) => {
    const now = Date.now()
    const attempts = dailyAttempts[skill] || 0
    const nextAllowedAt = cooldownUntil[skill] || 0

    if (attempts >= 5) {
      setLimitError(`Daily attempt limit reached for ${skill}. Try again tomorrow.`)
      return
    }

    if (nextAllowedAt > now) {
      const waitMins = Math.ceil((nextAllowedAt - now) / 60000)
      setLimitError(`Please wait ${waitMins} minute(s) before retrying ${skill}.`)
      return
    }

    setLimitError("")
    setLoadingQ(true)
    setSelectedSkill(skill)
    setAnswers({})
    setCurrentQ(0)
    setSelectedOption(null)
    try {
      const priorAttempts = dailyAttempts[skill] || 0
      const adaptiveDifficulty = priorAttempts >= 4 ? "hard" : priorAttempts >= 2 ? "medium" : "easy"
      const res = await fetch(
        `http://localhost:8000/api/mock-test/questions?skill=${encodeURIComponent(skill)}&difficulty=${adaptiveDifficulty}&count=5`
      )
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions || [])
        setPhase("quiz")
      }
    } catch (e) {
      console.error("Failed to load questions:", e)
    } finally {
      setLoadingQ(false)
    }
  }

  // ── select option ─────────────────────────────────────────────────────────
  const pickOption = (opt: string) => {
    if (selectedOption) return // already answered
    setSelectedOption(opt)
    const q = questions[currentQ]
    setAnswers(prev => ({ ...prev, [q.id]: opt }))
  }

  // ── next question ─────────────────────────────────────────────────────────
  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1)
      setSelectedOption(null)
    } else {
      submitTest()
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const submitTest = useCallback(async () => {
    setSubmitting(true)
    try {
      const res = await fetch("http://localhost:8000/api/mock-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: selectedSkill,
          answers,
          resume_id: resumeId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        setPhase("result")

        const nextAttempts = {
          ...dailyAttempts,
          [selectedSkill]: (dailyAttempts[selectedSkill] || 0) + 1,
        }
        setDailyAttempts(nextAttempts)
        if (typeof window !== "undefined") {
          localStorage.setItem("mock_test_daily_attempts", JSON.stringify(nextAttempts))
        }

        const nextCooldown = {
          ...cooldownUntil,
          [selectedSkill]: Date.now() + 5 * 60 * 1000,
        }
        setCooldownUntil(nextCooldown)
        if (typeof window !== "undefined") {
          localStorage.setItem("mock_test_cooldown", JSON.stringify(nextCooldown))
        }

        await logUserActivity({
          action_type: "mock_test_completed",
          details: {
            skill: selectedSkill,
            score: data?.score_pct || 0,
            passed: !!data?.passed,
            correct: data?.correct || 0,
            total: data?.total || 0,
            time_spent: timer,
          },
        })
      }
    } catch (e) {
      console.error("Submit failed:", e)
    } finally {
      setSubmitting(false)
    }
  }, [selectedSkill, answers, resumeId, dailyAttempts, cooldownUntil, timer])

  const resetTest = () => {
    setPhase("select")
    setResult(null)
    setQuestions([])
    setSelectedOption(null)
    setAnswers({})
    setCurrentQ(0)
  }

  const currentQuestion = questions[currentQ]
  const progress = questions.length ? ((currentQ + (selectedOption ? 1 : 0)) / questions.length) * 100 : 0

  // ── RENDER: Select phase ──────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex">
          <aside className="hidden md:block w-64 bg-card/50 border-r border-border/50 fixed left-0 top-16 bottom-0 overflow-y-auto">
            <nav className="p-6 space-y-2">
              <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link href="/skills" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Target className="h-4 w-4" /> Skills
              </Link>
              <Link href="/dashboard/recommendations" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen className="h-4 w-4" /> Learning Path
              </Link>
              <Link href="/dashboard/mock-test" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium" aria-current="page">
                <Trophy className="h-4 w-4" /> Mock Tests
              </Link>
              <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                <Briefcase className="h-4 w-4" /> Job Board
              </Link>
            </nav>
          </aside>

          <main className="flex-1 md:pl-64">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
              {/* Header */}
              <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/20 p-6 mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
                  <Trophy className="h-6 w-6 text-primary" /> Skill Mock Tests
                </h1>
                <p className="text-sm text-muted-foreground">
                  Prove your skills with AI-powered MCQs. Scoring uses weighted difficulty:
                  <span className="text-green-600 dark:text-green-400"> Easy×1</span> ·
                  <span className="text-yellow-600 dark:text-yellow-400"> Medium×1.5</span> ·
                  <span className="text-red-600 dark:text-red-400"> Hard×2.0</span>.
                  Pass ≥60% to unlock job recommendations for that skill. Difficulty adapts as you take more attempts.
                </p>
                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-yellow-500" /> Score ≥ 90% → 🥇 Expert</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-blue-500" /> Score ≥ 70% → 🥈 Proficient</span>
                  <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" /> Score ≥ 60% → 🥉 Pass</span>
                </div>
              </div>

              {/* Skill grid */}
              {limitError && (
                <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">
                  {limitError}
                </div>
              )}

              {missingSkills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" /> Recommended for you (fill your skill gap)
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {skills
                      .filter(s => missingSkills.some(m => m.includes(s.skill) || s.skill.includes(m)))
                      .map(s => (
                        <SkillCard key={s.skill} skill={s} onClick={() => startTest(s.skill)} isRecommended />
                      ))}
                  </div>
                </div>
              )}

              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" /> All Available Tests
              </h2>
              {loadingQ ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-40 bg-muted/30 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {skills.map(s => (
                    <SkillCard
                      key={s.skill}
                      skill={s}
                      onClick={() => startTest(s.skill)}
                      isRecommended={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── RENDER: Quiz phase ────────────────────────────────────────────────────
  if (phase === "quiz" && currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-start justify-center px-4 py-12">
          <div className="w-full max-w-2xl">

            {/* Quiz header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {SKILL_ICONS[selectedSkill] ?? "📝"} {selectedSkill.replace("machinelearning","Machine Learning").replace("dsa","DSA").toUpperCase()} Test
                </h2>
                <p className="text-sm text-muted-foreground">
                  Question {currentQ + 1} of {questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono bg-muted/50 px-3 py-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {fmtTime(timer)}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{Object.keys(answers).length} answered</span>
                <span>{questions.length - Object.keys(answers).length} remaining</span>
              </div>
            </div>

            {/* Question card */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 mb-4 shadow-sm">
              <div className="flex items-start gap-3 mb-5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${DIFFICULTY_COLORS[currentQuestion.difficulty]}`}>
                  {currentQuestion.difficulty}
                </span>
                <p className="text-base font-medium text-foreground leading-snug">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((opt, i) => {
                  let cls = "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm "
                  if (!selectedOption) {
                    cls += "bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  } else if (opt === selectedOption) {
                    cls += "bg-primary/10 border-primary text-primary font-medium cursor-default"
                  } else {
                    cls += "bg-background border-border text-muted-foreground opacity-60 cursor-default"
                  }
                  return (
                    <button key={i} className={cls} onClick={() => pickOption(opt)}>
                      <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Next / Submit */}
            {selectedOption && (
              <div className="flex justify-end">
                <Button
                  onClick={nextQuestion}
                  disabled={submitting}
                  className="gap-2"
                >
                  {currentQ < questions.length - 1 ? (
                    <>Next <ChevronRight className="h-4 w-4" /></>
                  ) : submitting ? (
                    <>Submitting…</>
                  ) : (
                    <>Submit Test <Trophy className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: Result phase ──────────────────────────────────────────────────
  if (phase === "result" && result) {
    const scoreColor = result.passed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
    const scoreBg    = result.passed ? "from-green-500/20 to-transparent" : "from-red-500/20 to-transparent"

    return (
      <div className="dashboard-layout">
        <Navbar />
        <div className="flex pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8 md:pb-12 safe-area-bottom">
          <main className="main-content w-full px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl mx-auto">

              {/* Score card - Mobile Responsive */}
              <div className={`bg-gradient-to-br ${scoreBg} border rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 text-center ${result.passed ? "border-green-500/30" : "border-red-500/30"}`}>
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3">{result.badge.split(" ")[0]}</div>
                <div className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2 ${scoreColor}`}>{result.score_pct}%</div>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-1">{result.badge}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{result.correct}/{result.total} correct · {fmtTime(timer)}</p>
                <div className="mt-3 sm:mt-4 h-2 sm:h-3 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${result.passed ? "bg-green-500" : "bg-red-500"}`}
                    style={{ width: `${result.score_pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Pass threshold: {result.pass_threshold}%</p>
              </div>

              {/* Per-question breakdown - Mobile Responsive */}
              <div className="bg-card border border-border/50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-6">
                <h3 className="font-semibold text-responsive-sm mb-3 sm:mb-4">Question Review</h3>
                <div className="mobile-stack">
                  {result.details.map((d, i) => (
                    <div key={d.question_id} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${d.correct ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"}`}>
                      <div className="flex items-start gap-2 mb-2">
                        {d.correct
                          ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                          : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        }
                        <span className="text-xs sm:text-sm font-medium">Q{i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[d.difficulty]}`}>{d.difficulty}</span>
                      </div>
                      {!d.correct && (
                        <div className="ml-6 text-xs space-y-1">
                          <p className="text-red-600 dark:text-red-400">Your answer: {d.your_answer}</p>
                          <p className="text-green-600 dark:text-green-400">Correct: {d.correct_answer}</p>
                        </div>
                      )}
                      {d.explanation && (
                        <p className="ml-6 text-xs text-muted-foreground mt-1 italic">{d.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Areas */}
              {result.details.some((d) => !d.correct) && (
                <div className="bg-card border border-border/50 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
                  <h3 className="font-semibold text-responsive-sm mb-3">Weak Areas to Improve</h3>
                  <div className="space-y-2">
                    {Array.from(new Set(result.details.filter((d) => !d.correct).map((d) => d.difficulty))).map((difficulty) => {
                      const wrongCount = result.details.filter((d) => !d.correct && d.difficulty === difficulty).length
                      return (
                        <div key={difficulty} className="flex items-center justify-between p-2 rounded-lg border border-border/40">
                          <div className="flex items-center gap-2">
                            <Badge className={`${DIFFICULTY_COLORS[difficulty]} text-xs`}>{difficulty}</Badge>
                            <span className="text-sm">Incorrect in {difficulty} questions</span>
                          </div>
                          <span className="text-sm font-semibold">{wrongCount}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Unlocked jobs */}
            {result.passed && result.unlocked_jobs && result.unlocked_jobs.length > 0 && (
              <div className="bg-card border border-primary/30 rounded-2xl p-5 mb-6">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" /> Jobs Unlocked!
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  You&apos;ve proven <strong>{result.skill}</strong> skills. Here are matching opportunities:
                </p>
                <div className="space-y-3">
                  {result.unlocked_jobs.map(j => (
                    <div key={j.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-foreground">{j.title}</p>
                        <p className="text-xs text-muted-foreground">{j.company} · {j.location}</p>
                        <p className="text-xs text-muted-foreground">{j.salary_range}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{j.match_score}%</span>
                        {j.portals.linkedin && (
                          <a href={j.portals.linkedin} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="text-xs gap-1">
                              Apply
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={resetTest} variant="outline" className="gap-2 flex-1">
                <RotateCcw className="h-4 w-4" /> Test Another Skill
              </Button>
              <Link href="/dashboard/jobs" className="flex-1">
                <Button className="w-full gap-2">
                  <Briefcase className="h-4 w-4" /> View All Jobs
                </Button>
              </Link>
              {!result.passed && (
                <Button
                  onClick={() => startTest(selectedSkill)}
                  variant="secondary"
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" /> Retry This Test
                </Button>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return null
}
