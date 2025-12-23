"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputSimpleProps {
  onSendMessage: (message: string) => void
  onFileUpload?: (file: File) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInputSimple({
  onSendMessage,
  onFileUpload,
  disabled = false,
  placeholder = "Ask Pelican about your trades, market analysis, or trading psychology...",
}: ChatInputSimpleProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message) // Send raw message to preserve newlines
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileUpload) {
      onFileUpload(file)
    }
    e.target.value = ""
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-background border rounded-xl p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="shrink-0 w-8 h-8"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[20px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 p-0",
              "placeholder:text-muted-foreground",
            )}
            rows={1}
          />

          <Button
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            size="icon"
            className="shrink-0 w-8 h-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
