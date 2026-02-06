export const dynamic = 'force-dynamic'

import { requireAdminPage } from '@/lib/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, displayName } = await requireAdminPage()

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar displayName={displayName ?? user.email ?? 'Admin'} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
