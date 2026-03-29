import Link from 'next/link'

export const metadata = { title: 'Pricing' }

const PLANS = [
  {
    name: 'Starter',
    price: '$39',
    credits: 10,
    perLink: '$3.90',
    highlight: false,
    features: [
      '10 backlink deployments',
      '50+ Web 2.0 platforms',
      'Screenshot proof for each',
      '48-hour SLA guarantee',
      'Auto-retry on failure',
      'Credits never expire',
    ],
    productEnv: 'CREEM_PRODUCT_10_CREDITS',
  },
  {
    name: 'Growth',
    price: '$89',
    credits: 25,
    perLink: '$3.56',
    highlight: true,
    features: [
      '25 backlink deployments',
      '50+ Web 2.0 platforms',
      'Screenshot proof for each',
      '48-hour SLA guarantee',
      'Auto-retry on failure',
      'Credits never expire',
      'Priority queue processing',
    ],
    productEnv: 'CREEM_PRODUCT_25_CREDITS',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4
                         bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <Link href="/" className="text-brand-cyan font-bold text-lg tracking-tight">LinkFlow AI</Link>
        <Link href="/dashboard" className="btn-primary text-xs px-4 py-2">Dashboard →</Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-brand-cyan tracking-widest uppercase mb-3">Pricing</p>
          <h1 className="section-heading mb-4">Simple credit-based pricing</h1>
          <p className="text-brand-muted max-w-md mx-auto">
            1 credit = 1 backlink deployment. Credits never expire.
            Failed deployments are automatically refunded.
          </p>
        </div>

        {/* Free tier note */}
        <div className="glass-card p-4 flex items-center gap-3 mb-8 border-brand-green/30">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green shrink-0"></span>
          <p className="text-sm text-brand-text">
            <span className="font-bold text-brand-green">Free tier:</span>{' '}
            Every new account gets <strong>1 free credit</strong> on sign-up — no credit card needed.
            Sign in with GitHub or Google to claim yours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card p-8 flex flex-col gap-6 relative overflow-hidden ${
                plan.highlight ? 'ring-1 ring-brand-cyan shadow-glow-cyan' : ''
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0">
                  <span className="block bg-brand-cyan text-brand-bg text-xs font-bold
                                   px-3 py-1 rounded-bl-xl">
                    BEST VALUE
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-brand-muted uppercase tracking-widest mb-2">
                  {plan.name}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-brand-text">{plan.price}</span>
                  <span className="text-brand-muted mb-1">one-time</span>
                </div>
                <p className="text-sm text-brand-muted mt-1">
                  {plan.credits} credits · {plan.perLink} per link
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-brand-text">
                    <span className="text-brand-cyan shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard"
                className={plan.highlight ? 'btn-primary text-center' : 'btn-secondary text-center'}
              >
                Get {plan.credits} Credits →
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-brand-text mb-6">Frequently asked questions</h3>
          <div className="flex flex-col gap-5">
            {[
              ['What happens if a deployment fails?', 'Your credit is automatically refunded after 3 failed retry attempts. Zero risk.'],
              ['Do credits expire?', 'No. Credits never expire. Buy them whenever you need them.'],
              ['What platforms are supported?', 'We support 50+ Web 2.0 blogs, social sites, and forums. See the full list on our Platforms page.'],
              ['What if a site requires 2FA?', 'The AI pauses and notifies you in your dashboard. Enter the code, and the agent continues automatically.'],
            ].map(([q, a]) => (
              <div key={q} className="border-t border-brand-border pt-5 first:border-0 first:pt-0">
                <p className="font-semibold text-brand-text text-sm mb-1.5">{q}</p>
                <p className="text-sm text-brand-muted">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}


