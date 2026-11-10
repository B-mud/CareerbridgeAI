"use client"

import { useState } from "react"
import { X, BookOpen, Code2, TrendingUp, Star, Users, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Skill Details Modal Component
 * Comprehensive skill information with learning resources and community data
 */

export interface SkillInfo {
  name: string
  proficiency: number
  marketDemand: number
  growthRate: number
  description: string
  relatedSkills: string[]
  courses: Array<{
    title: string
    provider: string
    duration: string
    level: string
    rating: number
  }>
  jobs: Array<{
    title: string
    company: string
    salary: string
  }>
}

const SAMPLE_SKILLS: Record<string, SkillInfo> = {
  React: {
    name: "React",
    proficiency: 75,
    marketDemand: 95,
    growthRate: 12,
    description: "A JavaScript library for building user interfaces with reusable components and efficient rendering.",
    relatedSkills: ["JavaScript", "TypeScript", "HTML/CSS", "Redux", "Next.js"],
    courses: [
      { title: "Advanced React Patterns", provider: "Udemy", duration: "12 hours", level: "Advanced", rating: 4.8 },
      { title: "React: The Complete Guide", provider: "Udemy", duration: "48 hours", level: "Beginner", rating: 4.9 },
      { title: "React Performance Optimization", provider: "Frontend Masters", duration: "6 hours", level: "Advanced", rating: 4.7 },
    ],
    jobs: [
      { title: "Senior Frontend Developer", company: "Google", salary: "$150k-$200k" },
      { title: "React Developer", company: "Meta", salary: "$140k-$190k" },
      { title: "Full Stack Developer", company: "Netflix", salary: "$160k-$220k" },
    ],
  },
  TypeScript: {
    name: "TypeScript",
    proficiency: 60,
    marketDemand: 88,
    growthRate: 18,
    description: "A typed superset of JavaScript that compiles to plain JavaScript with better tooling support.",
    relatedSkills: ["JavaScript", "React", "Node.js", "GraphQL", "REST APIs"],
    courses: [
      { title: "TypeScript Fundamentals", provider: "Pluralsight", duration: "8 hours", level: "Beginner", rating: 4.7 },
      { title: "Advanced TypeScript", provider: "egghead.io", duration: "6 hours", level: "Advanced", rating: 4.8 },
      { title: "TypeScript for React Developers", provider: "Udemy", duration: "10 hours", level: "Intermediate", rating: 4.6 },
    ],
    jobs: [
      { title: "TypeScript Developer", company: "Microsoft", salary: "$140k-$180k" },
      { title: "Full Stack Engineer", company: "Airbnb", salary: "$155k-$210k" },
      { title: "Backend Developer", company: "Stripe", salary: "$150k-$200k" },
    ],
  },
}

interface SkillDetailsModalProps {
  skill?: string
  open?: boolean
  onClose?: () => void
}

export function SkillDetailsModal({ skill: initialSkill = "React", open = true, onClose }: SkillDetailsModalProps) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill)
  const [isOpen, setIsOpen] = useState(open)

  const skillInfo = SAMPLE_SKILLS[selectedSkill] || SAMPLE_SKILLS.React

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-modal-title"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
              <div>
                <h2 id="skill-modal-title" className="text-2xl font-bold">{skillInfo.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">Master this in-demand skill</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div role="region" aria-label="Skill description">
                <p className="text-muted-foreground">{skillInfo.description}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <Card role="region" aria-label="Your proficiency">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Your Proficiency</p>
                    </div>
                    <p className="text-2xl font-bold">{skillInfo.proficiency}%</p>
                    <Progress value={skillInfo.proficiency} className="mt-2 h-1" />
                  </CardContent>
                </Card>

                <Card role="region" aria-label="Market demand">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Market Demand</p>
                    </div>
                    <p className="text-2xl font-bold">{skillInfo.marketDemand}%</p>
                    <Progress value={skillInfo.marketDemand} className="mt-2 h-1" />
                  </CardContent>
                </Card>

                <Card role="region" aria-label="Growth rate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-500" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Growth Rate</p>
                    </div>
                    <p className="text-2xl font-bold">+{skillInfo.growthRate}%</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">Year-over-year</p>
                  </CardContent>
                </Card>
              </div>

              {/* Related Skills */}
              <div role="region" aria-label="Related skills">
                <h3 className="font-semibold mb-3">Related Skills to Learn</h3>
                <div className="flex flex-wrap gap-2">
                  {skillInfo.relatedSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedSkill === skill
                          ? "bg-primary text-white"
                          : "bg-muted hover:bg-muted-foreground/20"
                      }`}
                      aria-label={`View details for ${skill}`}
                      aria-pressed={selectedSkill === skill}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Courses */}
              <div role="region" aria-label="Recommended courses">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  <h3 className="font-semibold">Recommended Courses</h3>
                </div>
                <div className="space-y-3">
                  {skillInfo.courses.map((course, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg" role="listitem">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.provider}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />
                          <span className="text-xs font-semibold">{course.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{course.duration}</span>
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded">{course.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Opportunities */}
              <div role="region" aria-label="Job opportunities">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <h3 className="font-semibold">Job Opportunities</h3>
                </div>
                <div className="space-y-3">
                  {skillInfo.jobs.map((job, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg" role="listitem">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company}</p>
                        </div>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">{job.salary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button className="flex-1" aria-label={`Enroll in ${skillInfo.name} course`}>
                  <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                  Enroll Now
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleClose} aria-label="Close">
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
