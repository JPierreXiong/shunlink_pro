import type { Metadata } from 'next'
import { Syne } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LinkFlow AI — 24-Hour Automated Backlink Engine',
    template: '%s | LinkFlow AI',
  },
  description:
    'Your 24-Hour Automated Backlink Deployment Engine. AI-powered backlink submission with transparent screenshot proof. Deploy links to 50+ Web 2.0 platforms automatically.',
  keywords: [
    'backlink automation',
    'SEO tool',
    'AI backlinks',
    'link building',
    'Web 2.0 backlinks',
    '24 hour delivery',
  ],
  openGraph: {
    title: 'LinkFlow AI — 24-Hour Automated Backlink Engine',
    description: 'AI-powered backlink submission with screenshot proof. 24h delivery guarantee.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={syne.variable}>
      <body className="font-sans bg-brand-bg text-brand-text antialiased">
        {children}
      </body>
    </html>
  )
}


