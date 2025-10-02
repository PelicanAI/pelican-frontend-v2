"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ANIMATION_CONFIG, messageVariants } from "@/lib/animation-config"

interface EnhancedTypingDotsProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "thinking" | "processing"
}

export function EnhancedTypingDots({ className, size = "md", variant = "default" }: EnhancedTypingDotsProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  }

  const messages = {
    default: "Pelican is typing",
    thinking: "Pelican is thinking",
    processing: "Processing your request",
  }

  return (
    <motion.div 
      initial={messageVariants.thinkingIndicator.initial}
      animate={messageVariants.thinkingIndicator.animate}
      exit={messageVariants.thinkingIndicator.exit}
      transition={messageVariants.thinkingIndicator.transition}
      className={cn("flex items-center gap-3", className)} 
      aria-label={messages[variant]} 
      role="status"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn("bg-current rounded-full", sizeClasses[size])}
            animate={{
              y: [0, -8, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: index * 0.15,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </div>

      <motion.div
        className="px-3 py-1 rounded-full bg-current/5"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: ANIMATION_CONFIG.typingIndicator.duration,
          repeat: Infinity,
          ease: ANIMATION_CONFIG.typingIndicator.ease,
        }}
      >
        <motion.span
          className="text-sm text-muted-foreground font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: ANIMATION_CONFIG.typingIndicator.duration, 
            repeat: Infinity 
          }}
        >
          {messages[variant]}...
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
