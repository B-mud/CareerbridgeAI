import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Target, BookOpen, Trophy } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <div className="container relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-muted-foreground">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Powered by Advanced AI Technology
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
            <span className="text-gradient">AI-Powered</span>{" "}
            <span className="text-foreground">Career Mentor</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground text-pretty mb-8 leading-relaxed">
            Upload your resume, discover skill gaps, get personalized recommendations and mock tests to accelerate your
            career growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signin">
                Sign In
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link href="/signup">
                Sign Up
              </Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Upload, label: "Resume Upload" },
              { icon: Target, label: "Skill Analysis" },
              { icon: BookOpen, label: "Learning Path" },
              { icon: Trophy, label: "Mock Tests" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 glass rounded-xl hover:bg-card/90 transition-all duration-300"
              >
                <item.icon className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
