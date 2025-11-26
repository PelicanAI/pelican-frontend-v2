"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Search, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onSearchConversations: (query: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onSearchConversations,
  isCollapsed = false,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearchConversations(query)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
        <div className="p-2">
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="w-8 h-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 p-2">
          <Button variant="ghost" size="icon" onClick={onNewChat} className="w-8 h-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full sm:w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/pelican-logo.png" alt="PelicanAI" className="w-6 h-6 sm:w-6 sm:h-6 object-contain" />
            <span className="font-semibold text-sm">PelicanAI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="w-11 h-11 sm:w-6 sm:h-6 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0">
            <X className="h-5 w-5 sm:h-3 sm:w-3" />
          </Button>
        </div>

        <Button onClick={onNewChat} className="w-full justify-start gap-2 h-11 sm:h-9 min-h-[44px] sm:min-h-0 bg-transparent" variant="outline">
          <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-[16px]"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  variant="ghost"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left min-h-[56px] sm:min-h-0",
                    currentConversationId === conversation.id && "bg-muted",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(conversation.updated_at)}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
