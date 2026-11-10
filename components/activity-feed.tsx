'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, BookOpen, Code2, Brain, Briefcase, Upload, Clock } from 'lucide-react'
import { useCallback } from 'react'

interface Activity {
  id: string
  user_id: string
  action_type: string
  details: Record<string, any>
  created_at: string
}

interface ActivityFeedProps {
  userId: string
  authToken?: string
  limit?: number
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  mock_test_completed: Trophy,
  course_completed: BookOpen,
  practice_problem_solved: Code2,
  skill_analyzed: Brain,
  job_viewed: Briefcase,
  resume_uploaded: Upload,
  course_started: BookOpen,
  learning_path_accessed: Brain,
}

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  mock_test_completed: { label: 'Mock Test Passed', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  course_completed: { label: 'Course Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  practice_problem_solved: { label: 'Problem Solved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  skill_analyzed: { label: 'Skill Analyzed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  job_viewed: { label: 'Job Viewed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  resume_uploaded: { label: 'Resume Uploaded', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
  course_started: { label: 'Course Started', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  learning_path_accessed: { label: 'Learning Path Started', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' },
}

export function ActivityFeed({ userId, authToken, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(
        `http://localhost:8000/api/activity/user-history?user_id=${userId}&days=90`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`)
      }

      const data = await response.json()
      setActivities((data.activities || []).slice(0, limit))
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [userId, authToken, limit])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    const onActivityLogged = () => {
      fetchActivities()
    }

    window.addEventListener('activity:logged', onActivityLogged as EventListener)
    const intervalId = window.setInterval(() => {
      fetchActivities()
    }, 30000)

    return () => {
      window.removeEventListener('activity:logged', onActivityLogged as EventListener)
      window.clearInterval(intervalId)
    }
  }, [fetchActivities])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getActivityDetails = (activity: Activity): string => {
    const { action_type, details } = activity
    
    switch (action_type) {
      case 'mock_test_completed':
        return `Score: ${details.score || 'N/A'}% • ${details.time_spent ? Math.floor(details.time_spent / 60) + 'm' : 'N/A'}`
      case 'course_completed':
        return `${details.course_name || 'A course'} completed`
      case 'practice_problem_solved':
        return `${details.problem_name || 'A problem'} solved`
      case 'job_viewed':
        return `${details.job_title || 'A job'} viewed`
      default:
        return details.description || ''
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Loading activities...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No activity yet. Start learning to see your activity here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = ACTIVITY_ICONS[activity.action_type] || Brain
            const activityInfo = ACTIVITY_LABELS[activity.action_type] || {
              label: activity.action_type,
              color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
            }

            return (
              <div
                key={activity.id}
                className="flex gap-4 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg ${activityInfo.color} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{activityInfo.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getActivityDetails(activity)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(activity.created_at)}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
