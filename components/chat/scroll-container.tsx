"use client"

import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ScrollContainerProps {
  children: ReactNode
  className?: string
  showScrollIndicator?: boolean
  onScrollToBottom?: () => void
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  ({ children, className, showScrollIndicator = false, onScrollToBottom }, ref) => {
    return (
      <div className="relative flex-1 flex flex-col min-h-0">
        <div
          ref={ref}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            "scroll-smooth",
            // Ensure proper scrolling on all devices
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-border",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb:hover]:bg-border/80",
            className,
          )}
          style={{
            // Enable momentum scrolling on iOS
            WebkitOverflowScrolling: "touch",
            // Improve scrolling performance
            willChange: "scroll-position",
          }}
        >
          {children}
        </div>

        {/* Scroll to bottom indicator */}
        {showScrollIndicator && (
          <button
            onClick={onScrollToBottom}
            className={cn(
              "absolute bottom-4 right-4 z-10",
              "flex items-center justify-center",
              "w-10 h-10 rounded-full",
              "bg-background border border-border shadow-lg",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95",
            )}
            aria-label="Scroll to bottom"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
    )
  },
)

ScrollContainer.displayName = "ScrollContainer"
