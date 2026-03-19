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

      {page.hero && <Hero hero={page.hero} />}
      
      {/* How It Works Section */}
      {page['how-it-works'] && <Features features={page['how-it-works']} className="bg-muted" />}

      {/* Features Section */}
      {page['features'] && <Features features={page['features']} />}
      
      {page.faq && <FAQ faq={page.faq} />}
      {page.cta && <CTA cta={page.cta} className="bg-muted" />}
    </>
  );
}
