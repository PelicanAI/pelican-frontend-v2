import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

interface ConversationRow {
  id: string
  title: string | null
  userName: string | null
  createdAt: string
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

export function RecentConversations({ conversations }: { conversations: ConversationRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent conversations</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div key={conv.id} className="flex items-start gap-3 text-sm">
                <MessageSquare className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {conv.title || 'Untitled conversation'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conv.userName || 'Unknown user'} &middot; {timeAgo(conv.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
