"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, RefreshCw, Coffee, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: "error" | "warning" | "info"
  onRetry?: () => void
}

const funErrorMessages = [
  "Oops! Something went sideways 🤪",
  "Houston, we have a problem! 🚀",
  "Error 404: Coffee not found ☕",
  "Looks like our AI took a coffee break! ☕",
  "Something's not quite right here... 🤔",
  "Our servers are having a moment 😅",
  "Whoopsie daisy! 🌼",
  "Plot twist: This wasn't supposed to happen! 🎭"
]

const getRandomFunMessage = () => {
  return funErrorMessages[Math.floor(Math.random() * funErrorMessages.length)]
}

export function ErrorPopup({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "error",
  onRetry 
}: ErrorPopupProps) {
  const funTitle = title || getRandomFunMessage()
  
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "info":
        return <Zap className="h-6 w-6 text-blue-500" />
      default:
        return <Coffee className="h-6 w-6 text-red-500" />
    }
  }

  const getColors = () => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"
      case "info":
        return "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
      default:
        return "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className={`${getColors()} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon()}
                    <CardTitle className="text-lg font-semibold">
                      {funTitle}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {message}
                </p>
                
                <div className="flex gap-2 justify-end">
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Try Again
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={onClose}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Got it!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}