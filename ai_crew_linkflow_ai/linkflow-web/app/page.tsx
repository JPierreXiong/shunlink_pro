import Link from 'next/link'

const TRUST_STATS = [
  { value: '50+', label: 'Web 2.0 Platforms' },
  { value: '24h', label: 'Delivery Guarantee' },
  { value: '100%', label: 'Screenshot Proof' },
  { value: '48h', label: 'SLA Window' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Submit Your Task',
    body: 'Enter your target URL, anchor text, and article content. Our AI adapts it to each platform automatically.',
  },
  {
    step: '02',
    title: 'AI Agent Deploys',
    body: 'The CrewAI-powered navigator logs in, fills forms, and publishes your backlink — acting exactly like a human.',
  },
  {
    step: '03',
    title: 'Screenshot Delivered',
    body: 'You receive a full-page screenshot as tamper-proof evidence. No more guessing if links were actually placed.',
  },
]

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Navigation',
    body: 'Self-healing agents automatically adapt when platform UIs change. No manual selector updates needed.',
  },
  {
    icon: '🔐',
    title: 'Human-in-Loop 2FA',
    body: 'When platforms require 2FA, the AI pauses and notifies you in real-time. You enter the code; the AI continues.',
  },
  {
    icon: '📸',
    title: 'Transparent Screenshot Proof',
    body: 'Every successful submission captures a full-page screenshot stored in cloud storage. Fraud-proof delivery.',
  },
  {
    icon: '⚡',
    title: '48-Hour SLA',
    body: 'Every task has a 48-hour deadline. If we fail to deliver, your credit is automatically refunded.',
  },
  {
    icon: '🌍',
    title: 'Residential Proxies',
    body: 'All browser sessions route through residential IPs. Links look natural to Google — not datacenter spam.',
  },
  {
    icon: '🔁',
    title: 'Auto-Retry Logic',
    body: 'Failed submissions automatically retry up to 3 times. Credits only deducted on confirmed success.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4
                     bg-brand-bg/70 backdrop-blur-md border-b border-brand-border">
        <div className="flex items-center gap-2">
          <span className="text-brand-cyan font-bold text-lg tracking-tight">LinkFlow</span>
          <span className="text-xs font-semibold text-brand-muted px-1.5 py-0.5 rounded-md
                           bg-brand-cyan/10 border border-brand-cyan/20">AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-brand-muted">
          <Link href="/#how-it-works" className="hover:text-brand-text transition-colors">How it works</Link>
          <Link href="/platforms" className="hover:text-brand-text transition-colors">Platforms</Link>
          <Link href="/pricing" className="hover:text-brand-text transition-colors">Pricing</Link>
          <Link href="/api-docs" className="hover:text-brand-text transition-colors">API</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="btn-secondary text-xs px-4 py-2">Sign in</Link>
          <Link href="/dashboard" className="btn-primary text-xs px-4 py-2">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] rounded-full
                        bg-brand-cyan/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full
                          bg-brand-cyan/10 border border-brand-cyan/20
                          text-xs font-semibold text-brand-cyan animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Powered by CrewAI + Playwright
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-text leading-[1.05]
                         tracking-tight mb-6 animate-fade-up delay-100">
            Your{' '}
            <span className="text-transparent bg-clip-text
                             bg-gradient-to-r from-brand-cyan to-cyan-300">
              24-Hour
            </span>
            <br />
            Backlink Engine
          </h1>

          <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10
                        leading-relaxed animate-fade-up delay-200">
            AI agents submit your backlinks to 50+ Web 2.0 platforms — automatically.
            Every deployment is verified with a{' '}
            <span className="text-brand-text font-semibold">full-page screenshot</span>
            {' '}so you always know it worked.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16
                          animate-fade-up delay-300">
            <Link href="/dashboard" className="btn-primary text-base px-8 py-4">
              Deploy My First Backlink →
            </Link>
            <Link href="/platforms" className="btn-secondary text-base px-8 py-4">
              View 50+ Platforms
            </Link>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto
                          animate-fade-up delay-400">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <p className="text-2xl font-extrabold text-brand-cyan mb-1">{stat.value}</p>
                <p className="text-xs text-brand-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-brand-cyan tracking-widest uppercase mb-3">Process</p>
            <h2 className="section-heading">From form to live link in 3 steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="glass-card p-6 flex flex-col gap-4">
                <span className="text-4xl font-extrabold text-brand-border">{step.step}</span>
                <h3 className="text-lg font-bold text-brand-text">{step.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-brand-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-brand-cyan tracking-widest uppercase mb-3">Features</p>
            <h2 className="section-heading">Built for serious link builders</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 flex flex-col gap-3">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-base font-bold text-brand-text">{f.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-brand-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text mb-4 relative">
              Start with 1 free backlink.
            </h2>
            <p className="text-brand-muted mb-8 relative">
              No credit card required. Sign in with GitHub or Google and your first
              backlink deployment is on us.
            </p>
            <Link href="/dashboard" className="btn-primary text-base px-10 py-4 relative">
              Deploy Free Backlink →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-border px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-brand-muted">LinkFlow AI</span>
          <div className="flex items-center gap-6 text-xs text-brand-muted">
            <Link href="/platforms" className="hover:text-brand-text transition-colors">Platforms</Link>
            <Link href="/pricing" className="hover:text-brand-text transition-colors">Pricing</Link>
            <Link href="/api-docs" className="hover:text-brand-text transition-colors">API Docs</Link>
          </div>
          <span className="text-xs text-brand-muted">
            © {new Date().getFullYear()} LinkFlow AI. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  )
}


