import Link from 'next/link'

export const metadata = { title: 'API Documentation' }

const CODE_CREATE = `curl -X POST https://your-domain.com/api/tasks \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{\n    "targetUrl": "https://your-site.com/page",\n    "anchorText": "best SEO tool",\n    "platformType": "Web2.0",\n    "articleContent": "Optional article..."\n  }'`

const CODE_RESPONSE = `{
  "id": "uuid-here",
  "status": "pending",
  "deadline": "2025-01-20T12:00:00Z",
  "createdAt": "2025-01-18T12:00:00Z"
}`

const CODE_GET = `curl https://your-domain.com/api/tasks \\\n  -H "Authorization: Bearer YOUR_API_KEY"`

const CODE_WEBHOOK = `{
  "event": "task.success",
  "taskId": "uuid-here",
  "screenshotUrl": "https://cdn.example.com/screenshot.png",
  "liveLinkUrl": "https://platform.com/your-post"
}`

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4
                         bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <Link href="/" className="text-brand-cyan font-bold text-lg tracking-tight">LinkFlow AI</Link>
        <Link href="/dashboard" className="btn-primary text-xs px-4 py-2">Dashboard →</Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-bold text-brand-cyan tracking-widest uppercase mb-3">API Reference</p>
          <h1 className="section-heading mb-4">LinkFlow REST API</h1>
          <p className="text-brand-muted">
            Integrate backlink automation directly into your tools, dashboards, or SaaS products.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Base URL */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-brand-text mb-3">Base URL</h2>
            <code className="block bg-brand-bg rounded-lg px-4 py-3 text-brand-cyan text-sm font-mono">
              https://your-domain.com/api
            </code>
          </div>

          {/* POST /tasks */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-brand-green/15 text-brand-green text-xs font-bold">POST</span>
              <code className="text-brand-text text-sm font-mono">/api/tasks</code>
            </div>
            <p className="text-sm text-brand-muted">Create a new backlink deployment task.</p>
            <div>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Request</p>
              <pre className="bg-brand-bg rounded-lg p-4 text-xs text-brand-cyan font-mono overflow-x-auto">{CODE_CREATE}</pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">Response 201</p>
              <pre className="bg-brand-bg rounded-lg p-4 text-xs text-brand-green font-mono overflow-x-auto">{CODE_RESPONSE}</pre>
            </div>
          </div>

          {/* GET /tasks */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-brand-cyan/15 text-brand-cyan text-xs font-bold">GET</span>
              <code className="text-brand-text text-sm font-mono">/api/tasks</code>
            </div>
            <p className="text-sm text-brand-muted">List all tasks for the authenticated user.</p>
            <pre className="bg-brand-bg rounded-lg p-4 text-xs text-brand-cyan font-mono overflow-x-auto">{CODE_GET}</pre>
          </div>

          {/* Task statuses */}
          <div className="glass-card p-6">
            <h2 className="text-base font-bold text-brand-text mb-4">Task Status Values</h2>
            <div className="flex flex-col gap-2">
              {[
                ['pending',    'brand-muted',  'Task is queued, waiting for worker to pick up'],
                ['processing', 'brand-cyan',   'AI agent is currently executing the submission'],
                ['success',    'brand-green',  'Backlink deployed. Screenshot and live URL available'],
                ['failed',     'brand-red',    'All retry attempts failed. Credit refunded'],
                ['need_2fa',   'brand-amber',  '2FA required. Waiting for user code submission'],
              ].map(([status, color, desc]) => (
                <div key={status} className="flex items-start gap-3 py-2 border-t border-brand-border first:border-0 first:pt-0">
                  <code className={`text-${color} text-xs font-mono font-bold shrink-0 w-28`}>{status}</code>
                  <span className="text-xs text-brand-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-brand-text">Webhook Events</h2>
            <p className="text-sm text-brand-muted">
              Configure a webhook URL in your dashboard to receive real-time status updates.
            </p>
            <pre className="bg-brand-bg rounded-lg p-4 text-xs text-brand-green font-mono overflow-x-auto">{CODE_WEBHOOK}</pre>
          </div>
        </div>
      </div>
    </main>
  )
}


