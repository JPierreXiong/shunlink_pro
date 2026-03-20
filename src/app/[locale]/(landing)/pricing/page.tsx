import { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';
import {
  FAQ as FAQType,
  Testimonials as TestimonialsType,
} from '@/shared/types/blocks/landing';
import { Pricing as PricingType } from '@/shared/types/blocks/pricing';
import { ProductSchema } from '@/shared/components/seo/product-schema';
import { PageBreadcrumb } from '@/shared/components/seo/page-breadcrumb';
import { envConfigs } from '@/config';

const APP_URL = 'https://www.linkflowai.app';

// ── Per-plan FAQ for SERP Real Estate ──────────────────────────────────────
const PLAN_FAQS = [
  {
    '@type': 'Question',
    name: 'What do I get with the Trial plan for $5?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'The $5 Trial gives you 3 backlink credits — enough to deploy 3 contextual backlinks across high-authority platforms. Every submission includes a live URL and a screenshot proof. No subscription commitment.',
    },
  },
  {
    '@type': 'Question',
    name: 'What is included in the Starter plan?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'The Starter plan includes 15 backlink credits per month, 48-hour delivery guarantee, full anchor text control, and screenshot proof for every placement. Billed monthly at $29.',
    },
  },
  {
    '@type': 'Question',
    name: 'What extra features does the Pro plan offer?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'The Pro plan includes 50 credits per month, priority deployment queue, access to premium DA 70+ platforms, API access for workflow automation, and a dedicated account manager. Billed monthly at $79.',
    },
  },
  {
    '@type': 'Question',
    name: 'Can I get a refund if a backlink task fails?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Yes. Credits are only consumed on successful submissions with live proof. If a task fails due to platform downtime or a technical issue on our end, your credit is automatically refunded immediately.',
    },
  },
  {
    '@type': 'Question',
    name: 'Is there a free trial before purchasing a plan?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Yes. Every new account receives 1 free credit on signup — no credit card required — so you can test a real backlink deployment and see the screenshot proof before committing to any plan.',
    },
  },
];

const planFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PLAN_FAQS,
};

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  const isFr = locale === 'fr';

  const title = isZh
    ? '实惠的 AI 外链套餐 | 48 小时交付 + 截图证明 — LinkFlow AI'
    : isFr
      ? 'Plans Backlinks IA Abordables | Livraison 48h + Preuve — LinkFlow AI'
      : 'Affordable AI Backlink Plans | 48-Hour Delivery & Proof — LinkFlow AI';

  // Keep description ≤ 155 chars with CTA
  const description = isZh
    ? 'LinkFlow AI 提供 $5 起的外链套餐，48 小时内交付，每条附截图证明。注册即送 1 个免费积分，无需信用卡。'
    : isFr
      ? "Déployez des backlinks IA dès $5 en 48h avec preuve par capture d'écran. Commencez avec 1 crédit gratuit — sans carte de crédit."
      : 'Deploy AI backlinks from $5. 48-hour delivery with screenshot proof on every link. Start with 1 free credit — no credit card needed.';

  const url =
    locale === 'en'
      ? `${APP_URL}/pricing`
      : `${APP_URL}/${locale}/pricing`;

  const keywords = isZh
    ? 'AI外链套餐,外链价格,自动化外链,截图证明外链'
    : isFr
      ? 'plans backlinks IA,prix backlinks,automatisation SEO'
      : 'AI backlink plans,backlink service pricing,automated link building cost,buy backlinks with proof,48 hour backlink delivery';

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        'en-US': `${APP_URL}/pricing`,
        'zh-CN': `${APP_URL}/zh/pricing`,
        'fr-FR': `${APP_URL}/fr/pricing`,
        'x-default': `${APP_URL}/pricing`,
      },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'LinkFlow AI',
      images: [
        {
          url: `${envConfigs.app_url || APP_URL}/api/og?title=AI+Backlink+Plans&subtitle=48-Hour+Delivery+%2B+Proof`,
          width: 1200,
          height: 630,
          alt: 'LinkFlow AI Pricing',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@linkflowai',
      site: '@linkflowai',
    },
    robots: { index: true, follow: true },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tl = await getTranslations('landing');
  const t = await getTranslations('pricing');

  let currentSubscription;
  try {
    const user = await getUserInfo();
    if (user) currentSubscription = await getCurrentSubscription(user.id);
  } catch (error) {
    console.log('getting current subscription failed:', error);
  }

  const Page = await getThemePage('pricing');
  const pricing: PricingType = t.raw('pricing');
  const faq: FAQType = tl.raw('faq');
  const testimonials: TestimonialsType | null = null;

  const breadcrumbLabel =
    locale === 'zh' ? '价格方案' : locale === 'fr' ? 'Tarifs' : 'Pricing';

  return (
    <>
      {/* Plan-level FAQ Schema for SERP real estate */}
      <Script
        id="pricing-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(planFaqSchema) }}
      />

      {/* Product / offer schema */}
      <ProductSchema />

      {/* Breadcrumb nav + JSON-LD */}
      <PageBreadcrumb
        locale={locale}
        items={[{ name: breadcrumbLabel, href: '/pricing' }]}
      />

      {/* Main pricing page content */}
      <Page
        locale={locale}
        pricing={pricing}
        currentSubscription={currentSubscription}
        faq={faq}
        testimonials={testimonials}
      />
    </>
  );
}
