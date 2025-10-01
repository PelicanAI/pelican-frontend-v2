"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit3,
  X,
  Home,
  Archive,
  ArchiveRestore,
  Settings,
  Crown,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useConversations } from "@/hooks/use-conversations"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, stagger, useAnimate } from "framer-motion"

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  archived?: boolean
  messages?: Array<{
    id: string
    role: string
    content: string
    created_at: string
  }>
}

interface ConversationSidebarProps {
  currentConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  className?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileSheet?: boolean
  isNavigating?: boolean
  navigatingToId?: string
}

const groupConversationsByTime = (conversations: Conversation[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const groups = {
    today: [] as Conversation[],
    yesterday: [] as Conversation[],
    previous7Days: [] as Conversation[],
    earlier: [] as Conversation[],
  }

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at)
    if (convDate >= today) {
      groups.today.push(conv)
    } else if (convDate >= yesterday) {
      groups.yesterday.push(conv)
    } else if (convDate >= sevenDaysAgo) {
      groups.previous7Days.push(conv)
    } else {
      groups.earlier.push(conv)
    }
  })

  return groups
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

const getExactDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  className,
  isCollapsed = false,
  onToggleCollapse,
  isMobileSheet = false,
  isNavigating = false,
  navigatingToId,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [scope, animate] = useAnimate()

  const { conversations, isLoading, deleteConversation, updateConversation } = useConversations()

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesArchiveFilter = showArchived ? conv.archived : !conv.archived
      return matchesSearch && matchesArchiveFilter
    })
  }, [conversations, searchQuery, showArchived])

  const groupedConversations = useMemo(() => {
    return groupConversationsByTime(filteredConversations)
  }, [filteredConversations])

  useEffect(() => {
    if (!isCollapsed && !isMobileSheet && filteredConversations.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const elements = document.querySelectorAll(".conversation-item")
        if (elements.length > 0) {
          animate(".conversation-item", { opacity: [0, 1], x: [-20, 0] }, { delay: stagger(0.05), duration: 0.3 })
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isCollapsed, animate, isMobileSheet, filteredConversations.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      const items = document.querySelectorAll("[data-conversation-id]")
      const currentIndex = Array.from(items).findIndex(
        (item) => item.getAttribute("data-conversation-id") === currentConversationId,
      )

      if (e.key === "ArrowDown") {
        e.preventDefault()
        const nextIndex = Math.min(currentIndex + 1, items.length - 1)
        const nextItem = items[nextIndex] as HTMLElement
        nextItem?.focus()
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        const prevItem = items[prevIndex] as HTMLElement
        prevItem?.focus()
      } else if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault()
        const currentItem = items[currentIndex]
        const conversationId = currentItem.getAttribute("data-conversation-id")
        if (conversationId) onConversationSelect(conversationId)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentConversationId, onConversationSelect])

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId)
    if (success && currentConversationId === conversationId) {
      onNewConversation()
    }
  }

  const handleArchiveConversation = async (conversationId: string, archived: boolean) => {
    const success = await updateConversation(conversationId, { archived })
    if (success && currentConversationId === conversationId && archived) {
      onNewConversation()
    }
  }

  const handleEditTitle = async (conversationId: string, newTitle: string) => {
    const success = await updateConversation(conversationId, { title: newTitle })
    if (success) {
      setEditingId(null)
    }
  }

  const startEditing = (conversation: any) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title || 'New conversation')
  }

  const ConversationItem = ({ conversation, index }: { conversation: Conversation; index: number }) => {
    const isNavigatingToThis = isNavigating && navigatingToId === conversation.id
    const isActive = currentConversationId === conversation.id
    const lastMessage = conversation.messages?.[conversation.messages.length - 1]
    const preview = lastMessage?.content?.slice(0, 50) + (lastMessage?.content?.length > 50 ? "..." : "") || ""
    const [showActions, setShowActions] = useState(false)

    return (
      <motion.div
        className="conversation-item"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        key={conversation.id}
      >
        <div
          role="button"
          tabIndex={0}
          data-conversation-id={conversation.id}
          className={cn(
            "group relative cursor-pointer transition-all duration-150 ease-out rounded-lg mx-2",
            "min-h-[64px] px-3 py-2.5 flex items-center gap-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
            isActive && [
              "bg-purple-500/10 border border-purple-500/20",
            ],
            !isActive && "hover:bg-sidebar-accent/50 border border-transparent",
            conversation.archived && "opacity-60",
            isNavigatingToThis && "opacity-50 cursor-wait",
          )}
          onClick={() => {
            if (isNavigatingToThis) return
            onConversationSelect?.(conversation.id)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              if (isNavigatingToThis) return
              onConversationSelect?.(conversation.id)
            }
          }}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <div className="flex-1 min-w-0">
            {editingId === conversation.id ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleEditTitle(conversation.id, editTitle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleEditTitle(conversation.id, editTitle)
                  } else if (e.key === "Escape") {
                    setEditingId(null)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 text-sm bg-transparent border-purple-500/30 focus:border-purple-500"
                autoFocus
              />
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate text-sidebar-foreground leading-snug">
                    {searchQuery ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: conversation.title.replace(
                            new RegExp(`(${searchQuery})`, "gi"),
                            '<mark class="bg-purple-500/20 text-purple-300">$1</mark>',
                          ),
                        }}
                      />
                    ) : (
                      conversation.title || 'New conversation'
                    )}
                  </h3>
                  {conversation.archived && <Archive className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate" title={preview}>
                    {preview || "No messages yet"}
                  </span>
                  <span className="text-[10px] flex-shrink-0" title={getExactDateTime(conversation.updated_at)}>
                    {formatRelativeTime(conversation.updated_at)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <motion.div
            className="flex items-center gap-0.5 flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: showActions || isActive ? 1 : 0, scale: showActions || isActive ? 1 : 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(conversation)
              }}
              className="h-7 w-7 hover:bg-sidebar-accent/70"
              title="Edit conversation"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteConversation(conversation.id)
              }}
              className="h-7 w-7 hover:bg-red-500/20 text-red-400 hover:text-red-300"
              title="Delete conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={scope}
      className={cn(
        "relative z-20 pointer-events-auto",
        isMobileSheet ? "w-full h-full" : "w-80 h-screen border-r overflow-hidden",
        "flex flex-col bg-gradient-to-b from-sidebar to-sidebar/95",
        !isMobileSheet && "border-sidebar-border/50",
        className,
      )}
      style={{ outline: "1px solid transparent" }}
      initial={!isMobileSheet ? { width: 64 } : undefined}
      animate={!isMobileSheet ? { width: 320 } : undefined}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      {/* Header - 16px padding */}
      <div className="px-4 py-4 border-b border-sidebar-border/30">
        {/* Logo section - 8px gap between items */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image src="/pelican-logo.png" alt="PelicanAI" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-bold text-base bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              PelicanAI
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {onToggleCollapse && !isMobileSheet && (
              <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8 hover:bg-sidebar-accent/50">
                <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.2 }}>
                  <X className="h-4 w-4 text-sidebar-foreground" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>

        {/* Action buttons - 8px gap */}
        <div className="space-y-2">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={onNewConversation}
              className="w-full h-10 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg hover:shadow-purple-500/25 transition-all duration-200 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100"
                transition={{ duration: 0.2 }}
              />
              <Plus className="w-4 h-4 mr-2" />
              New chat
            </Button>
          </motion.div>
        </div>
      </div>
      {/* Search section - 16px padding */}
      <div className="px-4 py-3 border-b border-sidebar-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 pr-3 bg-sidebar/50 border-sidebar-border/50 text-sidebar-foreground text-sm placeholder:text-muted-foreground focus:border-purple-500/50 transition-colors duration-200 rounded-lg"
          />
        </div>
      </div>
      {/* Conversations list - proper spacing */}
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/15">
        <div className="py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
            </div>
          ) : Object.values(groupedConversations).every((group) => group.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
              <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground/20" />
              <p className="text-xs font-medium text-muted-foreground/60">{showArchived ? "No archived conversations" : "No conversations yet"}</p>
              <p className="text-xs mt-1 text-muted-foreground/40">Click "New chat" to start</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10 px-4 py-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Today
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.today.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10 px-4 py-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Yesterday
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.yesterday.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.previous7Days.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10 px-4 py-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Previous 7 Days
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.previous7Days.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.earlier.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10 px-4 py-2">
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Earlier
                    </h4>
                  </div>
                  <div className="space-y-1">
                    {groupedConversations.earlier.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      {/* Footer - 12px padding */}
      <div className="px-3 py-3 border-t border-sidebar-border/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1 justify-start h-10 px-3 hover:bg-sidebar-accent/50 group"
          >
            <Link href="/profile" className="flex items-center gap-3">
              <Avatar className="w-8 h-8 ring-2 ring-sidebar-border/50 group-hover:ring-purple-500/30 transition-all">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-purple-500/20 text-purple-300">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Account</p>
                <p className="text-[10px] text-muted-foreground">View profile</p>
              </div>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 hover:bg-sidebar-accent/50"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
