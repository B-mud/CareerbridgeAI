import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

interface SkillBadgeProps {
  skill: string
  type: "detected" | "missing"
}

export function SkillBadge({ skill, type }: SkillBadgeProps) {
  const isDetected = type === "detected"
  
  return (
    <Badge
      variant={isDetected ? "default" : "secondary"}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200
        ${isDetected 
          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100" 
          : "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-100"
        }
      `}
    >
      {isDetected ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {skill}
    </Badge>
  )
}