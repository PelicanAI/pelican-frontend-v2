import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserRow {
  id: string
  displayName: string | null
  email: string
  createdAt: string
  plan: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function planVariant(plan: string) {
  switch (plan) {
    case 'pro':
    case 'power':
      return 'default' as const
    case 'starter':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

export function RecentSignups({ users }: { users: UserRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Signups</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent signups</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {user.displayName || user.email}
                  </p>
                  {user.displayName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant={planVariant(user.plan)} className="text-[10px]">
                    {user.plan}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
