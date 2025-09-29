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
  const userScrolledAwayRef = useRef(false)
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
    return distanceFromBottom <= threshold
  }, [threshold])

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

    // If user scrolled up significantly while streaming, mark as scrolled away
    if (isScrollingUp && isStreamingRef.current && !isNearBottom) {
      userScrolledAwayRef.current = true
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

      // Auto-scroll conditions:
      // 1. User is near bottom
      // 2. User hasn't scrolled away during streaming
      // 3. It's the start of a new conversation (first few messages)
      const shouldAutoScroll =
        checkIfNearBottom() ||
        (!userScrolledAwayRef.current && isStreaming) ||
        (containerRef.current && containerRef.current.scrollHeight <= containerRef.current.clientHeight * 2)

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
    userScrolledAwayRef.current = false
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

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
      container.style.webkitOverflowScrolling = "touch"
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
    handleStreamingEnd,
    handleLongMessage,
    checkIfNearBottom,
    showJump,
    lastNewMessageAt,
  }
}
