import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import TaskTracker from '@/components/TaskTracker'
import NewTaskForm from '@/components/NewTaskForm'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { creditBalance: true, email: true, name: true },
  })

  return (
    <main className="min-h-screen">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4
                         bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <Link href="/" className="text-brand-cyan font-bold text-lg tracking-tight">
          LinkFlow <span className="text-xs font-semibold text-brand-muted">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                          bg-brand-surface border border-brand-border">
            <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
            <span className="text-sm font-bold text-brand-text">{user?.creditBalance ?? 0}</span>
            <span className="text-xs text-brand-muted">credits</span>
          </div>
          <Link href="/pricing"
            className="btn-secondary text-xs px-3 py-1.5">Top up</Link>
          <span className="text-xs text-brand-muted hidden md:block">
            {user?.email}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* ── New Task ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">New Task</h2>
          <NewTaskForm creditBalance={user?.creditBalance ?? 0} />
        </section>

        {/* ── Task Tracker ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Task Tracker</h2>
          <TaskTracker />
        </section>
      </div>
    </main>
  )
}


