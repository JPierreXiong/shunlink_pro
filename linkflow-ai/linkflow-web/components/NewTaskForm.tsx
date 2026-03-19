'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewTaskFormProps {
  creditBalance: number
}

const PLATFORM_TYPES = ['Web2.0', 'Blog', 'Social', 'Forum']

export default function NewTaskForm({ creditBalance }: NewTaskFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    targetUrl: '',
    anchorText: '',
    articleContent: '',
    platformType: 'Web2.0',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.targetUrl || !form.anchorText) {
      setError('Target URL and anchor text are required.')
      return
    }
    if (creditBalance < 1) {
      setError('You have no credits. Please top up to continue.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create task')
      }
      setSuccess(true)
      setForm({ targetUrl: '', anchorText: '', articleContent: '', platformType: 'Web2.0' })
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col gap-5">
      {success && (
        <div className="rounded-xl bg-brand-green/10 border border-brand-green/30 p-3 text-sm text-brand-green">
          ✓ Task submitted! The AI agent will pick it up within seconds.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-brand-red/10 border border-brand-red/30 p-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Target URL *
          </label>
          <input
            type="url"
            placeholder="https://your-website.com/page"
            value={form.targetUrl}
            onChange={(e) => set('targetUrl', e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
            Anchor Text *
          </label>
          <input
            type="text"
            placeholder="best SEO tool 2025"
            value={form.anchorText}
            onChange={(e) => set('anchorText', e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
          Platform Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {PLATFORM_TYPES.map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => set('platformType', pt)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                form.platformType === pt
                  ? 'bg-brand-cyan text-brand-bg shadow-glow-cyan'
                  : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-cyan'
              }`}
            >
              {pt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
          Article Content <span className="normal-case font-normal">(optional — AI will write one if empty)</span>
        </label>
        <textarea
          placeholder="Paste your article here, or leave blank and our AI will generate relevant content..."
          value={form.articleContent}
          onChange={(e) => set('articleContent', e.target.value)}
          rows={5}
          className="input-field resize-none"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-brand-muted">
          Costs <span className="text-brand-cyan font-bold">1 credit</span> · You have{' '}
          <span className="text-brand-text font-bold">{creditBalance}</span>
        </span>
        <button
          type="submit"
          disabled={loading || creditBalance < 1}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting…' : 'Deploy Backlink →'}
        </button>
      </div>
    </form>
  )
}


