/**
 * Animation Configuration
 * 
 * Centralized animation settings for consistent, configurable animations throughout the chat.
 * All timing values are in milliseconds.
 */

export const ANIMATION_CONFIG = {
  // Message send animation - when user submits a message
  messageSend: {
    duration: 0.4, // seconds (400ms)
    easing: [0.4, 0, 0.2, 1], // ease-out cubic bezier
    type: 'slideUp' as const, // options: 'slideUp', 'fadeIn', 'scale', 'none'
    delay: 0,
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  },

  // AI response animation - when AI starts responding
  aiResponse: {
    duration: 0.3, // seconds (300ms)
    easing: [0.4, 0, 0.6, 1], // ease-in-out cubic bezier
    type: 'fadeIn' as const,
    delay: 0.1, // Slight delay for polish
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
  },

  // Typing indicator animation - "Pelican is thinking"
  typingIndicator: {
    duration: 1.5, // seconds
    repeat: Infinity,
    ease: "easeInOut" as const,
  },

  // Message content streaming - smooth text appearance
  textStream: {
    duration: 0.15, // Quick fade for each word/chunk
    easing: [0, 0, 0.2, 1],
  },

  // Layout transitions - when messages expand/contract
  layout: {
    duration: 0.3,
    easing: [0.4, 0, 0.2, 1],
  },

  // Stagger children - for multiple elements animating in sequence
  stagger: {
    delayChildren: 0.05,
    staggerChildren: 0.03,
  },
} as const

// Framer Motion variants for common animations
export const messageVariants = {
  // User message sliding up from input
  userMessage: {
    initial: ANIMATION_CONFIG.messageSend.initial,
    animate: ANIMATION_CONFIG.messageSend.animate,
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
    transition: {
      duration: ANIMATION_CONFIG.messageSend.duration,
      ease: ANIMATION_CONFIG.messageSend.easing,
      delay: ANIMATION_CONFIG.messageSend.delay,
    },
  },

  // AI message fading in
  aiMessage: {
    initial: ANIMATION_CONFIG.aiResponse.initial,
    animate: ANIMATION_CONFIG.aiResponse.animate,
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
    transition: {
      duration: ANIMATION_CONFIG.aiResponse.duration,
      ease: ANIMATION_CONFIG.aiResponse.easing,
      delay: ANIMATION_CONFIG.aiResponse.delay,
    },
  },

  // Thinking indicator pulse
  thinkingIndicator: {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.9,
    },
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },

  // Smooth height/layout transitions
  layoutTransition: {
    layout: true,
    transition: {
      duration: ANIMATION_CONFIG.layout.duration,
      ease: ANIMATION_CONFIG.layout.easing,
    },
  },
}

// Helper function to get animation variant based on message role
export function getMessageAnimationVariant(role: 'user' | 'assistant' | 'system') {
  switch (role) {
    case 'user':
      return messageVariants.userMessage
    case 'assistant':
      return messageVariants.aiMessage
    default:
      return messageVariants.aiMessage
  }
}

// Helper to disable animations (for performance or user preference)
export function getReducedMotionVariant() {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 },
  }
}

