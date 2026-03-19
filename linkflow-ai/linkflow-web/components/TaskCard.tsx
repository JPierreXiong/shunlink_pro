'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow, differenceInSeconds } from 'date-fns'

export type TaskStatus = 'pending' | 'processing' | 'success' | 'failed' | 'need_2fa'

export interface Task {
  id: string
  targetUrl: string
  anchorText: string
  platformType: string
  status: TaskStatus
  retryCount: number
  screenshotUrl?: string | null
  liveLinkUrl?: string | null
  errorMessage?: string | null
  twofaPrompt?: string | null
  createdAt: string
  deadline: string
}

interface TaskCardProps {
  task: Task
  onViewScreenshot?: (url: string) => void
  onSubmit2FA?: (taskId: string, code: string) => void
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string; ring: string }> = {
  pending:    { label: 'Queued',       dot: 'bg-brand-muted',  ring: 'ring-brand-muted/30' },
  processing: { label: 'Running',      dot: 'bg-brand-cyan animate-pulse', ring: 'ring-brand-cyan/30' },
  success:    { label: 'Live',         dot: 'bg-brand-green',  ring: 'ring-brand-green/30' },
  failed:     { label: 'Failed',       dot: 'bg-brand-red',    ring: 'ring-brand-red/30' },
  need_2fa:   { label: 'Action Needed',dot: 'bg-brand-amber animate-pulse', ring: 'ring-brand-amber/30' },
}

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(deadline: string) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, differenceInSeconds(new Date(deadline), new Date()))
  )

  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const hours   = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60
  const totalSeconds = differenceInSeconds(new Date(deadline), new Date(Date.now() - 48 * 3600 * 1000 ))
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / (48 * 3600)) * 100)) : 0

  return {
    display: `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`,
    progress,
    expired: secondsLeft <= 0,
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TaskCard({ task, onViewScreenshot, onSubmit2FA }: TaskCardProps) {
  const statusCfg = STATUS_CONFIG[task.status]
  const countdown = useCountdown(task.deadline)
  const [twoFAInput, setTwoFAInput] = useState('')
  const [submitting2FA, setSubmitting2FA] = useState(false)

  const handle2FASubmit = async () => {
    if (!twoFAInput.trim() || !onSubmit2FA) return
    setSubmitting2FA(true)
    await onSubmit2FA(task.id, twoFAInput.trim())
    setSubmitting2FA(false)
    setTwoFAInput('')
  }

  // Progress bar color based on time remaining
  const barColor =
    countdown.progress > 50 ? 'bg-brand-cyan'
    : countdown.progress > 20 ? 'bg-brand-amber'
    : 'bg-brand-red'

  return (
    <div
      className={`
        glass-card p-5 flex flex-col gap-4
        ring-1 ${statusCfg.ring}
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-cyan
        animate-fade-up
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-brand-muted font-medium uppercase tracking-widest mb-1">
            {task.platformType}
          </p>
          <p className="text-sm font-semibold text-brand-text truncate" title={task.anchorText}>
            {task.anchorText}
          </p>
          <a
            href={task.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-muted hover:text-brand-cyan transition-colors truncate block"
          >
            {task.targetUrl.replace(/^https?:\/\//, '')}
          </a>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
          <span className="text-xs font-semibold text-brand-muted">{statusCfg.label}</span>
        </div>
      </div>

      {/* Countdown timer (only for active tasks) */}
      {(task.status === 'pending' || task.status === 'processing' || task.status === 'need_2fa') && (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-brand-muted">Time remaining</span>
            <span className={`text-sm font-mono font-bold ${
              countdown.expired ? 'text-brand-red' :
              countdown.progress > 50 ? 'text-brand-cyan' :
              countdown.progress > 20 ? 'text-brand-amber' : 'text-brand-red'
            }`}>
              {countdown.expired ? 'EXPIRED' : countdown.display}
            </span>
          </div>
          <div className="h-1 w-full bg-brand-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${countdown.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2FA input */}
      {task.status === 'need_2fa' && (
        <div className="rounded-xl bg-brand-amber/10 border border-brand-amber/30 p-3 flex flex-col gap-2">
          <p className="text-xs font-semibold text-brand-amber">⚡ Action Required</p>
          <p className="text-xs text-brand-muted">{task.twofaPrompt || 'AI Agent is waiting for your 2FA code'}</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 2FA code"
              value={twoFAInput}
              onChange={(e) => setTwoFAInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handle2FASubmit()}
              className="input-field text-xs py-2 flex-1"
            />
            <button
              onClick={handle2FASubmit}
              disabled={submitting2FA || !twoFAInput.trim()}
              className="px-3 py-2 rounded-lg bg-brand-amber text-brand-bg text-xs font-bold
                         hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all active:scale-95"
            >
              {submitting2FA ? '...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Success: show screenshot + live link */}
      {task.status === 'success' && (
        <div className="flex gap-2">
          {task.screenshotUrl && (
            <button
              onClick={() => onViewScreenshot?.(task.screenshotUrl!)}
              className="flex-1 py-2 px-3 rounded-lg bg-brand-green/10 border border-brand-green/30
                         text-xs font-semibold text-brand-green hover:bg-brand-green/20
                         transition-all active:scale-95"
            >
              📸 View Screenshot
            </button>
          )}
          {task.liveLinkUrl && (
            <a
              href={task.liveLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30
                         text-xs font-semibold text-brand-cyan hover:bg-brand-cyan/20
                         transition-all text-center"
            >
              🔗 Live Link
            </a>
          )}
        </div>
      )}

      {/* Failed: show error */}
      {task.status === 'failed' && task.errorMessage && (
        <div className="rounded-lg bg-brand-red/10 border border-brand-red/20 p-2.5">
          <p className="text-xs text-brand-red line-clamp-2">{task.errorMessage}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-1 border-t border-brand-border">
        <span className="text-xs text-brand-muted">
          {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
        </span>
        {task.retryCount > 0 && (
          <span className="text-xs text-brand-muted">Retry #{task.retryCount}</span>
        )}
      </div>
    </div>
  )
}


