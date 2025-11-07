import { MessageSquare, FileText, Search } from 'lucide-react'
import { Button } from './button'

type EmptyStateType = 'conversations' | 'messages' | 'search' | 'files'

const iconMap = {
  conversations: MessageSquare,
  messages: MessageSquare,
  search: Search,
  files: FileText,
}

const contentMap = {
  conversations: {
    title: 'No conversations yet',
    description: 'Start a new conversation to begin chatting with Pelican AI',
  },
  messages: {
    title: 'No messages',
    description: 'Send a message to start the conversation',
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search terms',
  },
  files: {
    title: 'No files uploaded',
    description: 'Upload files to attach them to your messages',
  },
}

export function EmptyState({
  type,
  action,
  actionLabel,
}: {
  type: EmptyStateType
  action?: () => void
  actionLabel?: string
}) {
  const Icon = iconMap[type]
  const content = contentMap[type]

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{content.description}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="default" size="default" className="h-11 min-h-[44px]">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

