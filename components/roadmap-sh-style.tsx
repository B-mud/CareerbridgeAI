"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, CheckCircle2, Circle, BookOpen, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface RoadmapTopic {
  id: string
  title: string
  description?: string
  resources?: Array<{
    title: string
    url: string
    type: "course" | "article" | "video" | "tutorial"
  }>
  subtopics?: RoadmapTopic[]
  prerequisites?: string[]
  estimatedTime?: string
  completed?: boolean
}

export interface RoadmapCategory {
  id: string
  title: string
  description?: string
  topics: RoadmapTopic[]
}

interface RoadmapShStyleProps {
  categories: RoadmapCategory[]
  completedTopics?: Record<string, boolean>
  onTopicSelect?: (topic: RoadmapTopic) => void
}

const resourceTypeColor = (type: string) => {
  switch (type) {
    case "course":
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
    case "article":
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200"
    case "video":
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
    case "tutorial":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200"
    default:
      return "bg-gray-100 dark:bg-gray-900/20"
  }
}

function TopicNode({
  topic,
  depth = 0,
  completed,
  onSelect,
}: {
  topic: RoadmapTopic
  depth?: number
  completed?: boolean
  onSelect?: (topic: RoadmapTopic) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasSubtopics = topic.subtopics && topic.subtopics.length > 0
  const hasResources = topic.resources && topic.resources.length > 0

  return (
    <div className="space-y-2">
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
          completed
            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
            : "bg-card/50 hover:bg-card/80 border-border/50"
        }`}
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 pt-1"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasSubtopics ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
        </button>

        <div className="flex-shrink-0 pt-0.5">
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => onSelect?.(topic)}
            className={`font-medium text-sm transition-all ${
              completed
                ? "text-muted-foreground line-through"
                : "text-foreground hover:text-primary"
            }`}
          >
            {topic.title}
          </button>
          {topic.description && (
            <p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
          )}
          {topic.estimatedTime && (
            <p className="text-xs text-muted-foreground mt-1">⏱ {topic.estimatedTime}</p>
          )}

          {hasResources && (
            <div className="flex flex-wrap gap-2 mt-3">
              {topic.resources?.slice(0, 3).map((resource, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  asChild
                >
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className={`${resourceTypeColor(resource.type)} py-0.5`}>
                      {resource.type}
                    </Badge>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasSubtopics && expanded && (
        <div className="space-y-2">
          {topic.subtopics?.map((subtopic) => (
            <TopicNode
              key={subtopic.id}
              topic={subtopic}
              depth={depth + 1}
              completed={completed}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function RoadmapShStyle({
  categories,
  completedTopics = {},
  onTopicSelect,
}: RoadmapShStyleProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-6 border border-dashed rounded-lg text-center">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No roadmap categories available yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div
          key={category.id}
          className="border rounded-lg overflow-hidden bg-card/30 hover:bg-card/50 transition-colors"
        >
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between gap-4 p-4 font-semibold text-left hover:bg-card/60 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {expandedCategories[category.id] ? (
                <ChevronDown className="h-5 w-5 text-primary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <h3 className="text-base font-semibold">{category.title}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <Badge variant="outline">
              {category.topics.length} topics
            </Badge>
          </button>

          {expandedCategories[category.id] && (
            <div className="border-t border-border/50 p-4 space-y-3">
              {category.topics.map((topic) => (
                <TopicNode
                  key={topic.id}
                  topic={topic}
                  completed={completedTopics[topic.id]}
                  onSelect={onTopicSelect}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
