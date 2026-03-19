import { Metadata } from 'next';
import { Bot, Shield, Zap } from 'lucide-react';
import Script from 'next/script';
import { envConfigs } from '@/config';

const APP_URL = 'https://www.linkflowai.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  const title = isZh
    ? 'LinkFlow AI 是什么 — AI 驱动的外链自动化部署平台'
    : isFr
      ? 'À propos de LinkFlow AI — Plateforme de Déploiement de Backlinks par IA'
      : 'About LinkFlow AI — AI-Powered Backlink Deployment Platform';

  const description = isZh
    ? 'LinkFlow AI 由 SEO 老兵和 AI 工程师打造，使用 AI 智能体在 48 小时内自动部署高权重外链，每条均附带实时截图证明。'
    : isFr
      ? "LinkFlow AI est construit par des vétérans SEO et des ingénieurs IA. Déployez automatiquement des backlinks haute autorité en 48h avec preuve par capture d'écran."
      : 'LinkFlow AI is built by SEO veterans and AI engineers. We automate high-authority backlink deployment using AI agents — every submission comes with a live URL and screenshot proof.';

  const url = locale === 'en'
    ? `${APP_URL}/about`
    : `${APP_URL}/${locale}/about`;

  return {
    title,
    description,
    keywords: isZh
      ? 'LinkFlow AI介绍, AI外链工具, 自动化外链建设, 外链部署平台, 关于我们'
      : isFr
        ? 'à propos LinkFlow AI, automatisation backlinks, outil SEO IA'
        : 'about LinkFlow AI, AI backlink builder, automated link building, SEO automation platform',
    alternates: {
      canonical: url,
      languages: {
        'en-US': `${APP_URL}/about`,
        'zh-CN': `${APP_URL}/zh/about`,
        'fr-FR': `${APP_URL}/fr/about`,
      },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'LinkFlow AI',
      images: [{ url: `${APP_URL}/logo.png`, width: 1200, height: 630, alt: 'LinkFlow AI' }],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appUrl = envConfigs.app_url || APP_URL;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${appUrl}${locale === 'en' ? '' : `/${locale}`}/about` },
    ],
  };

  const values = [
    {
      title: 'Proof-First Delivery',
      description: 'Every backlink comes with a live URL and a cloud-hosted screenshot. No guesswork — transparent evidence for every credit spent.',
      icon: Shield,
    },
    {
      title: 'Human-Like AI Agents',
      description: 'Powered by CrewAI, our agents simulate authentic human interactions — mouse movements, scrolling, natural typing delays — staying invisible to search engine algorithms.',
      icon: Bot,
    },
    {
      title: '48-Hour Guarantee',
      description: 'From submission to live proof in under 48 hours. If the task fails due to platform downtime, your credit is automatically refunded. Zero risk.',
      icon: Zap,
    },
  ];

  return (
    <>
      <Script
        id="about-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Built for SEO Professionals. Powered by AI.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            LinkFlow AI was born from a simple problem: high-authority backlink outreach takes weeks and costs thousands. We automated it.
          </p>
        </div>

        {/* Story */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
          <p className="text-lg leading-relaxed">
            As SEO practitioners, we spent months manually reaching out to blog editors, waiting for approvals, and paying premium prices for guest posts — only to get no proof the link was ever live. We built LinkFlow AI to solve exactly that.
          </p>
          <p className="text-lg leading-relaxed mt-6">
            LinkFlow AI uses <strong>CrewAI-powered agents</strong> that mimic real human behavior to publish contextual backlinks on DA 50+ platforms — Blogger, Reddit, Medium, and more. Every task returns a <strong>Proof Report</strong> with the live URL and a high-resolution screenshot stored securely on the cloud.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Principles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-xl text-center mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-center">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">Built on Solid Foundations</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div><p className="font-semibold mb-2">Next.js 15</p><p className="text-sm text-muted-foreground">Lightning-fast performance</p></div>
            <div><p className="font-semibold mb-2">CrewAI Agents</p><p className="text-sm text-muted-foreground">Human-like automation</p></div>
            <div><p className="font-semibold mb-2">Neon PostgreSQL</p><p className="text-sm text-muted-foreground">Serverless database</p></div>
            <div><p className="font-semibold mb-2">Vercel Edge</p><p className="text-sm text-muted-foreground">Global CDN delivery</p></div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Start Deploying Backlinks Today</h2>
          <p className="text-muted-foreground mb-6">
            Join SEO professionals who trust LinkFlow AI for transparent, automated backlink deployment with proof.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/sign-up"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get 1 Free Credit
            </a>
            <a
              href="/platforms"
              className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
            >
              View Platforms
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
