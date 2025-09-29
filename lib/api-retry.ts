interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: Error) => {
    if (error.name === "AbortError") return false
    if (error.message.includes("401") || error.message.includes("403")) return false
    return true
  },
}

function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {},
): Promise<Response> {
  const { retryOptions, ...fetchOptions } = options
  const config = { ...DEFAULT_OPTIONS, ...retryOptions }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions)

      if (response.ok || response.status === 400 || response.status === 404) {
        return response
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After")
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : calculateDelay(attempt, config.baseDelay, config.maxDelay)

        if (attempt < config.maxRetries) {
          await sleep(delay)
          continue
        }
      }

      if (response.status >= 500 && response.status < 600) {
        lastError = new Error(`Server error: ${response.status}`)

        if (attempt < config.maxRetries) {
          const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay)
          await sleep(delay)
          continue
        }
      }

      return response
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
      ...options.retryOptions,
    },
  })
}