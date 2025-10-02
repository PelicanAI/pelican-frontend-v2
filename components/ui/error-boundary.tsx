"use client"

import type React from "react"
import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { motion } from "framer-motion"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] ErrorBoundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          </motion.div>

          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem
            persists.
          </p>

          <Button onClick={this.handleRetry} className="gap-2" aria-label="Retry after error">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">Error Details (Development)</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">{this.state.error.stack}</pre>
            </details>
          )}
        </motion.div>
      )
    }

    return this.props.children
  }
}
