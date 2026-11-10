"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

interface DashboardChartProps {
  data?: {
    skillsMastered: number
    skillsTotal: number
    missingSkillsTotal: number
    mockTestScore: number
  }
}

export function DashboardChart({ data }: DashboardChartProps) {
  const generateChartData = () => {
    if (!data) return null

    // Calculate percentages based on total skills needed
    const totalSkillsNeeded = data.skillsTotal || data.skillsMastered + data.missingSkillsTotal
    const matchedPercent = Math.round((data.skillsMastered / totalSkillsNeeded) * 100)
    const neededPercent = totalSkillsNeeded > 0 ? 100 : 0
    const gapPercent = 100 - matchedPercent

    // 5-level career progression showing skill mastery across levels
    return [
      { level: "Beginner",     matched: 15,       gap: 85,       needed: 100       },
      { level: "Junior",       matched: 35,       gap: 65,       needed: 100       },
      { level: "You ▶",        matched: matchedPercent, gap: gapPercent,   needed: 100 },
      { level: "Senior",       matched: 80,       gap: 20,       needed: 100       },
      { level: "Expert",       matched: 95,       gap: 5,        needed: 100       },
    ]
  }

  const chartData = generateChartData()
  const totalKnown = data ? data.skillsMastered + data.missingSkillsTotal : 0
  const hasData = data && data.skillsMastered >= 0

  return (
    <Card className="col-span-4 hover:bg-card/50 transition-colors">
      <CardHeader>
        <CardTitle>Skill Profile vs Career Levels</CardTitle>
        {hasData ? (
          <p className="text-sm text-muted-foreground">
            Your position across the career progression curve — based on resume analysis
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload your resume to visualise your career level
          </p>
        )}
      </CardHeader>
      <CardContent className="pl-2">
        {!hasData || !chartData ? (
          <div className="h-[350px] flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-4">No data available yet</p>
            <p className="text-sm text-muted-foreground">Upload your resume to visualize your learning progress</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSkills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradGap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="level"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Legend
                formatter={(value) =>
                  value === "matched" ? "Your Skills (Blue)":
                  value === "gap"    ? "Skill Gap (Orange)" :
                                       "Required Skills (Green)"
                }
                wrapperStyle={{ fontSize: 12, paddingTop: 8, paddingBottom: 8 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                      <p className="font-semibold text-foreground mb-2">{label}</p>
                      <div className="space-y-1">
                        {payload.map((p, i) => {
                          if (!p) return null
                          const name =
                            p.dataKey === "matched" ? "Your Skills" :
                            p.dataKey === "gap"    ? "Skill Gap" :
                                                     "Required Skills"
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: p.color ?? "#888" }}
                              />
                              <span className="text-muted-foreground">{name}:</span>
                              <span className="font-bold text-foreground">{p.value}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }}
              />

              <Area
                type="monotone"
                dataKey="matched"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#gradSkills)"
                dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="gap"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#gradGap)"
                dot={{ fill: "#f97316", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="needed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradMatch)"
                dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
