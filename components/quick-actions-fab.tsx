"use client"

import { useState } from "react"
import { Plus, BookOpen, Zap, Target, BarChart3 } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      icon: BookOpen,
      label: "View Courses",
      href: "/dashboard/recommendations",
      description: "Browse recommended courses",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      icon: Zap,
      label: "Trending Skills",
      href: "/dashboard/analytics",
      description: "See trending skills this week",
      color: "bg-yellow-500 hover:bg-yellow-600",
    },
    {
      icon: Target,
      label: "Practice Problems",
      href: "/dashboard/recommendations",
      description: "Start coding problems",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      href: "/dashboard/analytics",
      description: "Check your progress",
      color: "bg-green-500 hover:bg-green-600",
    },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3"
            role="region"
            aria-label="Quick actions menu"
          >
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={action.href}>
                    <button
                      className="group flex items-center gap-3 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      aria-label={action.label}
                      title={action.description}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className={`p-3 rounded-full text-white ${action.color} transition-all`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="absolute right-16 bg-card border border-border rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <p className="text-sm font-semibold text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </button>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
        role="button"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </motion.div>
      </motion.button>
    </div>
  )
}
