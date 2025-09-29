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
            "group relative cursor-pointer transition-all duration-150 ease-out",
            "h-[72px] px-4 py-3 flex items-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50",
            isActive && ["border-l-[3px] border-l-purple-500", "bg-purple-500/10", "scale-[1.01]"],
            !isActive && "hover:bg-white/5 border-l-[3px] border-l-transparent",
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
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate text-sidebar-foreground leading-tight font-weight-500">
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
                  {conversation.archived && <Archive className="h-3 w-3 text-muted-foreground ml-2 flex-shrink-0" />}
                </div>
                <div
                  className="text-xs text-sidebar-foreground/70 truncate leading-tight"
                  title={getExactDateTime(conversation.updated_at)}
                >
                  {preview || formatRelativeTime(conversation.updated_at)}
                </div>
              </div>
            )}
          </div>
          <motion.div
            className="flex items-center gap-1 ml-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: showActions ? 1 : 0, x: showActions ? 0 : 10 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(conversation)
              }}
              className="h-7 w-7 p-0 hover:bg-white/10"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleArchiveConversation(conversation.id, !conversation.archived)
              }}
              className="h-7 w-7 p-0 hover:bg-white/10"
            >
              {conversation.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteConversation(conversation.id)
              }}
              className="h-7 w-7 p-0 hover:bg-red-500/20 text-red-400"
            >
              <Trash2 className="h-3 w-3" />
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
      <div className="p-4 border-b border-sidebar-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Image src="/pelican-logo.png" alt="PelicanAI" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              PelicanAI
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleCollapse && !isMobileSheet && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="glow-button glow-ghost group">
                <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.2 }}>
                  <X className="h-4 w-4 text-sidebar-foreground" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            asChild
            className="w-full bg-transparent border-sidebar-border/50 text-sidebar-foreground hover:bg-sidebar-accent/50 glow-button glow-secondary transition-all duration-200"
            size="sm"
          >
            <Link href="/marketing">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onNewConversation}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200 relative overflow-hidden group"
              size="sm"
            >
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100"
                transition={{ duration: 0.2 }}
              />
              <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                <Plus className="w-4 h-4 mr-2" />
              </motion.div>
              New chat
            </Button>
          </motion.div>
        </div>
      </div>
      <div className="p-4 border-b border-sidebar-border/30">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-sidebar/50 border-sidebar-border/50 text-sidebar-foreground placeholder:text-muted-foreground focus:border-purple-500/50 transition-colors duration-200"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className={cn(
            "w-full justify-start glow-button glow-ghost transition-all duration-200",
            showArchived
              ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
              : "text-muted-foreground hover:text-sidebar-foreground",
          )}
        >
          {showArchived ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
          {showArchived ? "Show Active" : "Show Archived"}
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/15">
        <div className="p-2">
          {isLoading ? (
            <div className="text-center py-8">
              <motion.div
                className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
            </div>
          ) : Object.values(groupedConversations).every((group) => group.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{showArchived ? "No archived conversations" : "No conversations yet"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedConversations.today.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10">
                    <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-600 mb-1 px-3 py-1.5 uppercase tracking-wider">
                      Today
                    </h4>
                  </div>
                  <div>
                    {groupedConversations.today.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.yesterday.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10">
                    <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-600 mb-1 px-3 py-1.5 uppercase tracking-wider">
                      Yesterday
                    </h4>
                  </div>
                  <div>
                    {groupedConversations.yesterday.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.previous7Days.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10">
                    <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-600 mb-1 px-3 py-1.5 uppercase tracking-wider">
                      Previous 7 Days
                    </h4>
                  </div>
                  <div>
                    {groupedConversations.previous7Days.map((conversation, index) => (
                      <ConversationItem key={conversation.id} conversation={conversation} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {groupedConversations.earlier.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-sidebar/95 backdrop-blur-sm z-10">
                    <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-600 mb-1 px-3 py-1.5 uppercase tracking-wider">
                      Earlier
                    </h4>
                  </div>
                  <div>
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
      <div className="p-3 border-t border-sidebar-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src="/user-avatar.png" />
              <AvatarFallback className="bg-purple-500/20 text-purple-300 text-xs">
                <User className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-sidebar-foreground/70">Account</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs relative"
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              Upgrade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              Install
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
