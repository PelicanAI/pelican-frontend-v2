"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, Paperclip, MapPin, Globe, Calendar, Mic, ArrowUp } from "lucide-react"

interface PerplexityChatInputProps {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const suggestionPills = [
  { icon: "⚖️", label: "Compare" },
  { icon: "🔧", label: "Troubleshoot" },
  { icon: "📚", label: "Perplexity 101" },
  { icon: "❤️", label: "Health" },
  { icon: "🎓", label: "Learn" },
]

export function PerplexityChatInput({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Ask anything...",
  disabled = false,
  className,
}: PerplexityChatInputProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [isFocused, setIsFocused] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleSubmit = () => {
    if (inputValue.trim() && !disabled) {
      onSubmit?.(inputValue) // Send raw value to preserve formatting
      setInputValue("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (label: string) => {
    setInputValue(label)
    onChange?.(label)
    textareaRef.current?.focus()
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-3", className)}>
      {/* Main Input Container */}
      <div
        className={cn(
          "relative bg-card rounded-2xl transition-all duration-200",
          "border border-border hover:border-border",
          "shadow-sm hover:shadow-md",
          isFocused && "border-blue-400 shadow-lg ring-2 ring-blue-100",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Left Icons */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Paperclip size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <MapPin size={18} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent border-none outline-none resize-none",
            "px-24 py-4 text-foreground placeholder:text-muted-foreground",
            "font-medium text-base leading-relaxed",
            "min-h-[56px] max-h-[120px] overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          )}
          rows={1}
        />

        {/* Right Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Globe size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Calendar size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Paperclip size={18} />
          </button>
          <button
            type="button"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            disabled={disabled}
          >
            <Mic size={18} />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || disabled}
            className={cn(
              "p-2 rounded-full transition-all duration-200",
              "bg-teal-600 hover:bg-teal-700 text-white",
              "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
              "shadow-sm hover:shadow-md",
            )}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      {/* Suggestion Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestionPills.map((pill, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(pill.label)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-card hover:bg-muted text-foreground",
              "border border-border hover:border-border",
              "transition-all duration-200 text-sm font-medium",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <span className="text-sm">{pill.icon}</span>
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  )
}
