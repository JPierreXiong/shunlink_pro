import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ExternalLink, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Supported SEO Platforms | LinkFlow AI',
  description: 'LinkFlow AI supports 10+ high-authority platforms for automated backlink deployment. View success rates and platform details.',
  openGraph: {
    title: 'Supported SEO Platforms | LinkFlow AI',
    description: 'AI-powered backlink deployment across Blogger, Reddit, Medium, WordPress and more.',
  },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const SENSITIVITY_LABELS: Record<string, string> = {
  low: '🟢 Low Risk',
  medium: '🟡 Medium Risk',
  high: '🔴 High Risk',
};

async function getPlatforms() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
    const res = await fetch(`${baseUrl}/api/backlink/platforms`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.platforms || [];
  } catch {
    return [];
  }
}

export default async function PlatformsPage() {
  const platforms = await getPlatforms();

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
            <CheckCircle size={12} />
            {platforms.length || '10'}+ Verified Platforms
          </div>
          <h1
            className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Where Your Links<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Go Live
            </span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-lg">
            Our AI agents deploy contextual backlinks across high-authority platforms.
            Every submission comes with a live URL and screenshot proof.
          </p>
        </div>

        {/* Platform grid */}
        {platforms.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <p>Platform data is loading. Run the seed script to populate platforms.</p>
            <code className="text-xs mt-2 block font-mono">npx tsx scripts/seed-backlink-platforms.ts</code>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {platforms.map((p: any) => (
              <div
                key={p.id}
                className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{p.description}</p>
                  </div>
                  {p.homeUrl && (
                    <a
                      href={p.homeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/20 hover:text-white/50 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* Success rate bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">Success Rate</span>
                    <span className="text-cyan-400 font-semibold">{p.successRate}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${p.successRate}%` }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {p.difficulty && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      DIFFICULTY_COLORS[p.difficulty] || DIFFICULTY_COLORS.medium
                    }`}>
                      {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
                    </span>
                  )}
                  {p.sensitivity && (
                    <span className="text-[10px] text-white/30">
                      {SENSITIVITY_LABELS[p.sensitivity] || p.sensitivity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 text-center p-8 bg-white/3 border border-white/8 rounded-2xl">
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to deploy your first backlink?
          </h2>
          <p className="text-white/40 mb-6 text-sm">
            Get 1 free credit on signup. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 24px rgba(6,182,212,0.3)' }}
          >
            <Zap size={15} /> Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}






