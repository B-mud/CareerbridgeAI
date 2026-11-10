"use client"

import { motion } from "framer-motion"
import { Brain, Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  submessage?: string
}

export function LoadingScreen({ message = "Loading...", submessage }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Brain className="h-12 w-12 text-primary mx-auto" />
        </motion.div>
        
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold text-foreground mb-2"
        >
          {message}
        </motion.h3>
        
        {submessage && (
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm"
          >
            {submessage}
          </motion.p>
        )}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring" }}
          className="mt-4"
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    </motion.div>
  )
}