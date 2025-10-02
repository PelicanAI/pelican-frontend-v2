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

  // Auto-scroll logic for new messages
  const handleNewMessage = useCallback(
    (isStreaming = false) => {
      isStreamingRef.current = isStreaming

      setLastNewMessageAt(Date.now())

      setState((prev) => ({
        ...prev,
        hasNewMessages: true,
        isStreaming,
      }))

      // Reset userHasScrolled when a new message starts
      if (!isStreaming) {
        userHasScrolledRef.current = false
      }

      // Check if user is near bottom
      const isNearBottom = checkIfNearBottom()

      // Auto-scroll conditions:
      // 1. User is near bottom OR
      // 2. User has NOT manually scrolled up
      const shouldAutoScroll = isNearBottom || !userHasScrolledRef.current

      if (shouldAutoScroll) {
        // Use immediate scroll for streaming to feel responsive
        const behavior = isStreaming ? "instant" : scrollBehavior
        scrollToBottom(behavior)
      }

      // Reset new messages flag
      setTimeout(() => {
        setState((prev) => ({ ...prev, hasNewMessages: false }))
      }, 1000)
    },
    [checkIfNearBottom, scrollBehavior, scrollToBottom],
  )

  // Reset scroll-away state when streaming ends
  const handleStreamingEnd = useCallback(() => {
    isStreamingRef.current = false
    userHasScrolledRef.current = false
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  // Manually reset scroll-away state (useful for user-initiated scroll to bottom)
  const resetScrollAwayState = useCallback(() => {
    userHasScrolledRef.current = false
  }, [])

  // Handle streaming updates - called during message streaming
  const handleStreamingUpdate = useCallback(() => {
    // Check if user is near bottom
    const isNearBottom = checkIfNearBottom()

    // Only auto-scroll if user is near bottom OR hasn't manually scrolled up
    const shouldAutoScroll = isNearBottom || !userHasScrolledRef.current

    if (shouldAutoScroll) {
      scrollToBottom("instant")
    }
  }, [checkIfNearBottom, scrollToBottom])

  // Handle long messages - scroll to top of new message
  const handleLongMessage = useCallback(
    (messageElement: HTMLElement) => {
      if (checkIfNearBottom()) {
        messageElement.scrollIntoView({ behavior: scrollBehavior, block: "start" })
      }
    },
    [checkIfNearBottom, scrollBehavior],
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
