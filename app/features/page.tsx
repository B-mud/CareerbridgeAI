"use client"

import Link from "next/link"
import { BarChart3, BookOpen, Zap, Trophy, CheckCircle2, Rocket, Shield, Database, Brain, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"

/**
 * Real Features Page
 * Shows only production features and the roadmap (no duplicate mock test UI here)
 */

export default function FeaturesPage() {
  const liveFeatures = [
    {
      title: "AI Resume Analysis",
      description: "Gemini-powered parsing with skill extraction, role prediction, and structured profile generation.",
      icon: Brain,
      status: "Live",
    },
    {
      title: "Skill Gap Engine",
      description: "Weighted role matching using core/preferred/nice-to-have skill priorities and alias normalization.",
      icon: Zap,
      status: "Live",
    },
    {
      title: "Personalized Learning Path",
      description: "Courses, roadmap steps, and coding practice recommendations generated from your real analysis data.",
      icon: BookOpen,
      status: "Live",
    },
    {
      title: "Mock Test + Job Unlock",
      description: "Difficulty-weighted quiz scoring with pass thresholds that unlock better job recommendations.",
      icon: Trophy,
      status: "Live",
    },
    {
      title: "AI Job Matching",
      description: "TF-IDF + cosine similarity ranking with overlap and experience-level adjustments.",
      icon: BarChart3,
      status: "Live",
    },
    {
      title: "Secure Auth + Persistence",
      description: "Supabase auth, JWT-secured APIs, activity logging, and persistent analysis storage.",
      icon: Shield,
      status: "Live",
    },
  ]

  const futureUpdates = [
    "Real-time progress tracking for each recommended course/module",
    "Smarter job feed with direct partner integrations",
    "Interview preparation mode with role-specific question sets",
    "Portfolio and project evidence scoring",
    "Admin analytics dashboard for platform-level insights",
    "Advanced explainability for match score components",
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">AI Career Mentor Features</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              This page shows the real features currently running in production and the planned roadmap.
              Mock tests are available from Dashboard → Mock Tests.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            <Badge variant="secondary" className="px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
              Production Ready
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Database className="h-3 w-3 mr-1" />
              Supabase + FastAPI
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {liveFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} role="region" aria-label={feature.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{feature.description}</p>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{feature.status}</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="mb-10" role="region" aria-label="Future updates roadmap">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Future Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {futureUpdates.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/mock-test">Take Mock Test</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/jobs">Explore Job Matches</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
