'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100 pointer-events-none" />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold text-brand-cyan">LinkFlow</span>
            <span className="text-xs font-semibold text-brand-muted px-1.5 py-0.5 rounded-md
                             bg-brand-cyan/10 border border-brand-cyan/20">AI</span>
          </Link>
          <p className="text-brand-muted text-sm mt-2">Sign in to start deploying backlinks</p>
        </div>

        <div className="glass-card p-8 flex flex-col gap-4">
          <div className="glass-card p-3 flex items-center gap-2 border-brand-green/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            <p className="text-xs text-brand-green">
              <strong>1 free credit</strong> on sign-up — no card required
            </p>
          </div>

          <button
            onClick={() => handleSignIn('github')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                       bg-brand-surface border border-brand-border text-brand-text font-semibold text-sm
                       hover:border-brand-cyan hover:text-brand-cyan
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
          </button>

          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                       bg-brand-surface border border-brand-border text-brand-text font-semibold text-sm
                       hover:border-brand-cyan hover:text-brand-cyan
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p className="text-xs text-brand-muted text-center mt-2">
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </main>
  )
}


