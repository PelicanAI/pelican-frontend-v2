export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly userMessage: string

  constructor(message: string, statusCode: number = 500, userMessage?: string, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.userMessage = userMessage || this.getDefaultUserMessage(statusCode)
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }

  private getDefaultUserMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "Invalid request. Please check your input and try again."
      case 401:
        return "Please sign in to continue."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 413:
        return "The file you're trying to upload is too large."
      case 429:
        return "Too many requests. Please slow down and try again."
      case 500:
        return "Something went wrong on our end. Please try again."
      case 503:
        return "The service is temporarily unavailable. Please try again in a moment."
      default:
        return "An unexpected error occurred. Please try again."
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage || "Invalid input provided.")
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", userMessage?: string) {
    super(message, 401, userMessage || "Please sign in to continue.")
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions", userMessage?: string) {
    super(message, 403, userMessage || "You don't have permission to perform this action.")
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", userMessage?: string) {
    super(`${resource} not found`, 404, userMessage || `The ${resource.toLowerCase()} you're looking for doesn't exist.`)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number, userMessage?: string) {
    const defaultMessage = retryAfter
      ? `You've reached your rate limit. Please try again in ${retryAfter} seconds.`
      : "You've reached your rate limit. Please try again later."

    super("Rate limit exceeded", 429, userMessage || defaultMessage)
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage || "File upload failed. Please check your file and try again.")
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, message: string, userMessage?: string) {
    super(`${service} API error: ${message}`, 502, userMessage || "We're having trouble connecting to our AI service. Please try again.")
  }
}

export function getUserFriendlyError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return {
      message: error.userMessage,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("fetch")) {
      return {
        message: "Network error. Please check your connection and try again.",
        statusCode: 503,
      }
    }

    if (error.message.includes("timeout")) {
      return {
        message: "Request timed out. Please try again.",
        statusCode: 504,
      }
    }

    if (error.message.includes("abort")) {
      return {
        message: "Request was cancelled.",
        statusCode: 499,
      }
    }
  }

  return {
    message: "An unexpected error occurred. Please try again.",
    statusCode: 500,
  }
}