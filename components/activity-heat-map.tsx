'use client'

import React, { useEffect, useState, memo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Memoized tooltip for performance
const MemoizedTooltip = memo(({ children, content }: { children: React.ReactNode; content: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>{content}</TooltipContent>
  </Tooltip>
))
MemoizedTooltip.displayName = 'MemoizedTooltip'

interface HeatMapData {
  [date: string]: number
}

interface ActivityStats {
  total_activities: number
  unique_days: number
  current_streak: number
  longest_streak: number
}

interface ActivityHeatMapProps {
  userId: string
  authToken?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ActivityHeatMap({ userId, authToken }: ActivityHeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<HeatMapData>({})
  const [stats, setStats] = useState<ActivityStats>({
    total_activities: 0,
    unique_days: 0,
    current_streak: 0,
    longest_streak: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const fetchHeatMapData = useCallback(async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(
        `http://localhost:8000/api/activity/heat-map-data?user_id=${userId}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch heat map data: ${response.statusText}`)
      }

      const data = await response.json()
      setHeatMapData(data.heat_map || {})
      setStats(data.stats || {})
      setError(null)
    } catch (err) {
      console.error('❌ Error fetching heat map data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity data')
    } finally {
      setLoading(false)
    }
  }, [userId, authToken])

  useEffect(() => {
    fetchHeatMapData()
  }, [fetchHeatMapData])

  useEffect(() => {
    const onActivityLogged = () => {
      fetchHeatMapData()
    }

    window.addEventListener('activity:logged', onActivityLogged as EventListener)
    const intervalId = window.setInterval(() => {
      fetchHeatMapData()
    }, 30000)

    return () => {
      window.removeEventListener('activity:logged', onActivityLogged as EventListener)
      window.clearInterval(intervalId)
    }
  }, [fetchHeatMapData])

  // Generate calendar grid for past year
  const generateCalendarGrid = () => {
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - 1)

    const weeks: (Date | null)[][] = []
    let currentWeek: (Date | null)[] = []

    // Fill in empty days at the start
    const firstDate = new Date(startDate)
    const dayOfWeek = firstDate.getDay()
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(null)
    }

    // Fill calendar with dates
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      currentWeek.push(new Date(currentDate))
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in remaining empty days
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null)
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }

  const getActivityLevel = (count: number): string => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-700/30'
    if (count === 1) return 'bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/60'
    if (count <= 3) return 'bg-teal-300 dark:bg-teal-800/60 hover:bg-teal-400 dark:hover:bg-teal-800/80'
    if (count <= 5) return 'bg-teal-500 dark:bg-teal-700 hover:bg-teal-600 dark:hover:bg-teal-600'
    if (count <= 7) return 'bg-teal-600 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500'
    return 'bg-teal-700 dark:bg-teal-500 hover:bg-teal-800 dark:hover:bg-teal-400'
  }

  const getActivityTooltip = (date: Date | null, count: number): string => {
    if (!date) return ''
    const dateStr = date.toISOString().split('T')[0]
    return `${dateStr}: ${count} activities`
  }

  const weeks = generateCalendarGrid()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-muted-foreground">Loading activity data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Heat Map</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              🔥 {stats.current_streak} day streak
            </Badge>
            <Badge variant="outline" className="text-xs">
              ⭐ {stats.longest_streak} max streak
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-muted-foreground text-xs font-medium">Total Activities</div>
            <div className="text-2xl font-bold">{stats.total_activities}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-muted-foreground text-xs font-medium">Active Days</div>
            <div className="text-2xl font-bold">{stats.unique_days}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-muted-foreground text-xs font-medium">This Week</div>
            <div className="text-2xl font-bold">
              {Object.entries(heatMapData)
                .filter(([date]) => {
                  const d = new Date(date)
                  const today = new Date()
                  const weekAgo = new Date(today)
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return d >= weekAgo && d <= today
                })
                .reduce((sum, [, count]) => sum + count, 0)}
            </div>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="overflow-x-auto pt-4">
          <div className="inline-block">
            {/* Day labels */}
            <div className="flex gap-1 mb-2">
              <div className="w-8" /> {/* spacing for week numbers */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="w-6 text-center text-xs font-medium text-muted-foreground"
                >
                  {day[0]}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1">
                  <div className="w-8 text-right text-xs text-muted-foreground pt-1">
                    {weekIndex % 2 === 0 ? `W${Math.floor(weekIndex / 2) + 1}` : ''}
                  </div>
                  {week.map((date, dayIndex) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : ''
                    const count = dateStr ? (heatMapData[dateStr] || 0) : 0
                    
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-6 h-6 rounded-sm cursor-pointer transition-colors ${
                          date ? getActivityLevel(count) : 'bg-transparent'
                        }`}
                        title={getActivityTooltip(date, count)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground border-t">
          <span className="font-medium">Contributions:</span>
          <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800/30 border border-slate-300 dark:border-slate-700" />
          <div className="w-3 h-3 rounded-sm bg-teal-100 dark:bg-teal-900/40" />
          <div className="w-3 h-3 rounded-sm bg-teal-300 dark:bg-teal-800/60" />
          <div className="w-3 h-3 rounded-sm bg-teal-500 dark:bg-teal-700" />
          <div className="w-3 h-3 rounded-sm bg-teal-700 dark:bg-teal-500" />
          <span className="ml-2">(Less • More)</span>
        </div>
      </CardContent>
    </Card>
  )
}
