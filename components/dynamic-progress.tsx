"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, BookOpen, Target } from "lucide-react"

interface ProgressData {
  visits: number
  coursesCompleted: number
  skillsImproved: number
  lastVisit: string
}

export function DynamicProgress() {
  const [progressData, setProgressData] = useState<ProgressData>({
    visits: 1,
    coursesCompleted: 0,
    skillsImproved: 0,
    lastVisit: new Date().toISOString()
  })

  useEffect(() => {
    // Load existing progress data
    const stored = localStorage.getItem('user_progress')
    if (stored) {
      const data = JSON.parse(stored)
      setProgressData(data)
    }

    // Update visit count
    const updateVisits = () => {
      const today = new Date().toDateString()
      const lastVisit = stored ? JSON.parse(stored).lastVisit : null
      const lastVisitDate = lastVisit ? new Date(lastVisit).toDateString() : null

      if (lastVisitDate !== today) {
        setProgressData((prev) => {
          const newData = {
            ...prev,
            visits: prev.visits + 1,
            lastVisit: new Date().toISOString()
          }
          localStorage.setItem('user_progress', JSON.stringify(newData))
          return newData
        })
      }
    }

    updateVisits()
  }, [setProgressData])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Visits</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progressData.visits}</div>
          <Progress value={getProgressPercentage(progressData.visits, 10)} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {10 - progressData.visits > 0 ? `${10 - progressData.visits} more to unlock features` : "All features unlocked!"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progressData.coursesCompleted}/5</div>
          <Progress value={getProgressPercentage(progressData.coursesCompleted, 5)} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Courses completed this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Skill Development</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progressData.skillsImproved}/8</div>
          <Progress value={getProgressPercentage(progressData.skillsImproved, 8)} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Skills improved this quarter
          </p>
        </CardContent>
      </Card>
    </div>
  )
}