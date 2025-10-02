"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, Square, Search, MapPin, Globe, Calendar, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentChip } from "./attachment-chip"
// import { InputSuggestions } from "./input-suggestions"
// import { useInputSuggestions } from "@/hooks/use-input-suggestions"
import { motion, AnimatePresence } from "framer-motion"
import { LIMITS, UI } from "@/lib/constants"

// Auto-suggestion feature - DISABLED FOR NOW, will re-enable later
// const COMMON_SUGGESTIONS = [
//   "Write a professional email about",
//   "Create a marketing strategy for",
//   "Explain the concept of",
//   "Generate a bullish trading strategy for",
//   "Analyze the market trends in",
//   "Help me understand",
//   "Create a business plan for",
//   "Write code to",
//   "Summarize the key points of",
//   "Compare and contrast",
// ]

// const SUGGESTION_PILLS = [
//   { icon: "📊", text: "Compare", color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" },
//   { icon: "🔧", text: "Troubleshoot", color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200" },
//   { icon: "📚", text: "Learn", color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200" },
//   { icon: "💡", text: "Strategy", color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200" },
//   { icon: "❤️", text: "Health", color: "bg-red-50 hover:bg-red-100 text-red-700 border-red-200" },
// ]

interface Attachment {
  name: string
  type: string
  url: string
}

interface PendingAttachment {
  file: File
  isError?: boolean
  id: string
}

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload?: (files: File[]) => void
  disabled?: boolean
  canSend?: boolean
  disabledSend?: boolean
  onQueueMessage?: (message: string) => void
  queueEnabled?: boolean
  placeholder?: string
  isDarkMode?: boolean
  onTypingDuringResponse?: () => void
  isAIResponding?: boolean
  onThemeChange?: (isDark: boolean) => void
  attachments?: Attachment[]
  onRemoveAttachment?: (index: number) => void
  pendingAttachments?: PendingAttachment[]
  onRetryAttachment?: (id: string) => void
  pendingDraft?: string | null
  onStopResponse?: () => void
}

export interface ChatInputRef {
  focus: () => void
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(
  (
    {
      onSendMessage,
      onFileUpload,
      disabled = false,
      canSend = true,
      disabledSend = false,
      onQueueMessage,
      queueEnabled = false,
      placeholder = "Ask anything...",
      isDarkMode = false,
      onTypingDuringResponse,
      isAIResponding = false,
      onThemeChange,
      attachments = [],
      onRemoveAttachment,
      pendingAttachments = [],
      onRetryAttachment,
      pendingDraft,
      onStopResponse,
    },
    ref,
  ) => {
    const [showThinkingNote, setShowThinkingNote] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Simple message state (auto-suggestions disabled for now)
    const [message, setMessage] = useState("")

    // Input suggestions hook - DISABLED FOR NOW, will re-enable later
    // const {
    //   input: message,
    //   updateInput,
    //   suggestions,
    //   visible: suggestionsVisible,
    //   selectedIndex,
    //   handleKeyDown: handleSuggestionsKeyDown,
    //   acceptSuggestion,
    //   saveRecentSearch,
    //   clearSuggestions,
    //   handleSuggestionHover,
    // } = useInputSuggestions({
    //   onAccept: (text) => {
    //     setMessage(text)
    //     textareaRef.current?.focus()
    //   },
    // })

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
    }))

    const adjustTextareaHeight = () => {
      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.max(UI.TEXTAREA_MIN_HEIGHT, Math.min(textarea.scrollHeight, UI.TEXTAREA_MAX_HEIGHT))
        textarea.style.height = `${newHeight}px`
      }
    }

    useEffect(() => {
      adjustTextareaHeight()
    }, [message])


    const handleSubmit = () => {
      if (message.trim() && !disabled && !isAIResponding && canSend && !disabledSend) {
        const trimmedMessage = message.trim()

        // Save to recent searches - DISABLED
        // saveRecentSearch(trimmedMessage)

        onSendMessage(trimmedMessage)
        setMessage("")
        setShowThinkingNote(false)
        // clearSuggestions() - DISABLED
      }
    }

    const handleQueueMessage = () => {
      if (message.trim() && onQueueMessage) {
        onQueueMessage(message.trim())
        setMessage("")
        setShowThinkingNote(false)
        // clearSuggestions() - DISABLED
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Suggestions handling - DISABLED FOR NOW
      // const handled = handleSuggestionsKeyDown(e)
      // if (handled) {
      //   return
      // }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (isAIResponding || disabledSend) {
          setShowThinkingNote(true)
          setTimeout(() => setShowThinkingNote(false), UI.THINKING_NOTE_DURATION_MS)
          return
        }
        handleSubmit()
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && queueEnabled && disabledSend) {
        e.preventDefault()
        handleQueueMessage()
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      if (isAIResponding && newValue.length > message.length && onTypingDuringResponse) {
        onTypingDuringResponse()
      }
      setMessage(newValue)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0 && onFileUpload) {
        onFileUpload(Array.from(files))
      }
      e.target.value = ""
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragOver(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files && files.length > 0 && onFileUpload) {
        onFileUpload(Array.from(files))
      }
    }

    const handleSuggestionClick = (suggestionText: string) => {
      setMessage(suggestionText + " ")
      textareaRef.current?.focus()
    }

    const isSendDisabled = disabled || !message.trim() || !canSend || disabledSend || isAIResponding
    const characterCount = message.length
    const showCharCount = characterCount >= LIMITS.CHAT_MAX_TOKENS * UI.CHAR_COUNT_THRESHOLD

    return (
      <div className="w-full">
        {/* Removed duplicate "Pelican is thinking..." indicator - shown in chat area instead */}

        <div
          ref={containerRef}
          className="relative w-full"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center backdrop-blur-sm"
              >
                <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">Drop file to attach</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "relative flex items-center gap-2 px-4 py-2",
              "bg-white dark:bg-gray-900",
              "rounded-full",
              "border border-gray-200 dark:border-gray-700",
              "transition-all duration-200",
              "shadow-md hover:shadow-lg",
              "min-h-[56px]",
              isFocused && [
                "border-purple-500/60",
                "shadow-[0_0_0_4px_rgba(168,85,247,0.12)]",
              ],
            )}
          >
            {/* Paperclip button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                "transition-all duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </motion.button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false)
                // setTimeout(() => clearSuggestions(), 200) - DISABLED
              }}
              placeholder="Message Pelican..."
              disabled={disabled}
              className={cn(
                "flex-1 bg-transparent outline-none resize-none",
                "text-[15px] leading-relaxed font-[Inter,system-ui,sans-serif]",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "text-gray-900 dark:text-gray-100",
                "py-2 px-2",
                "h-[40px] max-h-[168px] overflow-y-auto",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
              )}
              rows={1}
            />

            {/* Character count indicator (3500+) */}
            {characterCount >= 3500 && (
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"
                title={`${characterCount} characters`}
              />
            )}

            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isAIResponding && onStopResponse ? onStopResponse : handleSubmit}
              disabled={!isAIResponding && isSendDisabled}
              className={cn(
                "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                "transition-all duration-200",
                isAIResponding
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : isSendDisabled
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md shadow-purple-500/20",
              )}
            >
              <motion.div
                key={isAIResponding ? "stop" : "send"}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {isAIResponding ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              </motion.div>
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
          </div>

          {/* Attachments preview below input */}
          <AnimatePresence mode="wait">
            {(attachments.length > 0 || pendingAttachments.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <AttachmentChip
                      key={index}
                      name={attachment.name}
                      type={attachment.type}
                      onRemove={onRemoveAttachment ? () => onRemoveAttachment(index) : undefined}
                    />
                  ))}
                  {pendingAttachments.map((pendingAttachment) => (
                    <AttachmentChip
                      key={pendingAttachment.id}
                      name={pendingAttachment.file.name}
                      type={pendingAttachment.file.type}
                      isError={pendingAttachment.isError}
                      onRetry={onRetryAttachment ? () => onRetryAttachment(pendingAttachment.id) : undefined}
                      onRemove={
                        onRemoveAttachment
                          ? () => onRemoveAttachment(pendingAttachments.indexOf(pendingAttachment))
                          : undefined
                      }
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draft indicator */}
          {pendingDraft && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-sm text-amber-700 dark:text-amber-300">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Queued: "{pendingDraft.slice(0, 30)}
                {pendingDraft.length > 30 ? "..." : ""}"
              </div>
            </motion.div>
          )}

          {/* Input Suggestions - DISABLED FOR NOW, will re-enable later */}
          {/* <InputSuggestions
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelect={acceptSuggestion}
            onHover={handleSuggestionHover}
            visible={suggestionsVisible && isFocused}
          /> */}

        </div>
      </div>
    )
  },
)

ChatInput.displayName = "ChatInput"
