'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import TaskCard, { Task } from './TaskCard'
import ScreenshotModal from './ScreenshotModal'
import TwoFAPrompt from './TwoFAPrompt'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_ORDER: Task['status'][] = ['need_2fa', 'processing', 'pending', 'success', 'failed']

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export default function TaskTracker() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  // Poll every 8 seconds for live status updates
  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    '/api/tasks',
    fetcher,
    { refreshInterval: 8000 }
  )

  const handle2FASubmit = useCallback(async (taskId: string, code: string) => {
    await fetch('/api/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, code }),
    })
    mutate()
  }, [mutate])

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="glass-card h-48 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-brand-red text-sm">Failed to load tasks. Please refresh.</p>
      </div>
    )
  }

  const tasks = sortTasks(data?.tasks ?? [])
  const twoFATasks = tasks.filter((t) => t.status === 'need_2fa')

  // ── Empty state ──────────────────────────────────────────────────────────
  if (tasks.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-border flex items-center justify-center text-3xl">
          🔗
        </div>
        <h3 className="text-lg font-bold text-brand-text">No tasks yet</h3>
        <p className="text-sm text-brand-muted max-w-xs">
          Submit your first backlink task above. The AI agent will pick it up within seconds.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* 2FA alerts at top */}
      {twoFATasks.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
          {twoFATasks.map((task) => (
            <TwoFAPrompt
              key={task.id}
              taskId={task.id}
              prompt={task.twofaPrompt || ''}
              onSubmit={handle2FASubmit}
            />
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {(['processing', 'pending', 'success', 'failed', 'need_2fa'] as Task['status'][]).map((s) => {
          const count = tasks.filter((t) => t.status === s).length
          if (count === 0) return null
          return (
            <span key={s} className={`status-${s} capitalize`}>
              {count} {s.replace('_', ' ')}
            </span>
          )
        })}
      </div>

      {/* Task grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task, i) => (
          <div key={task.id} style={{ animationDelay: `${i * 60}ms` }}>
            <TaskCard
              task={task}
              onViewScreenshot={setScreenshotUrl}
              onSubmit2FA={handle2FASubmit}
            />
          </div>
        ))}
      </div>

      {/* Screenshot modal */}
      <ScreenshotModal
        screenshotUrl={screenshotUrl}
        onClose={() => setScreenshotUrl(null)}
      />
    </>
  )
}


