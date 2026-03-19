import { getTranslations, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import { getThemePage } from '@/core/theme';
import { Landing } from '@/shared/types/blocks/landing';
import { envConfigs } from '@/config';
import { FAQSchema } from '@/shared/components/seo/faq-schema';

const APP_URL = 'https://www.linkflowai.app';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  const title = isZh
    ? 'LinkFlow AI — AI 驱动的外链自动化部署平台'
    : isFr
      ? 'LinkFlow AI — Déploiement Automatisé de Backlinks par IA'
      : 'LinkFlow AI — AI Backlink Automation with Screenshot Proof';

  const description = isZh
    ? 'AI 智能体 48 小时内在高权重网站部署外链，每条均附带实时截图证明。无需手动外联，注册即送 1 个免费积分。'
    : isFr
      ? "Déployez des agents IA pour obtenir des backlinks haute autorité en 48h. Chaque soumission inclut une URL en direct et une preuve par capture d'écran. 1 crédit gratuit à l'inscription."
      : 'Deploy AI agents to secure high-authority backlinks in 48 hours. Every submission comes with a live URL and screenshot proof. No manual outreach — 1 free credit on signup.';

  const keywords = isZh
    ? ['AI外链自动化', '自动化外链建设', '外链部署证明', 'AI外链工具', '高权重外链', '自动化SEO', '截图证明外链']
    : isFr
      ? ['automatisation backlinks IA', 'backlinks haute autorité', 'preuve capture écran backlink', 'service SEO automatisé', 'agent IA SEO']
      : [
          'AI backlink automation',
          'automated link building with proof',
          'AI backlink builder',
          'transparent backlink service',
          'automated SEO outreach',
          'buy backlinks with screenshot proof',
          'AI agents for link building',
          'safe SEO automation for SaaS',
          'domain authority boost',
          'high-quality link placement',
          'natural backlink profile',
          '48 hour backlink delivery',
        ];

  const url = locale === 'en'
    ? APP_URL
    : `${APP_URL}/${locale}`;

  const ogImageUrl = `${envConfigs.app_url || APP_URL}/api/og?title=Backlinks+on+Autopilot&subtitle=Proof+in+Every+Post`;

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'LinkFlow AI' }],
    creator: 'LinkFlow AI',
    publisher: 'LinkFlow AI',
    alternates: {
      canonical: url,
      languages: {
        'en-US': APP_URL,
        'zh-CN': `${APP_URL}/zh`,
        'fr-FR': `${APP_URL}/fr`,
        'x-default': APP_URL,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'fr' ? 'fr_FR' : 'en_US',
      url,
      title,
      description,
      siteName: 'LinkFlow AI',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'LinkFlow AI — AI Backlink Deployment Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: '@linkflowai',
      site: '@linkflowai',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect logged-in users to dashboard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    const { redirect } = await import('next/navigation');
    redirect(`/${locale}/dashboard/tasks`);
  }

  const t = await getTranslations('landing');

  const heroData = t.raw('hero');
  const howItWorksData = t.raw('how-it-works');
  const featuresData = t.raw('features');
  const subscribeData = t.raw('subscribe');
  const faqData = t.raw('faq');
  const ctaData = t.raw('cta');

  const page: Landing = {
    hero: heroData
      ? {
          ...heroData,
          image: undefined,
          image_invert: undefined,
          show_avatars: false,
        }
      : undefined,
    logos: undefined,
    introduce: undefined,
    benefits: undefined,
    usage: undefined,
    stats: undefined,
    'how-it-works': howItWorksData || undefined,
    features: featuresData || undefined,
    testimonials: undefined,
    subscribe: subscribeData || undefined,
    faq: faqData || undefined,
    cta: ctaData || undefined,
  };

  const Page = await getThemePage('landing');

  const faqs =
    faqData?.items?.map((item: any) => ({
      question: item.question,
      answer: item.answer,
    })) || [];

  return (
    <>
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      <Page locale={locale} page={page} />
    </>
  );
}
