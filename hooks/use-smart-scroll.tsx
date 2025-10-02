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
  const scrollToUserMessage = useCallback((messageId?: string) => {
    const container = containerRef.current
    if (!container) {
      console.log('[Scroll Debug] ❌ No container found')
      return
    }

    console.log('[Scroll Debug] ✅ Container found, attempting scroll')
    console.log('[Scroll Debug] Message ID to scroll to:', messageId)

    // Multiple attempts with increasing delays to handle React rendering
    const attemptScroll = (attemptNumber: number) => {
      console.log(`[Scroll Debug] Attempt ${attemptNumber}...`)
      
      let targetMessage: Element | null = null
      
      // Try to find by message ID if provided
      if (messageId) {
        targetMessage = container.querySelector(`[data-message-id="${messageId}"]`)
        console.log('[Scroll Debug] Looking for message ID:', messageId, targetMessage ? '✅ Found' : '❌ Not found')
      }
      
      // Fallback: find last user message
      if (!targetMessage) {
        const userMessages = container.querySelectorAll('[data-message-role="user"]')
        if (userMessages.length > 0) {
          targetMessage = userMessages[userMessages.length - 1] || null
          console.log('[Scroll Debug] Using last user message (fallback), total user messages:', userMessages.length)
        }
      }
      
      // Last resort: find any last message
      if (!targetMessage) {
        const allMessages = container.querySelectorAll('[role="article"]')
        if (allMessages.length > 0) {
          targetMessage = allMessages[allMessages.length - 1] || null
          console.log('[Scroll Debug] Using last message (last resort), total messages:', allMessages.length)
        }
      }

      if (targetMessage) {
        const messageElement = targetMessage as HTMLElement
        console.log('[Scroll Debug] 🎯 Found target message!')
        console.log('[Scroll Debug] Container scrollHeight:', container.scrollHeight)
        console.log('[Scroll Debug] Container clientHeight:', container.clientHeight)
        console.log('[Scroll Debug] Message offsetTop:', messageElement.offsetTop)
        
        // Calculate scroll position: message top - 100px padding
        const targetScrollTop = messageElement.offsetTop - 100
        console.log('[Scroll Debug] 📍 Scrolling to position:', targetScrollTop)
        
        // Perform the scroll
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
        
        // Verify scroll happened
        setTimeout(() => {
          console.log('[Scroll Debug] After scroll - container.scrollTop:', container.scrollTop)
        }, 500)
        
        return true // Success
      } else {
        console.log(`[Scroll Debug] ⚠️ Attempt ${attemptNumber} - No message found, will retry...`)
        return false // Failed
      }
    }

    // Try immediately
    if (!attemptScroll(1)) {
      // Try again after 100ms
      setTimeout(() => {
        if (!attemptScroll(2)) {
          // Final try after 300ms
          setTimeout(() => {
            attemptScroll(3)
          }, 200)
        }
      }, 100)
    }
  }, [])

  // Claude/ChatGPT style auto-scroll: handles all scenarios
  const handleNewMessage = useCallback(
    (isStreaming = false, isUserMessage = false, messageId?: string) => {
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
        console.log('[Scroll] ⚡ User message detected! Message ID:', messageId)
        console.log('[Scroll] Triggering scroll in 50ms...')
        // Always scroll to show the user message at top of viewport
        // This mimics Claude's behavior: you see your message + thinking indicator
        setTimeout(() => {
          console.log('[Scroll] ⏰ Executing scrollToUserMessage now')
          scrollToUserMessage(messageId)
        }, 50) // Very short delay - the scroll function has retry logic built in
        
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
