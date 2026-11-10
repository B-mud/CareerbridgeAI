"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle2, BookOpen } from "lucide-react"

type RoadmapStep = {
  skill: string
  action: string
  priority: string
  estimated_time: string
  resources: Array<{
    name: string
    platform: string
    link?: string
  }>
}

interface RoadmapGraphProps {
  steps: RoadmapStep[]
  completedSteps?: Record<number, boolean>
}

const priorityBgColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
    case 'high':
      return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300'
    case 'medium':
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
    default:
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
  }
}

export function RoadmapGraph({ steps, completedSteps = {} }: RoadmapGraphProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        No roadmap graph available yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps[index]
        const resource = step.resources?.[0]
        
        let targetLink = `https://youtube.com/results?search_query=${encodeURIComponent(step.skill + " tutorial")}`
        const skillLower = step.skill.toLowerCase()
        if (skillLower.includes("data structure") || skillLower.includes("algorithm")) {
          targetLink = `https://leetcode.com/problemset/all/?search=${encodeURIComponent(step.skill)}`
        } else if (skillLower.includes("react") || skillLower.includes("web") || skillLower.includes("html") || skillLower.includes("css")) {
          targetLink = `https://www.freecodecamp.org/learn/`
        } else if (skillLower.includes("python") || skillLower.includes("machine learning") || skillLower.includes("ai")) {
          targetLink = `https://www.kaggle.com/search?q=${encodeURIComponent(step.skill)}`
        }
        const resourceLink = resource?.link || targetLink

        return (
          <div key={`${step.skill}-${index}`} className="relative">
            <div className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
              isCompleted 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-card/60 hover:bg-card/80'
            }`}>
              <div className="flex flex-col items-center pt-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-primary/20 text-primary dark:bg-primary/30'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && <div className="w-px h-12 bg-border mt-2" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className={`font-semibold ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {step.skill}
                  </p>
                  <Badge className={`${priorityBgColor(step.priority)} text-xs whitespace-nowrap`}>
                    {step.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">{step.action}</p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <BookOpen className="h-3 w-3" />
                  {step.estimated_time}
                </div>

                {step.resources && step.resources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {step.resources.slice(0, 3).map((res, rIdx) => {
                      const link = res.link || resourceLink
                      return (
                        <Button key={rIdx} size="sm" variant="outline" asChild className="text-xs">
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            {res.platform}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
