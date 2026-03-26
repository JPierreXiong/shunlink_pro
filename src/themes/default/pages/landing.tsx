import Script from 'next/script';

import { envConfigs } from '@/config';
import { Landing } from '@/shared/types/blocks/landing';
import {
  CTA,
  FAQ,
  Features,
  Hero,
} from '@/themes/default/blocks';

export default async function LandingPage({
  locale,
  page,
}: {
  locale?: string;
  page: Landing;
}) {
  // JSON-LD structured data for SEO
  const appUrl = envConfigs.app_url || 'https://www.linkflowai.app';

  // SoftwareApplication JSON-LD
  const jsonLdSoftware = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LinkFlow AI',
    description:
      'AI-powered backlink deployment platform. Deploy AI agents to secure high-authority backlinks in 48 hours with live URL and screenshot proof. No manual outreach needed.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI-powered backlink deployment',
      '48-hour delivery guarantee',
      'Screenshot proof for every link',
      'DA 50+ platform library',
      'Human-like AI agents',
      'Credit-based system',
    ],
    url: appUrl,
  };

  // FAQPage JSON-LD (if FAQ exists)
  const jsonLdFAQ = page.faq?.items
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.question || '',
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer || '',
          },
        })),
      }
    : null;

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <Script
        id="json-ld-software-application"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      
      {/* FAQPage JSON-LD structured data */}
      {jsonLdFAQ && (
        <Script
          id="json-ld-faq-page"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 pt-6 pb-10 md:pt-10 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.26)]">
          <div
            aria-hidden
            className="mx-auto h-px w-[min(92%,920px)] bg-gradient-to-r from-transparent via-white/24 to-transparent"
          />
          {page.hero && <Hero hero={page.hero} />}

          {/* 功能区全部写在 Hero 下方，保留 Header / Hero / Footer 结构 */}
          {page['how-it-works'] && (
            <Features
              features={page['how-it-works']}
              className="rounded-none border-x-0 border-t border-white/10 bg-transparent"
            />
          )}

          {page.features && (
            <Features
              features={page.features}
              className="rounded-none border-x-0 border-t border-white/10 bg-transparent"
            />
          )}

          {page.faq && (
            <FAQ
              faq={page.faq}
              className="rounded-none border-x-0 border-t border-white/10 bg-transparent"
            />
          )}

          {page.cta && (
            <CTA
              cta={page.cta}
              className="rounded-none border-x-0 border-t border-white/10 bg-transparent"
            />
          )}
        </div>
      </div>
    </>
  );
}
