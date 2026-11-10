import { FeatureCard } from "@/components/feature-card"
import { FileText, Target, BookOpen, Trophy, Users, TrendingUp } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "AI Resume Parsing",
    description:
      "Advanced AI extracts and analyzes skills, experience, and qualifications from your resume with precision.",
  },
  {
    icon: Target,
    title: "Skill Gap Analysis",
    description:
      "Compare your skills against role requirements and identify areas for improvement with detailed insights.",
  },
  {
    icon: BookOpen,
    title: "Personalized Learning",
    description: "Get curated course recommendations and LeetCode problems tailored to your career goals.",
  },
  {
    icon: Trophy,
    title: "Mock Tests & Assessments",
    description: "Practice with industry-standard tests and receive detailed feedback to improve your performance.",
  },
  {
    icon: Users,
    title: "Job Recommendations",
    description: "Discover relevant job opportunities that match your skills and career aspirations.",
  },
  {
    icon: TrendingUp,
    title: "Career Progress Tracking",
    description: "Monitor your skill development and career advancement with comprehensive analytics.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Accelerate Your Career Growth
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive AI-powered tools to analyze, improve, and advance your professional journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
