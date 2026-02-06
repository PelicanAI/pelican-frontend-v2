'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, BarChart3, ArrowLeft, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card lg:w-64">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Shield className="size-5 text-primary" />
        <span className="text-sm font-semibold">Admin Panel</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-3 space-y-2">
        <p className="truncate text-xs text-muted-foreground">{displayName}</p>
        <Link
          href="/chat"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back to Chat
        </Link>
      </div>
    </aside>
  )
}
