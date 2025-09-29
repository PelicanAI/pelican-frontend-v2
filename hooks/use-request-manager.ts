"use client"

import { useState, useCallback, useRef } from "react"
import RequestManager from "@/lib/request-manager"

interface UseRequestManagerOptions {
  maxRetries?: number
  onError?: (error: Error) => void
  onSuccess?: (response: Response) => void
  onRateLimit?: (resetTime: Date) => void
}

interface RequestState {
  isLoading: boolean
  error: Error | null
  isRateLimited: boolean
  queuePosition?: number
  retryCount: number
}

export function useRequestManager(options: UseRequestManagerOptions = {}) {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    error: null,
    isRateLimited: false,
    retryCount: 0,
  })

  const requestManager = useRef(RequestManager.getInstance())
  const currentRequestId = useRef<string | null>(null)

  const makeRequest = useCallback(
    async (url: string, requestOptions: RequestInit = {}, context?: any): Promise<Response> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        isRateLimited: false,
      }))

      try {
        const response = await requestManager.current.request({
          url,
          options: requestOptions,
          maxRetries: options.maxRetries || 3,
          context,
        })

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }))

        options.onSuccess?.(response)
        return response
      } catch (error) {
        const err = error as Error

        if (err.message.includes("Rate limited")) {
          const resetTime = requestManager.current.getRateLimitResetTime()
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isRateLimited: true,
            error: err,
          }))

          if (resetTime) {
            options.onRateLimit?.(resetTime)
          }
        } else if (err.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err,
            retryCount: prev.retryCount + 1,
          }))

          options.onError?.(err)
        }

        throw error
      }
    },
    [options],
  )

  const debouncedRequest = useCallback(
    async (
      key: string,
      url: string,
      requestOptions: RequestInit = {},
      delay = 300,
      context?: any,
    ): Promise<Response> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))

      try {
        const response = await requestManager.current.debouncedRequest(
          key,
          {
            url,
            options: requestOptions,
            maxRetries: options.maxRetries || 3,
            context,
          },
          delay,
        )

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }))

        options.onSuccess?.(response)
        return response
      } catch (error) {
        const err = error as Error

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          retryCount: prev.retryCount + 1,
        }))

        if (!err.message.includes("Rate limited")) {
          options.onError?.(err)
        }

        throw error
      }
    },
    [options],
  )

  const cancelAllRequests = useCallback(() => {
    requestManager.current.cancelAllRequests()
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }))
  }, [])

  const getQueueStatus = useCallback(() => {
    return requestManager.current.getQueueStatus()
  }, [])

  return {
    ...state,
    makeRequest,
    debouncedRequest,
    cancelAllRequests,
    getQueueStatus,
  }
}
