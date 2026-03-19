import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import { getThemePage } from '@/core/theme';
import { Landing } from '@/shared/types/blocks/landing';
import { envConfigs } from '@/config';
import { FAQSchema } from '@/shared/components/seo/faq-schema';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const title = "SoloBoard - Monitor All Your Websites in One Dashboard";
  const description = "Track GA4 analytics, Stripe/Creem revenue, and uptime for up to 10 websites in a single dashboard. Built for solo entrepreneurs. Free plan available.";
  const url = locale === 'en' 
    ? 'https://www.soloboard.app' 
    : `https://www.soloboard.app/${locale}`;

  return {
    title,
    description,
    keywords: [
      'website monitoring dashboard',
      'GA4 analytics',
      'Stripe revenue tracking',
      'uptime monitoring',
      'solo entrepreneur tools',
      'multi-site dashboard',
      'website analytics',
      'SaaS monitoring',
      'revenue tracking software',
      'website uptime monitoring'
    ],
    authors: [{ name: 'SoloBoard' }],
    creator: 'SoloBoard',
    publisher: 'SoloBoard',
    alternates: {
      canonical: url,
      languages: {
        'en': 'https://www.soloboard.app',
        'zh': 'https://www.soloboard.app/zh',
        'fr': 'https://www.soloboard.app/fr',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: url,
      title: title,
      description: description,
      siteName: 'SoloBoard',
      images: [
        {
          url: `${envConfigs.app_url}/api/og?title=Monitor All Your Websites&subtitle=in One Dashboard&page=home`,
          width: 1200,
          height: 630,
          alt: 'SoloBoard Dashboard Preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [`${envConfigs.app_url}/api/og?title=Monitor All Your Websites&subtitle=in One Dashboard&page=home`],
      creator: '@soloboard',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
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

  // 🎯 P1: 已登录用户直接进入 Dashboard
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (session?.user) {
    redirect(`/${locale}/soloboard`);
  }

  // load page data
  const t = await getTranslations('landing');

  // build page params
  const heroData = t.raw('hero');
  const howItWorksData = t.raw('how-it-works');
  const featuresData = t.raw('features');
  const subscribeData = t.raw('subscribe');
  const faqData = t.raw('faq');
  const ctaData = t.raw('cta');

  const page: Landing = {
    hero: heroData ? {
      ...heroData,
      // 关闭可能导致误会的"后台截图"图片，符合 Creem 合规要求
      image: undefined,
      image_invert: undefined,
      // 确保不显示虚假用户头像
      show_avatars: false,
    } : undefined,
    // 明确设为 undefined 阻止 UI 渲染
    logos: undefined,
    introduce: undefined,
    benefits: undefined,
    usage: undefined,
    stats: undefined,
    
    // SoloBoard: 显示功能区块
    'how-it-works': howItWorksData || undefined,
    features: featuresData || undefined,
    
    // 隐藏用户评价
    testimonials: undefined,
    
    // 可选保留的区块
    subscribe: subscribeData || undefined,
    faq: faqData || undefined,
    cta: ctaData || undefined,
  };

  // load page component
  const Page = await getThemePage('landing');

  // Prepare FAQ data for Schema
  const faqs = faqData?.items?.map((item: any) => ({
    question: item.question,
    answer: item.answer,
  })) || [];

  return (
    <>
      {/* Add FAQ Schema for SEO */}
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      
      {/* Main page content */}
      <Page locale={locale} page={page} />
    </>
  );
}
