"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, forwardRef, useImperativeHandle, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, Square, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { AttachmentChip } from "./attachment-chip"
import { motion, AnimatePresence } from "framer-motion"
import { UI } from "@/lib/constants"

interface SmartSuggestion {
  text: string
  category: string
  frequency: number
}

const COMMON_PROMPTS = [
  { text: "Can you help me with", category: "assistance", frequency: 100 },
  { text: "Please explain", category: "explanation", frequency: 95 },
  { text: "How do I", category: "how-to", frequency: 90 },
  { text: "What is the best way to", category: "advice", frequency: 85 },
  { text: "Can you create", category: "creation", frequency: 80 },
  { text: "I need help with", category: "assistance", frequency: 75 },
  { text: "Please write", category: "writing", frequency: 70 },
  { text: "Show me how to", category: "tutorial", frequency: 65 },
  { text: "What are the steps to", category: "process", frequency: 60 },
  { text: "Can you analyze", category: "analysis", frequency: 55 },
  { text: "Please review", category: "review", frequency: 50 },
  { text: "Help me understand", category: "understanding", frequency: 45 },
  { text: "What would be the impact of", category: "analysis", frequency: 40 },
  { text: "Can you summarize", category: "summary", frequency: 35 },
  { text: "Please provide examples of", category: "examples", frequency: 30 },
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

interface PremiumChatInputProps {
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

export interface PremiumChatInputRef {
  focus: () => void
}

export const PremiumChatInput = forwardRef<PremiumChatInputRef, PremiumChatInputProps>(
  (
    {
      onSendMessage,
      onFileUpload,
      disabled = false,
      canSend = true,
      disabledSend = false,
      onQueueMessage,
      queueEnabled = false,
      placeholder = "Message Pelican...",
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
    const [isRecording, setIsRecording] = useState(false)
    const [showKeyboardHint, setShowKeyboardHint] = useState(false)
    const [inputState, setInputState] = useState<"default" | "error" | "rate-limited">("default")
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

    const [currentSuggestion, setCurrentSuggestion] = useState<SmartSuggestion | null>(null)
    const [userPatterns, setUserPatterns] = useState<SmartSuggestion[]>([])
    const [showSuggestion, setShowSuggestion] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus()
      },
    }))

    const findSuggestion = (input: string): SmartSuggestion | null => {
      if (input.length < 2) return null

      const allSuggestions = [...COMMON_PROMPTS, ...userPatterns].sort((a, b) => b.frequency - a.frequency)

      return (
        allSuggestions.find(
          (suggestion) =>
            suggestion.text.toLowerCase().startsWith(input.toLowerCase()) &&
            suggestion.text.toLowerCase() !== input.toLowerCase(),
        ) || null
      )
    }

    const learnFromInput = (input: string) => {
      if (input.length < UI.MESSAGE_MIN_LENGTH_FOR_PATTERN) return

      const words = input.split(" ")
      if (words.length < 3) return

      const firstThreeWords = words.slice(0, 3).join(" ")
      const existingPattern = userPatterns.find((p) => p.text === firstThreeWords)

      if (existingPattern) {
        existingPattern.frequency += 1
      } else {
        setUserPatterns((prev) =>
          [
            ...prev,
            {
              text: firstThreeWords,
              category: "learned",
              frequency: 1,
            },
          ].slice(0, UI.USER_PATTERN_LIMIT),
        )
      }
    }

    useEffect(() => {
      const suggestion = findSuggestion(message)
      setCurrentSuggestion(suggestion)
      setShowSuggestion(!!suggestion && message.length > 0)
    }, [message, userPatterns])

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
      if (message.trim() && !disabled && canSend && !disabledSend) {
        learnFromInput(message.trim())
        onSendMessage(message.trim())
        setMessage("")
        setShowThinkingNote(false)
        setCurrentSuggestion(null)
        setShowSuggestion(false)
      }
    }

    const handleQueueMessage = () => {
      if (message.trim() && onQueueMessage) {
        learnFromInput(message.trim())
        onQueueMessage(message.trim())
        setMessage("")
        setShowThinkingNote(false)
        setCurrentSuggestion(null)
        setShowSuggestion(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab" && currentSuggestion && showSuggestion) {
        e.preventDefault()
        setMessage(currentSuggestion.text)
        setShowSuggestion(false)
        setCurrentSuggestion(null)
        return
      }

      if (e.key === "/" && message === "") {
        e.preventDefault()
        // Trigger command menu (would be implemented by parent)
        return
      }

      if (e.key === "Escape") {
        e.preventDefault()
        // Cancel edit mode or clear input
        setMessage("")
        setCurrentSuggestion(null)
        setShowSuggestion(false)
        textareaRef.current?.blur()
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (disabledSend) {
          setShowThinkingNote(true)
          setTimeout(() => setShowThinkingNote(false), UI.THINKING_NOTE_DURATION_MS)
          return
        }
        handleSubmit()
      }

      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (queueEnabled && disabledSend) {
          handleQueueMessage()
        } else {
          handleSubmit()
        }
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

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        const audioChunks: Blob[] = []
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
          // Convert to text via speech recognition API (would be implemented)
          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error("Failed to start recording:", error)
      }
    }

    const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
    }

    const handleRateLimit = (seconds: number) => {
      setInputState("rate-limited")
      setRateLimitCountdown(seconds)
      const interval = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setInputState("default")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    const handleError = () => {
      setInputState("error")
      setTimeout(() => setInputState("default"), UI.ERROR_DISPLAY_DURATION_MS)
    }

    const isSendDisabled = disabled || !message.trim() || !canSend || disabledSend
    const characterCount = message.length
    const showCharCount = characterCount >= UI.PREMIUM_CHAR_COUNT_THRESHOLD
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="pb-safe-area-inset-bottom">
          <div
            className={cn(
              "backdrop-blur-xl border-t border-white/10",
              "shadow-[0_-2px_24px_rgba(0,0,0,0.15)]",
              "transition-all duration-200",
              isDarkMode ? "bg-gray-950/80" : "bg-white/80",
            )}
          >
            <div
              ref={containerRef}
              className={cn(
                "w-full max-w-sm mx-auto px-4 py-4", // Mobile: full width minus 16px padding
                "sm:max-w-xl sm:px-6", // Tablet: max-width 600px
                "md:max-w-3xl md:px-6 md:py-6", // Desktop: max-width 768px
              )}
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
                    className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-3xl flex items-center justify-center backdrop-blur-sm"
                  >
                    <div className="text-blue-600 dark:text-blue-400 text-lg font-medium">Drop file to attach</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {pendingDraft && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-sm text-amber-700 dark:text-amber-300">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Queued: "{pendingDraft.slice(0, 30)}
                    {pendingDraft.length > 30 ? "..." : ""}"
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {(showThinkingNote || isAIResponding) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full text-sm text-blue-700 dark:text-blue-300">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                      Pelican is thinking...
                      {queueEnabled && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">• Press ⌘Enter to queue</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {(attachments.length > 0 || pendingAttachments.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-3"
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
                <div
                  className={cn(
                    "relative rounded-3xl border transition-all duration-200 ease-out",
                    "shadow-sm hover:shadow-md",
                    isFocused &&
                      inputState === "default" &&
                      "border-purple-500/30 shadow-[0_0_0_3px_rgba(147,51,234,0.1)]",
                    inputState === "error" && "border-red-500/50 animate-shake",
                    inputState === "rate-limited" && "border-orange-500/50",
                    inputState === "default" && !isFocused && "border-transparent",
                    isDarkMode ? "bg-white/5" : "bg-white/50",
                  )}
                >
                  <div className="flex items-center absolute left-4 top-1/2 -translate-y-1/2 gap-1 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                      className={cn(
                        "w-8 h-8 transition-all duration-150",
                        "hover:bg-gray-100 dark:hover:bg-white/10",
                        "active:scale-95",
                      )}
                    >
                      <Paperclip className="h-5 w-5" />
                      <span className="sr-only">Attach file</span>
                    </Button>

                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={disabled}
                        className={cn(
                          "w-8 h-8 transition-all duration-150",
                          "hover:bg-gray-100 dark:hover:bg-white/10",
                          "active:scale-95",
                          isRecording && "bg-red-100 dark:bg-red-900/20",
                        )}
                      >
                        {isRecording ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                          >
                            <MicOff className="h-5 w-5 text-red-500" />
                          </motion.div>
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                        <span className="sr-only">{isRecording ? "Stop recording" : "Start voice input"}</span>
                      </Button>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        setIsFocused(true)
                        setShowKeyboardHint(true)
                      }}
                      onBlur={() => {
                        setIsFocused(false)
                        setShowKeyboardHint(false)
                      }}
                      placeholder={placeholder}
                      disabled={disabled || inputState === "rate-limited"}
                      className={cn(
                        "w-full resize-none border-0 bg-transparent outline-none",
                        "transition-all duration-200 ease-out",
                        "text-base md:text-[15px] leading-6",
                        "min-h-[56px] max-h-[200px] overflow-y-auto",
                        "py-4",
                        isMobile ? "pl-20 pr-16" : "pl-14 pr-16",
                        "placeholder:opacity-40",
                        isDarkMode
                          ? "text-white placeholder:text-white/40"
                          : "text-gray-900 placeholder:text-gray-500/40",
                        inputState === "rate-limited" && "opacity-50 cursor-not-allowed",
                      )}
                      rows={1}
                      style={{
                        height: `${UI.TEXTAREA_MIN_HEIGHT}px`,
                        WebkitFieldSizing: "content",
                        // @ts-ignore - fieldSizing is experimental CSS property not in TS types yet
                        fieldSizing: "content",
                      } as React.CSSProperties}
                    />

                    <AnimatePresence>
                      {showSuggestion && currentSuggestion && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <div
                            className={cn(
                              "py-4",
                              isMobile ? "pl-20 pr-16" : "pl-14 pr-16",
                              "text-base md:text-[15px] leading-6",
                              "whitespace-pre-wrap",
                            )}
                          >
                            <span className="invisible">{message}</span>
                            <span className={cn("opacity-40", isDarkMode ? "text-white/40" : "text-gray-500/40")}>
                              {currentSuggestion.text.slice(message.length)}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="absolute right-3 bottom-3">
                    <Button
                      onClick={isAIResponding && onStopResponse ? onStopResponse : handleSubmit}
                      disabled={(!isAIResponding && isSendDisabled) || inputState !== "default"}
                      size="icon"
                      className={cn(
                        "w-8 h-8 transition-all duration-150",
                        "active:scale-95",
                        !isSendDisabled &&
                          !isAIResponding &&
                          inputState === "default" &&
                          "hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105",
                        isAIResponding
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : isSendDisabled || inputState !== "default"
                            ? "bg-gray-500/30 text-gray-400 cursor-not-allowed opacity-30"
                            : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg",
                      )}
                    >
                      <motion.div
                        key={isAIResponding ? "stop" : "send"}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {isAIResponding ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </motion.div>
                      <span className="sr-only">{isAIResponding ? "Stop response" : "Send message"}</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 px-2">
                  <AnimatePresence>
                    {showKeyboardHint && !isAIResponding && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        <span className="hidden md:inline">
                          ⌘Enter to send • Tab to accept • / for commands • Esc to clear
                        </span>
                        <span className="md:hidden">Tap to send</span>
                      </motion.div>
                    )}

                    {showSuggestion && currentSuggestion && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-purple-500 dark:text-purple-400 font-medium"
                      >
                        Press Tab to accept suggestion
                      </motion.div>
                    )}

                    {inputState === "rate-limited" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-orange-500 font-medium"
                      >
                        Rate limited • Try again in {rateLimitCountdown}s
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
                          "text-xs font-medium tabular-nums",
                          characterCount >= UI.PREMIUM_CHAR_COUNT_DANGER_THRESHOLD
                            ? "text-red-500 font-semibold"
                            : characterCount >= UI.PREMIUM_CHAR_COUNT_WARNING_THRESHOLD
                              ? "text-yellow-500 font-medium"
                              : "text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {characterCount.toLocaleString()}/{UI.PREMIUM_MAX_CHARS.toLocaleString()}
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
            </div>
          </div>
        </div>
      </div>
    )
  },
)

PremiumChatInput.displayName = "PremiumChatInput"
