"use client"

import Link from "next/link"
import { BarChart3, TrendingUp, Users, Zap } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/navbar"
import { PageTransition } from "@/components/page-transition"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts"

/**
 * Analytics Dashboard Page
 * Shows trending skills, user statistics, and learning insights
 */

export default function AnalyticsDashboardPage() {
  // Trending skills data
  const trendingSkills = [
    { name: "React", demand: 95, growth: 12 },
    { name: "TypeScript", demand: 88, growth: 18 },
    { name: "Python", demand: 92, growth: 15 },
    { name: "Node.js", demand: 87, growth: 11 },
    { name: "GraphQL", demand: 72, growth: 25 },
    { name: "Docker", demand: 85, growth: 14 },
    { name: "Kubernetes", demand: 68, growth: 20 },
    { name: "AWS", demand: 91, growth: 13 },
  ]

  // Learning path progress
  const learningProgress = [
    { name: "Week 1", completed: 3, inProgress: 2, notStarted: 5 },
    { name: "Week 2", completed: 5, inProgress: 3, notStarted: 2 },
    { name: "Week 3", completed: 7, inProgress: 2, notStarted: 1 },
    { name: "Week 4", completed: 8, inProgress: 1, notStarted: 1 },
  ]

  // Skill distribution
  const skillDistribution = [
    { name: "Frontend", value: 35 },
    { name: "Backend", value: 25 },
    { name: "DevOps", value: 20 },
    { name: "Database", value: 15 },
    { name: "Other", value: 5 },
  ]

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

  // User statistics
  const stats = [
    { label: "Total Users", value: "24,589", icon: Users, change: "+12.5%" },
    { label: "Active Users", value: "18,432", icon: TrendingUp, change: "+8.2%" },
    { label: "Trending Topics", value: "142", icon: Zap, change: "+5.3%" },
    { label: "Avg Completion Rate", value: "78%", icon: BarChart3, change: "+3.1%" },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-primary" aria-hidden="true" />
                <h1 className="text-4xl font-bold text-foreground">Learning Analytics</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Comprehensive insights into skill trends and learning progress
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card
                    key={stat.label}
                    className="hover:bg-card/50 transition-colors"
                    role="region"
                    aria-label={stat.label}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">{stat.change} from last month</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Trending Skills */}
              <Card className="hover:bg-card/50 transition-colors" role="region" aria-label="Trending Skills">
                <CardHeader>
                  <CardTitle>Trending Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={trendingSkills}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="demand" fill="#3b82f6" name="Demand" />
                      <Bar dataKey="growth" fill="#10b981" name="Growth %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Learning Progress */}
              <Card className="hover:bg-card/50 transition-colors" role="region" aria-label="Learning Progress">
                <CardHeader>
                  <CardTitle>Learning Progress by Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={learningProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                      <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
                      <Bar dataKey="notStarted" stackId="a" fill="#ef4444" name="Not Started" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Skill Distribution and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skill Distribution Pie */}
              <Card className="hover:bg-card/50 transition-colors lg:col-span-1" role="region" aria-label="Skill Distribution">
                <CardHeader>
                  <CardTitle>Skill Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={skillDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {skillDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Recommended Skills */}
              <Card className="hover:bg-card/50 transition-colors lg:col-span-2" role="region" aria-label="Top Recommended Skills">
                <CardHeader>
                  <CardTitle>Top Recommended Skills to Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trendingSkills.slice(0, 6).map((skill, index) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            {skill.growth}% growth
                          </span>
                        </div>
                        <Progress
                          value={skill.demand}
                          className="h-2"
                          role="progressbar"
                          aria-valuenow={skill.demand}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${skill.name} demand: ${skill.demand}%`}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Demand: {skill.demand}%</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                aria-label="Back to dashboard"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
