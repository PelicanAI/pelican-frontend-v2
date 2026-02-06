import { Badge } from '@/components/ui/badge'

interface UserDetailProps {
  user: {
    id: string
    displayName: string | null
    email: string
    createdAt: string
    isAdmin: boolean
    plan: string
    creditsBalance: number
    creditsUsed: number
    freeQuestionsRemaining: number
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserDetail({ user }: UserDetailProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 text-sm lg:grid-cols-4">
      <div>
        <p className="text-muted-foreground">User ID</p>
        <p className="font-mono text-xs break-all mt-0.5">{user.id}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Email</p>
        <p className="mt-0.5">{user.email}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Signed Up</p>
        <p className="mt-0.5">{formatDate(user.createdAt)}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Role</p>
        <p className="mt-0.5">
          {user.isAdmin ? (
            <Badge variant="destructive">Admin</Badge>
          ) : (
            <Badge variant="outline">User</Badge>
          )}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground">Plan</p>
        <p className="mt-0.5 capitalize">{user.plan}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Credits Balance</p>
        <p className="mt-0.5">{user.creditsBalance.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Credits Used (Month)</p>
        <p className="mt-0.5">{user.creditsUsed.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Free Questions Left</p>
        <p className="mt-0.5">{user.freeQuestionsRemaining}</p>
      </div>
    </div>
  )
}
