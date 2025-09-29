type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = this.sanitizeContext(context)
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      }
    }

    return entry
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {}

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("key") ||
        lowerKey.includes("api")
      ) {
        sanitized[key] = "[REDACTED]"
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private write(entry: LogEntry) {
    if (this.isDevelopment) {
      const consoleMethod = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log

      consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || "", entry.error || "")
    } else {
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.write(this.formatLog("debug", message, context))
    }
  }

  info(message: string, context?: LogContext) {
    this.write(this.formatLog("info", message, context))
  }

  warn(message: string, context?: LogContext) {
    this.write(this.formatLog("warn", message, context))
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.write(this.formatLog("error", message, context, error))
  }
}

export const logger = new Logger()