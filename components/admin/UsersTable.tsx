'use client'

import { useState, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download } from 'lucide-react'
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
  lastSignIn?: string | null
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

const PLAN_OPTIONS = ['all', 'none', 'trial', 'base', 'pro', 'power', 'founder'] as const
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_credits', label: 'Most Credits' },
  { value: 'least_credits', label: 'Least Credits' },
  { value: 'most_active', label: 'Most Active' },
] as const

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

function exportCSV(users: AdminUser[]) {
  const header = 'email,plan_type,credits_balance,credits_used_this_month,signed_up'
  const rows = users.map((u) => {
    const email = u.email.includes(',') ? `"${u.email}"` : u.email
    return `${email},${u.plan},${u.creditsBalance},${u.creditsUsed},${u.createdAt.split('T')[0]}`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pelican-users-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function UsersTable({ initialData }: { initialData: UsersResponse }) {
  const [data, setData] = useState<UsersResponse>(initialData)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page: number, query: string, plan: string, sort: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (query.trim()) params.set('search', query.trim())
      if (plan && plan !== 'all') params.set('plan', plan)
      if (sort) params.set('sort', sort)

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
    fetchUsers(1, search, planFilter, sortBy)
  }

  const handlePlanChange = (plan: string) => {
    setPlanFilter(plan)
    setExpandedId(null)
    fetchUsers(1, search, plan, sortBy)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setExpandedId(null)
    fetchUsers(1, search, planFilter, sort)
  }

  const goToPage = (page: number) => {
    setExpandedId(null)
    fetchUsers(page, search, planFilter, sortBy)
  }

  const handleExport = async () => {
    // Fetch all users matching current filters (up to 1000)
    const params = new URLSearchParams({ page: '1', limit: '100' })
    if (search.trim()) params.set('search', search.trim())
    if (planFilter && planFilter !== 'all') params.set('plan', planFilter)
    if (sortBy) params.set('sort', sortBy)

    try {
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const json = await res.json()
        exportCSV(json.users)
      }
    } catch {
      // Silent fail — user can retry
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={loading}>
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={planFilter}
            onChange={(e) => handlePlanChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Plans' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={handleExport} title="Export CSV">
            <Download className="size-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

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

        {/* Expanded detail */}
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
