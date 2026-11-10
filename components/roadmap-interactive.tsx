"use client"

import { useState } from "react"
import { ChevronRight, ExternalLink, BookOpen, Play } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RoadmapNode {
  id: string
  title: string
  description: string
  skills: string[]
  resources: Array<{
    title: string
    type: "course" | "article" | "video" | "documentation"
    link: string
    provider: string
    duration?: string
  }>
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: string
  completed?: boolean
}

interface RoadmapInteractiveProps {
  nodes: RoadmapNode[]
  role: string
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function RoadmapInteractive({ nodes, role }: RoadmapInteractiveProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const toggleCompletion = (id: string) => {
    const next = new Set(completedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCompletedNodes(next)
  }

  const completionPercentage = Math.round(
    (completedNodes.size / nodes.length) * 100
  )

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{role} Roadmap Progress</h3>
          <span className="text-sm text-muted-foreground">
            {completedNodes.size}/{nodes.length} completed
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {completionPercentage}% complete
        </p>
      </div>

      {/* Roadmap Nodes */}
      <div className="space-y-3">
        {nodes.map((node, index) => {
          const isExpanded = expandedId === node.id
          const isCompleted = completedNodes.has(node.id)

          return (
            <div key={node.id} className="relative">
              {/* Connection Line */}
              {index < nodes.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
              )}

              {/* Node Card */}
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  isCompleted
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : "hover:shadow-md"
                }`}
                onClick={() => toggleNode(node.id)}
              >
                <div className="flex gap-4">
                  {/* Checkpoint Circle */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCompletion(node.id)
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-foreground border-2 border-primary/50"
                      }`}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4
                          className={`font-semibold text-lg ${
                            isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {node.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {node.description}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <Badge className={difficultyColors[node.difficulty]}>
                        {node.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ⏱️ {node.estimatedTime}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {node.skills.length} skills
                      </span>
                    </div>

                    {/* Skills Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {node.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {node.skills.length > 4 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                          +{node.skills.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Expanded Resources */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <p className="text-sm font-medium">Learning Resources:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {node.resources.map((resource, idx) => {
                            const typeIcons = {
                              course: "🎓",
                              article: "📝",
                              video: "🎬",
                              documentation: "📚",
                            }
                            return (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                asChild
                                className="justify-start text-xs h-auto py-2"
                              >
                                <a
                                  href={resource.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="mr-1">
                                    {typeIcons[resource.type]}
                                  </span>
                                  <span className="flex-1 text-left truncate">
                                    {resource.title}
                                  </span>
                                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                                </a>
                              </Button>
                            )
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Provider: {node.resources[0]?.provider || "Multiple"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
