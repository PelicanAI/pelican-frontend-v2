"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/chat-utils"

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
  showActions?: boolean
}

export function ChatMessage({ message, onRegenerate, showActions = false }: ChatMessageProps) {
  const isUser = message.role === "user"

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <div className={cn("group relative px-4 py-6", !isUser && "bg-muted/10 dark:bg-surface-2/80")}>
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className={cn(
            isUser 
              ? "bg-card border border-border text-foreground" 
              : "bg-primary text-primary-foreground"
          )}>
            {isUser ? "You" : "P"}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>

          {/* Actions */}
          {showActions && !isUser && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              {onRegenerate && (
                <Button variant="ghost" size="sm" onClick={onRegenerate} className="h-7 px-2 text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
