"use client"

interface RequestConfig {
  url: string
  options: RequestInit
  retryCount?: number
  maxRetries?: number
  context?: any
}

interface RequestState {
  id: string
  status: "pending" | "success" | "error" | "rate-limited" | "cancelled"
  error?: Error
  retryCount: number
  nextRetryAt?: Date
}

interface RateLimitInfo {
  resetTime: Date
  remaining: number
  limit: number
}

class RequestManager {
  private static instance: RequestManager
  private activeRequests = new Map<string, AbortController>()
  private requestStates = new Map<string, RequestState>()
  private rateLimitInfo: RateLimitInfo | null = null
  private requestQueue: RequestConfig[] = []
  private isProcessingQueue = false
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  private constructor() {}

  static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager()
    }
    return RequestManager.instance
  }

  // Cancel all active requests (e.g., when user sends new message)
  cancelAllRequests(): void {
    console.log("[v0] RequestManager: Cancelling all active requests")
    this.activeRequests.forEach((controller, id) => {
      controller.abort()
      this.updateRequestState(id, { status: "cancelled" })
    })
    this.activeRequests.clear()
  }

  // Cancel specific request
  cancelRequest(requestId: string): void {
    const controller = this.activeRequests.get(requestId)
    if (controller) {
      console.log(`[v0] RequestManager: Cancelling request ${requestId}`)
      controller.abort()
      this.activeRequests.delete(requestId)
      this.updateRequestState(requestId, { status: "cancelled" })
    }
  }

  // Check if we're rate limited
  private isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false
    return new Date() < this.rateLimitInfo.resetTime && this.rateLimitInfo.remaining <= 0
  }

  // Get time until rate limit resets
  getRateLimitResetTime(): Date | null {
    return this.rateLimitInfo?.resetTime || null
  }

  // Update request state
  private updateRequestState(id: string, updates: Partial<RequestState>): void {
    const current = this.requestStates.get(id)
    if (current) {
      this.requestStates.set(id, { ...current, ...updates })
    }
  }

  // Get request state
  getRequestState(id: string): RequestState | null {
    return this.requestStates.get(id) || null
  }

  // Process queued requests
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0 && !this.isRateLimited()) {
      const config = this.requestQueue.shift()!
      await this.executeRequest(config)
    }

    this.isProcessingQueue = false

    // If still rate limited and have queued requests, schedule next processing
    if (this.requestQueue.length > 0 && this.isRateLimited()) {
      const resetTime = this.getRateLimitResetTime()
      if (resetTime) {
        const delay = resetTime.getTime() - Date.now()
        setTimeout(() => this.processQueue(), Math.max(delay, 1000))
      }
    }
  }

  // Execute a request with retry logic
  private async executeRequest(config: RequestConfig): Promise<Response> {
    const requestId = this.generateRequestId(config)
    const maxRetries = config.maxRetries || 3
    const retryCount = config.retryCount || 0

    // Initialize request state
    this.requestStates.set(requestId, {
      id: requestId,
      status: "pending",
      retryCount,
    })

    // Create abort controller
    const controller = new AbortController()
    this.activeRequests.set(requestId, controller)

    // Add abort signal to request options
    const requestOptions = {
      ...config.options,
      signal: controller.signal,
    }

    try {
      console.log(`[v0] RequestManager: Executing request ${requestId} (attempt ${retryCount + 1})`)

      const response = await fetch(config.url, requestOptions)

      // Check for rate limiting
      if (response.status === 429) {
        const resetHeader = response.headers.get("x-ratelimit-reset")
        const remainingHeader = response.headers.get("x-ratelimit-remaining")
        const limitHeader = response.headers.get("x-ratelimit-limit")

        if (resetHeader) {
          this.rateLimitInfo = {
            resetTime: new Date(Number.parseInt(resetHeader) * 1000),
            remaining: Number.parseInt(remainingHeader || "0"),
            limit: Number.parseInt(limitHeader || "100"),
          }
        }

        this.updateRequestState(requestId, { status: "rate-limited" })

        // Add to queue for retry
        this.requestQueue.push({ ...config, retryCount })
        this.processQueue()

        throw new Error("Rate limited - request queued for retry")
      }

      // Success
      this.activeRequests.delete(requestId)
      this.updateRequestState(requestId, { status: "success" })

      return response
    } catch (error) {
      this.activeRequests.delete(requestId)

      if (error instanceof Error && error.name === "AbortError") {
        this.updateRequestState(requestId, { status: "cancelled" })
        throw error
      }

      // Retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s, 8s...
        const nextRetryAt = new Date(Date.now() + delay)

        this.updateRequestState(requestId, {
          status: "error",
          error: error as Error,
          nextRetryAt,
        })

        console.log(`[v0] RequestManager: Retrying request ${requestId} in ${delay}ms`)

        // Schedule retry
        setTimeout(() => {
          const retryConfig = { ...config, retryCount: retryCount + 1 }
          this.executeRequest(retryConfig)
        }, delay)

        throw error
      } else {
        // Max retries exceeded
        this.updateRequestState(requestId, {
          status: "error",
          error: error as Error,
        })
        throw error
      }
    }
  }

  // Main request method
  async request(config: RequestConfig): Promise<Response> {
    // Check for rate limiting
    if (this.isRateLimited()) {
      console.log("[v0] RequestManager: Rate limited, adding to queue")
      this.requestQueue.push(config)
      this.processQueue()
      throw new Error("Rate limited - request queued")
    }

    return this.executeRequest(config)
  }

  // Debounced request
  debouncedRequest(key: string, config: RequestConfig, delay = 300): Promise<Response> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key)
        try {
          const response = await this.request(config)
          resolve(response)
        } catch (error) {
          reject(error)
        }
      }, delay)

      this.debounceTimers.set(key, timer)
    })
  }

  // Generate unique request ID
  private generateRequestId(config: RequestConfig): string {
    const data = config.url + JSON.stringify(config.options)
    // Simple hash function that works with Unicode
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    const hashString = Math.abs(hash).toString(36).slice(0, 8)
    return `req_${hashString}_${Date.now()}`
  }

  // Get queue status
  getQueueStatus(): { queued: number; rateLimitResetTime: Date | null } {
    return {
      queued: this.requestQueue.length,
      rateLimitResetTime: this.getRateLimitResetTime(),
    }
  }
}

export default RequestManager
