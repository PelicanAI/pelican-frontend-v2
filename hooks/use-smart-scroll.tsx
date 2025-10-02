"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface SmartScrollOptions {
  nearBottomThreshold?: number
  mobileNearBottomThreshold?: number
  scrollBehavior?: ScrollBehavior
  enableMomentumScrolling?: boolean
  debounceMs?: number
}

export interface SmartScrollState {
  isNearBottom: boolean
  isUserScrolling: boolean
  hasNewMessages: boolean
  isStreaming: boolean
}

export function useSmartScroll(options: SmartScrollOptions = {}) {
  const {
    nearBottomThreshold = 100,
    mobileNearBottomThreshold = 150,
    scrollBehavior = "smooth",
    enableMomentumScrolling = true,
    debounceMs = 100,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const lastScrollTopRef = useRef(0)
  const userHasScrolledRef = useRef(false)
  const isStreamingRef = useRef(false)
  const wasAtBottomOnSendRef = useRef(true) // Track if user was at bottom when they sent message
  const hasScrolledForAIResponseRef = useRef(false) // Track if we've already scrolled for current AI response
  const [lastNewMessageAt, setLastNewMessageAt] = useState<number>(0)

  const [state, setState] = useState<SmartScrollState>({
    isNearBottom: true,
    isUserScrolling: false,
    hasNewMessages: false,
    isStreaming: false,
  })

  // Detect if user is on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768
  const threshold = isMobile ? mobileNearBottomThreshold : nearBottomThreshold

  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return false

    const { scrollTop, scrollHeight, clientHeight } = container
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < 150 // Exact threshold as requested
  }, [])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = scrollBehavior) => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior })
      }
    },
    [scrollBehavior],
  )

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const currentScrollTop = container.scrollTop
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current
    const isNearBottom = checkIfNearBottom()

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Update user scrolling state
    setState((prev) => ({ ...prev, isUserScrolling: true, isNearBottom }))

    // Track if user manually scrolled up
    if (isScrollingUp && !isNearBottom) {
      userHasScrolledRef.current = true
    }

    // Reset user scrolling state after debounce period
    scrollTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isUserScrolling: false }))
    }, debounceMs)

    lastScrollTopRef.current = currentScrollTop
  }, [checkIfNearBottom, debounceMs])

  // Smart auto-scroll like ChatGPT: Only scroll when user sends message if they're at bottom
  const handleNewMessage = useCallback(
    (isStreaming = false, isUserMessage = false) => {
      isStreamingRef.current = isStreaming

      setLastNewMessageAt(Date.now())

      setState((prev) => ({
        ...prev,
        hasNewMessages: true,
        isStreaming,
      }))

      // Check if user is near bottom (within 150px as specified)
      const isNearBottom = checkIfNearBottom()

      // When user sends a message, capture their scroll position and reset AI scroll flag
      if (isUserMessage) {
        wasAtBottomOnSendRef.current = isNearBottom
        hasScrolledForAIResponseRef.current = false // Reset for new conversation turn
        
        // Only scroll if user was already at bottom when they sent the message
        if (wasAtBottomOnSendRef.current) {
          scrollToBottom("smooth")
        }
        // If user was scrolled up reading old messages, DON'T scroll - keep them at reading position
      }
      
      // When AI starts responding, scroll ONCE to show the start of response
      // But don't continue scrolling as message streams in
      if (isStreaming && wasAtBottomOnSendRef.current && !hasScrolledForAIResponseRef.current) {
        // Scroll once to show the start of AI response
        scrollToBottom("smooth")
        hasScrolledForAIResponseRef.current = true // Mark that we've scrolled for this response
      }
      
      // When AI finishes (not streaming), don't auto-scroll
      // User can manually scroll down when ready

      // Reset new messages flag
      setTimeout(() => {
        setState((prev) => ({ ...prev, hasNewMessages: false }))
      }, 1000)
    },
    [checkIfNearBottom, scrollToBottom],
  )

  // Reset scroll-away state when streaming ends
  const handleStreamingEnd = useCallback(() => {
    isStreamingRef.current = false
    userHasScrolledRef.current = false
    hasScrolledForAIResponseRef.current = false // Reset for next response
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  // Manually reset scroll-away state (useful for user-initiated scroll to bottom)
  const resetScrollAwayState = useCallback(() => {
    userHasScrolledRef.current = false
  }, [])

  // Handle streaming updates - DISABLED: User controls scroll position at all times
  const handleStreamingUpdate = useCallback(() => {
    // REMOVED: Auto-scroll during streaming - user controls scroll position
    // const isNearBottom = checkIfNearBottom()
    // const shouldAutoScroll = isNearBottom || !userHasScrolledRef.current
    // if (shouldAutoScroll) {
    //   scrollToBottom("instant")
    // }
  }, [])

  // Handle long messages - DISABLED: User controls scroll position at all times
  const handleLongMessage = useCallback(
    (messageElement: HTMLElement) => {
      // REMOVED: Auto-scroll for long messages - user controls scroll position
      // if (checkIfNearBottom()) {
      //   messageElement.scrollIntoView({ behavior: scrollBehavior, block: "start" })
      // }
    },
    [],
  )

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add scroll listener with passive for better performance
    container.addEventListener("scroll", handleScroll, { passive: true })

    // Enable momentum scrolling on iOS if requested
    if (enableMomentumScrolling) {
      ;(container.style as any).webkitOverflowScrolling = "touch"
    }

    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll, enableMomentumScrolling])

  const showJump = state.isStreaming && !state.isNearBottom

  return {
    containerRef,
    bottomRef,
    state,
    scrollToBottom,
    handleNewMessage,
    handleStreamingUpdate,
    handleStreamingEnd,
    handleLongMessage,
    checkIfNearBottom,
    resetScrollAwayState,
    showJump,
    lastNewMessageAt,
  }
}
