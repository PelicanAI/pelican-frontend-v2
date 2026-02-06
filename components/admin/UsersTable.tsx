'use client'

import { useState, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { UserDetail } from '@/components/admin/UserDetail'

interface AdminUser {
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

interface UsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UsersTable({ initialData }: { initialData: UsersResponse }) {
  const [data, setData] = useState<UsersResponse>(initialData)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page: number, query: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (query.trim()) params.set('search', query.trim())

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setExpandedId(null)
    fetchUsers(1, search)
  }

  const goToPage = (page: number) => {
    setExpandedId(null)
    fetchUsers(page, search)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={loading}>
          Search
        </Button>
      </form>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell">Credits</TableHead>
              <TableHead className="hidden lg:table-cell">Signed Up</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((user) => {
                const isExpanded = expandedId === user.id
                return (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : user.id)
                    }
                  >
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {user.displayName || user.email}
                        </p>
                        {user.displayName && (
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planVariant(user.plan)} className="text-[10px]">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell tabular-nums">
                      {user.creditsBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatShortDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Expanded detail — rendered outside the table for valid HTML */}
        {expandedId && (
          <div className="border-t border-border bg-muted/30" onClick={(e) => e.stopPropagation()}>
            {data.users
              .filter((u) => u.id === expandedId)
              .map((user) => (
                <UserDetail key={user.id} user={user} />
              ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} ({data.total} users)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.page - 1)}
              disabled={data.page <= 1 || loading}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(data.page + 1)}
              disabled={data.page >= data.totalPages || loading}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
