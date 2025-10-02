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
  const isStreamingRef = useRef(false)
  const shouldAutoScrollRef = useRef(true) // Track if auto-scroll is enabled (disabled when user scrolls up)
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

    // SCENARIO 4: User manually scrolls
    // If user scrolls UP during streaming: disable auto-scroll immediately
    if (isScrollingUp && isStreamingRef.current && !isNearBottom) {
      shouldAutoScrollRef.current = false
    }
    
    // If user scrolls back to bottom: re-enable auto-scroll
    if (isNearBottom) {
      shouldAutoScrollRef.current = true
    }

    // Reset user scrolling state after debounce period
    scrollTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, isUserScrolling: false }))
    }, debounceMs)

    lastScrollTopRef.current = currentScrollTop
  }, [checkIfNearBottom, debounceMs])

  // Scroll to show user message at top when they send a message
  const scrollToUserMessage = useCallback(() => {
    const container = containerRef.current
    if (!container) {
      console.log('[Scroll] No container found')
      return
    }

    console.log('[Scroll] Attempting to scroll to new user message')

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const allMessages = Array.from(container.querySelectorAll('[role="article"]'))
      console.log('[Scroll] Messages in DOM:', allMessages.length)
      
      if (allMessages.length === 0) {
        console.log('[Scroll] No messages found yet')
        return
      }

      // Get the last message (the newly sent user message)
      const lastMessage = allMessages[allMessages.length - 1]
      
      console.log('[Scroll] Last message element:', {
        offsetTop: (lastMessage as HTMLElement).offsetTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight
      })

      // Calculate position to show user message near top with some padding
      const targetScrollTop = (lastMessage as HTMLElement).offsetTop - 100 // 100px from top
      
      console.log('[Scroll] Scrolling to position:', targetScrollTop)
      
      // Smooth scroll to the calculated position
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    })
  }, [])

  // Claude/ChatGPT style auto-scroll: handles all scenarios
  const handleNewMessage = useCallback(
    (isStreaming = false, isUserMessage = false) => {
      isStreamingRef.current = isStreaming

      setLastNewMessageAt(Date.now())

      setState((prev) => ({
        ...prev,
        hasNewMessages: true,
        isStreaming,
      }))

      // Check if user is near bottom (within 150px)
      const isNearBottom = checkIfNearBottom()

      // SCENARIO 1: When user sends a message
      if (isUserMessage) {
        console.log('[Scroll] User message detected, triggering scroll')
        // Always scroll to show the user message at top of viewport
        // This mimics Claude's behavior: you see your message + thinking indicator
        setTimeout(() => {
          console.log('[Scroll] Executing scrollToUserMessage after delay')
          scrollToUserMessage()
        }, 200) // Delay to ensure message is fully rendered in DOM
        
        // Reset auto-scroll state
        shouldAutoScrollRef.current = true
      }
      // SCENARIO 5: When new conversation starts (non-streaming, non-user message)
      else if (!isStreaming && !isUserMessage) {
        shouldAutoScrollRef.current = isNearBottom
        if (isNearBottom) {
          scrollToBottom("smooth")
        }
      }
      
      // SCENARIO 2 & 3: AI responding - continuously check and scroll if appropriate
      if (isStreaming) {
        // Before EVERY scroll attempt: check if we should auto-scroll
        // This is checked on every streaming update
        if (shouldAutoScrollRef.current && isNearBottom) {
          // User is at bottom and hasn't scrolled up: keep showing new text
          scrollToBottom("auto") // Use 'auto' for instant, smooth streaming
        }
        // If user scrolled up during streaming: shouldAutoScrollRef.current is false (set by handleScroll)
        // So we won't scroll anymore until they scroll back to bottom
      }

      // Reset new messages flag
      setTimeout(() => {
        setState((prev) => ({ ...prev, hasNewMessages: false }))
      }, 1000)
    },
    [checkIfNearBottom, scrollToBottom, scrollToUserMessage],
  )

  // Reset scroll state when streaming ends
  const handleStreamingEnd = useCallback(() => {
    isStreamingRef.current = false
    // Keep shouldAutoScrollRef as is - will be reset on next user message
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  // Manually reset scroll state (useful for user-initiated scroll to bottom)
  const resetScrollAwayState = useCallback(() => {
    shouldAutoScrollRef.current = true
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
