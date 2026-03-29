import { prisma } from '@/lib/db'
import Link from 'next/link'

// Force dynamic rendering — this page queries the DB at request time,
// not at build time. Required for Docker / Vercel deployment.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Platform Library' }

const CATEGORY_COLORS: Record<string, string> = {
  Blog:   'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
  Web2:   'bg-brand-green/10 text-brand-green border-brand-green/20',
  Social: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
  Forum:  'bg-brand-red/10 text-brand-red border-brand-red/20',
  Web2_0: 'bg-brand-green/10 text-brand-green border-brand-green/20',
}

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { domainAuthority: 'desc' },
  })

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4
                         bg-brand-bg/80 backdrop-blur-md border-b border-brand-border">
        <Link href="/" className="text-brand-cyan font-bold text-lg tracking-tight">LinkFlow AI</Link>
        <Link href="/dashboard" className="btn-primary text-xs px-4 py-2">Dashboard →</Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-brand-cyan tracking-widest uppercase mb-3">Platform Library</p>
          <h1 className="section-heading mb-4">{platforms.length}+ Supported Platforms</h1>
          <p className="text-brand-muted max-w-xl mx-auto">
            Our AI agent knows how to navigate and submit content on all of these sites.
            More platforms are added weekly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platforms.map((p) => {
            const catKey = p.category.replace(/[^a-zA-Z0-9]/g, '_') as string
            const badgeClass = CATEGORY_COLORS[catKey] || CATEGORY_COLORS['Web2_0']
            return (
              <div key={p.id} className="glass-card p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt={p.siteName} className="w-8 h-8 rounded-lg object-contain bg-white p-1" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-brand-border flex items-center justify-center text-sm">🔗</div>
                    )}
                    <span className="font-semibold text-sm text-brand-text">{p.siteName}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {p.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <a href={p.baseUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand-muted hover:text-brand-cyan transition-colors truncate">
                    {p.baseUrl.replace(/^https?:\/\//, '')}
                  </a>
                  <span className="text-xs font-mono text-brand-cyan shrink-0">DA {p.domainAuthority}</span>
                </div>
              </div>
            )
          })}
        </div>

        {platforms.length === 0 && (
          <div className="text-center py-20 text-brand-muted">
            Platform list loading — run the seed SQL in shared/schema.sql first.
          </div>
        )}
      </div>
    </main>
  )
}


