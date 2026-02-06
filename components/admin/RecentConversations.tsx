'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface ConversationRow {
  id: string
  title: string | null
  userName: string | null
  createdAt: string
}

interface ConvoMessage {
  id: string
  role: string
  content: string
  created_at: string
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageBubble({ msg }: { msg: ConvoMessage }) {
  const [expanded, setExpanded] = useState(false)
  const isUser = msg.role === 'user'
  const isLong = msg.content.length > 500

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-purple-600/20 text-purple-100'
            : 'bg-muted text-foreground'
        }`}
      >
        <p className="text-[10px] text-muted-foreground mb-1">
          {isUser ? 'User' : 'Assistant'} &middot; {formatTime(msg.created_at)}
        </p>
        <p className="whitespace-pre-wrap break-words">
          {isLong && !expanded ? msg.content.slice(0, 500) + '...' : msg.content}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-purple-400 hover:text-purple-300 mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  )
}

export function RecentConversations({ conversations: initial }: { conversations: ConversationRow[] }) {
  const [conversations, setConversations] = useState<ConversationRow[]>(initial)
  const [hasMore, setHasMore] = useState(initial.length >= 10)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [messagesCache, setMessagesCache] = useState<Record<string, ConvoMessage[]>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || conversations.length === 0) return
    setLoadingMore(true)
    try {
      const last = conversations[conversations.length - 1]!
      const params = new URLSearchParams({ limit: '10', cursor: last.createdAt })
      const res = await fetch(`/api/admin/conversations?${params}`)
      if (res.ok) {
        const data = await res.json()
        const newConvos: ConversationRow[] = data.conversations ?? []
        setConversations((prev) => [...prev, ...newConvos])
        setHasMore(data.hasMore === true)
      }
    } catch (e) {
      console.error('[RecentConversations] Failed to load more:', e)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, conversations])

  const handleToggle = useCallback(async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }

    setExpandedId(id)

    // Don't refetch if cached
    if (messagesCache[id]) return

    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/conversations/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessagesCache((prev) => ({ ...prev, [id]: data.messages ?? [] }))
      }
    } catch (e) {
      console.error('[RecentConversations] Failed to fetch messages:', e)
    } finally {
      setLoadingId(null)
    }
  }, [expandedId, messagesCache])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent conversations</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const isExpanded = expandedId === conv.id
              const messages = messagesCache[conv.id]
              const isLoading = loadingId === conv.id

              return (
                <div key={conv.id}>
                  <button
                    onClick={() => handleToggle(conv.id)}
                    className="w-full flex items-start gap-3 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <MessageSquare className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {conv.title || 'Untitled conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.userName || 'Unknown user'} &middot; {timeAgo(conv.createdAt)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-7 mr-2 mb-2 mt-1 border-l-2 border-border pl-3 space-y-2">
                      {isLoading && (
                        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" />
                          Loading messages...
                        </div>
                      )}
                      {!isLoading && messages && messages.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">No messages</p>
                      )}
                      {!isLoading && messages && messages.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full flex items-center justify-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Show more'
                )}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
