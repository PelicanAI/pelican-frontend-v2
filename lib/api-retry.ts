interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  timeout?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 900000, // 15 minute default timeout
  shouldRetry: (error: Error) => {
    if (error.name === "AbortError") return false
    if (error.message.includes("timeout")) return true // Retry on timeout
    if (error.message.includes("401") || error.message.includes("403")) return false
    return true
  },
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {},
): Promise<Response> {
  // Increase timeout for pelican_response endpoint (requests can take 60+ seconds)
  // Note: Direct backend calls to Fly.io have no timeout constraints
  const isPelicanResponse = url.includes('/api/pelican_response') || url.includes('/pelican_response')
  const isDirectBackendCall = url.includes('pelican-backend.fly.dev')
  
  // No timeout for direct backend calls - let them run as long as needed
  const extendedTimeout = isDirectBackendCall ? undefined : (isPelicanResponse ? 900000 : undefined)
  const { retryOptions, ...fetchOptions } = options
  const config = { 
    ...DEFAULT_OPTIONS, 
    ...retryOptions,
    timeout: extendedTimeout || retryOptions?.timeout || DEFAULT_OPTIONS.timeout
  }
  
  // Disable retries on timeout for long-running requests (don't spam backend)
  const shouldRetryOnTimeout = !isPelicanResponse && !isDirectBackendCall
  const originalShouldRetry = config.shouldRetry
  config.shouldRetry = (error: Error, attempt: number) => {
    // Don't retry on timeout for pelican_response - just wait
    if (error.message.includes("timeout") && !shouldRetryOnTimeout) {
      return false
    }
    return originalShouldRetry ? originalShouldRetry(error, attempt) : true
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Create timeout controller for this specific request
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), config.timeout)

      // Merge abort signals if one already exists
      const existingSignal = fetchOptions.signal
      let combinedSignal = timeoutController.signal

      if (existingSignal) {
        // Create a combined abort controller
        const combinedController = new AbortController()
        const abortBoth = () => combinedController.abort()
        
        existingSignal.addEventListener('abort', abortBoth)
        timeoutController.signal.addEventListener('abort', abortBoth)
        combinedSignal = combinedController.signal
      }

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: combinedSignal,
        })
        
        clearTimeout(timeoutId)
        
        // Handle different response statuses
        if (response.ok || response.status === 400 || response.status === 404) {
          return response
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After")
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : calculateDelay(attempt, config.baseDelay, config.maxDelay)

          if (attempt < config.maxRetries) {
            await sleep(delay)
            continue
          }
        }

        // Handle server errors
        if (response.status >= 500 && response.status < 600) {
          lastError = new Error(`Server error: ${response.status}`)

          if (attempt < config.maxRetries) {
            const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay)
            await sleep(delay)
            continue
          }
        }

        return response
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // Check if it was a timeout
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          if (timeoutController.signal.aborted) {
            throw new Error(`Request timeout after ${config.timeout}ms`)
          }
        }
        throw fetchError
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (!config.shouldRetry(lastError, attempt) || attempt === config.maxRetries) {
        throw lastError
      }

      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay)
      await sleep(delay)
    }
  }

  throw lastError || new Error("Request failed after retries")
}

export async function streamWithRetry(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {},
): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    retryOptions: {
      maxRetries: 2,
      baseDelay: 500,
      timeout: 900000, // 15 minutes for streaming requests
      ...options.retryOptions,
    },
  })
}
