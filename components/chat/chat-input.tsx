"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Paperclip, Square, Search, MapPin, Globe, Calendar, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentChip } from "./attachment-chip"
import { motion, AnimatePresence } from "framer-motion"
import { LIMITS, UI } from "@/lib/constants"

const COMMON_SUGGESTIONS = [
  "Write a professional email about",
  "Create a marketing strategy for",
  "Explain the concept of",
  "Generate a bullish trading strategy for",
  "Analyze the market trends in",
  "Help me understand",
  "Create a business plan for",
  "Write code to",
  "Summarize the key points of",
  "Compare and contrast",
]

const SUGGESTION_PILLS = [
  { icon: "📊", text: "Compare", color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" },
  { icon: "🔧", text: "Troubleshoot", color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200" },
  { icon: "📚", text: "Learn", color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200" },
  { icon: "💡", text: "Strategy", color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200" },
  { icon: "❤️", text: "Health", color: "bg-red-50 hover:bg-red-100 text-red-700 border-red-200" },
]

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
    const [message, setMessage] = useState("")
    const [showThinkingNote, setShowThinkingNote] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [suggestion, setSuggestion] = useState("")
    const [showSuggestion, setShowSuggestion] = useState(false)
    const [userPatterns, setUserPatterns] = useState<string[]>([])

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
    }))

    useEffect(() => {
      if (message.length > 2 && !isAIResponding) {
        const allSuggestions = [...COMMON_SUGGESTIONS, ...userPatterns]
        const matchingSuggestion = allSuggestions.find(
          (s) => s.toLowerCase().startsWith(message.toLowerCase()) && s.length > message.length,
        )

        if (matchingSuggestion) {
          setSuggestion(matchingSuggestion.slice(message.length))
          setShowSuggestion(true)
        } else {
          setShowSuggestion(false)
        }
      } else {
        setShowSuggestion(false)
      }
    }, [message, isAIResponding, userPatterns])

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
        if (message.length > UI.MESSAGE_MIN_LENGTH_FOR_PATTERN) {
          const words = message.split(" ")
          if (words.length >= 3) {
            const pattern = words.slice(0, 3).join(" ")
            if (!userPatterns.includes(pattern)) {
              setUserPatterns((prev) => [...prev.slice(-(UI.USER_PATTERN_LIMIT - 1)), pattern])
            }
          }
        }

        onSendMessage(message.trim())
        setMessage("")
        setShowThinkingNote(false)
        setShowSuggestion(false)
      }
    }

    const handleQueueMessage = () => {
      if (message.trim() && onQueueMessage) {
        onQueueMessage(message.trim())
        setMessage("")
        setShowThinkingNote(false)
        setShowSuggestion(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab" && showSuggestion) {
        e.preventDefault()
        setMessage(message + suggestion)
        setShowSuggestion(false)
        return
      }

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
        <AnimatePresence>
          {isAIResponding && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 flex justify-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full text-sm text-blue-700 dark:text-blue-300">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
                Pelican is thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

          <motion.div
            animate={{
              scale: isHovered ? 1.01 : 1,
              y: isFocused ? -2 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
          <Card
            onClick={(e) => {
              // Focus textarea when clicking anywhere on the card
              // except if clicking on a button or other interactive element
              const target = e.target as HTMLElement;
              if (!target.closest('button') && !target.closest('input')) {
                textareaRef.current?.focus();
              }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "relative transition-all duration-300 ease-out cursor-text",
              "bg-white dark:bg-gray-900 border-2 rounded-xl",
              "transform-gpu",
              isHovered && !isFocused && [
                "border-purple-300 dark:border-purple-700",
                "shadow-lg shadow-purple-100 dark:shadow-purple-900/20",
                "bg-gradient-to-r from-white via-purple-50/10 to-white",
                "dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900",
              ],
              isFocused && [
                "border-purple-500 dark:border-purple-500",
                "shadow-xl shadow-purple-200 dark:shadow-purple-800/30",
                "bg-gradient-to-r from-white via-purple-50/20 to-white",
                "dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900",
              ],
              !isHovered && !isFocused && [
                "border-gray-200 dark:border-gray-700",
                "shadow-sm hover:shadow-md",
              ],
            )}
          >
            {pendingDraft && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2 px-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-sm text-amber-700 dark:text-amber-300">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  Queued: "{pendingDraft.slice(0, 30)}
                  {pendingDraft.length > 30 ? "..." : ""}"
                </div>
              </motion.div>
            )}

            {(attachments.length > 0 || pendingAttachments.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-2 px-3"
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

            <div className="relative">
              <div className="flex items-end">
                <div className="absolute left-2 bottom-1 z-10 flex items-center gap-0">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <Search className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <Paperclip className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <MapPin className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>
                </div>

                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                      "w-full resize-none border-0 bg-transparent outline-none",
                      "transition-all duration-180 ease-out",
                      "text-[15px] leading-[1.5] font-[Inter,system-ui,sans-serif]",
                      "min-h-[32px] max-h-[200px] overflow-y-auto",
                      "py-2 pl-32 pr-40",
                      "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                      "text-gray-900 dark:text-gray-100",
                      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
                    )}
                    rows={1}
                    style={{
                      height: "32px",
                      fieldSizing: "content" as any,
                    }}
                  />

                  {showSuggestion && (
                    <div
                      className="absolute inset-0 pointer-events-none py-[5px] pl-32 pr-40 text-[15px] leading-[1.5] font-[Inter,system-ui,sans-serif]"
                      style={{ height: textareaRef.current?.style.height }}
                    >
                      <span className="invisible">{message}</span>
                      <span className="text-gray-400 dark:text-gray-500">{suggestion}</span>
                    </div>
                  )}
                </div>

                <div className="absolute right-2 bottom-1 flex items-center gap-0">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <Globe className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <Calendar className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ scale: isHovered ? [1, 1.05, 1] : 1 }}
                    transition={{ repeat: isHovered ? Infinity : 0, duration: 2 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-200"
                    >
                      <Mic className="h-4 w-4 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    </Button>
                  </motion.div>

                  <Button
                    onClick={isAIResponding && onStopResponse ? onStopResponse : handleSubmit}
                    disabled={!isAIResponding && isSendDisabled}
                    size="icon"
                    className={cn(
                      "w-8 h-8 ml-2 transition-all duration-200",
                      "active:scale-95",
                      isAIResponding
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : isSendDisabled
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-teal-500/25 hover:scale-105",
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
                  </Button>
                </div>
              </div>

              <div className="hidden">
                <AnimatePresence>
                  {isFocused && !isAIResponding && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      <span className="hidden md:inline">Press ⌘Enter to send</span>
                      <span className="md:hidden">Tap to send</span>
                      {showSuggestion && <span className="ml-2 text-blue-500">• Tab to accept suggestion</span>}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showCharCount && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "text-xs font-medium",
                        characterCount >= LIMITS.CHAT_MAX_TOKENS * UI.CHAR_COUNT_DANGER_THRESHOLD
                          ? "text-red-500"
                          : characterCount >= LIMITS.CHAT_MAX_TOKENS * UI.CHAR_COUNT_WARNING_THRESHOLD
                            ? "text-yellow-500"
                            : "text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {characterCount.toLocaleString()}/{LIMITS.CHAT_MAX_TOKENS.toLocaleString()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.csv,.xlsx,.xls"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
          </Card>
          </motion.div>

          <AnimatePresence>
            {!isAIResponding && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap gap-2 mt-1 justify-center"
              >
                {SUGGESTION_PILLS.map((pill, index) => (
                  <motion.button
                    key={pill.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(pill.text)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                      "border transition-all duration-200 hover:scale-105 active:scale-95",
                      pill.color,
                    )}
                  >
                    <span>{pill.icon}</span>
                    {pill.text}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  },
)

ChatInput.displayName = "ChatInput"
