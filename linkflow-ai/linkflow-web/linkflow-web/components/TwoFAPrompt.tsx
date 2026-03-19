'use client'

import { useState } from 'react'

interface TwoFAPromptProps {
  taskId: string
  prompt: string
  onSubmit: (taskId: string, code: string) => Promise<void>
}

export default function TwoFAPrompt({ taskId, prompt, onSubmit }: TwoFAPromptProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!code.trim()) return
    setLoading(true)
    await onSubmit(taskId, code.trim())
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-brand-green/10 border border-brand-green/30 p-4 flex items-center gap-3">
        <span className="text-brand-green text-xl">✓</span>
        <p className="text-sm text-brand-green font-medium">
          Code submitted — AI Agent will resume shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-brand-amber/10 border border-brand-amber/40 p-5 flex flex-col gap-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">⚡</span>
        <div>
          <h4 className="text-sm font-bold text-brand-amber mb-0.5">Action Required</h4>
          <p className="text-xs text-brand-muted leading-relaxed">
            {prompt || 'The AI Agent encountered a 2FA verification step and needs your help to continue.'}
          </p>
        </div>
      </div>

      {/* Code input */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={10}
          className="input-field flex-1"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="px-5 py-3 rounded-xl bg-brand-amber text-brand-bg font-bold text-sm
                     hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all active:scale-95 shadow-glow-amber"
        >
          {loading ? 'Sending…' : 'Submit'}
        </button>
      </div>

      <p className="text-xs text-brand-muted">
        The agent will automatically resume execution once it receives your code.
      </p>
    </div>
  )
}


