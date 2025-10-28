"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PremiumTextareaProps extends React.ComponentProps<"textarea"> {
  isDarkMode?: boolean
  onHeightChange?: (height: number) => void
}

const PremiumTextarea = React.forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ className, isDarkMode = false, onHeightChange, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(56, Math.min(textarea.scrollHeight, 200))
        textarea.style.height = `${newHeight}px`
        onHeightChange?.(newHeight)
      }
    }, [onHeightChange])

    React.useEffect(() => {
      adjustHeight()
    }, [adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e)
      adjustHeight()
    }

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          // Core design
          "w-full resize-none outline-none transition-all duration-[180ms] ease-out",
          "font-[Inter,system-ui,sans-serif] text-[15px] leading-[1.6]",
          "min-h-[56px] max-h-[200px] overflow-y-auto",
          "px-5 py-[18px] rounded-[20px]",
          "border-[1.5px] border-solid",

          // Background colors
          "bg-card",

          // Border colors - default state
          !isFocused && !isHovered && "border-border",

          !isFocused &&
            isHovered && [
              "border-primary/30",
              "shadow-[0_0_0_2px_rgba(139,92,246,0.08),0_0_12px_rgba(139,92,246,0.15)]",
              "bg-primary/5",
              "transform scale-[1.005]",
            ],

          // Focus state
          isFocused && [
            "border-primary/40",
            "shadow-[0_0_0_3px_rgba(139,92,246,0.1)]",
            "bg-primary/5",
          ],

          // Disabled state
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:border-border",

          // Text and placeholder colors
          "text-foreground placeholder:text-muted-foreground",

          // Selection colors
          "selection:bg-purple-500 selection:text-white",

          // Inset shadow
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]",

          // Custom scrollbar
          "[&::-webkit-scrollbar]:w-[6px]",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-primary/50",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb:hover]:bg-primary/70",

          className,
        )}
        placeholder="Message Pelican..."
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={
          {
            fieldSizing: "content",
          } as React.CSSProperties
        }
        {...props}
      />
    )
  },
)

PremiumTextarea.displayName = "PremiumTextarea"

export { PremiumTextarea }
