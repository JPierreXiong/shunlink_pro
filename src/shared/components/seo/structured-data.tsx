/**
 * SEO Structured Data (JSON-LD)
 * Provides structured data for search engines to enhance SEO
 */

import { envConfigs } from '@/config';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'product' | 'article' | 'breadcrumb';
  data?: any;
}

function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = envConfigs.app_url || 'https://www.linkflowai.app';
  const appName = envConfigs.app_name || 'LinkFlow AI';

  let structuredData: Record<string, any> = {};

  switch (type) {
    case 'website':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: appName,
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };
      break;

    case 'organization':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: appName,
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          url: `${baseUrl}/contact`,
        },
      };
      break;

    case 'product':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: data?.name || appName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data?.price || '0',
          priceCurrency: 'USD',
        },
        aggregateRating: data?.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: data.rating.value,
              reviewCount: data.rating.count,
            }
          : undefined,
      };
      break;

    case 'article':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data?.title,
        description: data?.description,
        image: data?.image || `${baseUrl}/logo.png`,
        datePublished: data?.publishedAt,
        dateModified: data?.updatedAt || data?.publishedAt,
        author: {
          '@type': 'Organization',
          name: appName,
        },
        publisher: {
          '@type': 'Organization',
          name: appName,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
          },
        },
      };
      break;

    case 'breadcrumb':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data?.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${baseUrl}${item.url}`,
        })),
      };
      break;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.linkflowai.app';
  const appName = envConfigs.app_name || 'LinkFlow AI';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appName,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.linkflowai.app';
  const appName = envConfigs.app_name || 'LinkFlow AI';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appName,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@linkflowai.app',
      url: `${baseUrl}/contact`,
      availableLanguage: ['English', 'Chinese', 'French'],
    },
    description: 'LinkFlow AI is an AI-powered backlink deployment platform. Deploy AI agents to secure high-authority backlinks in 48 hours with live URL and screenshot proof.',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function SoftwareAppStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.linkflowai.app';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LinkFlow AI',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'AI-powered backlink deployment platform. Deploy AI agents to secure high-authority backlinks in 48 hours. Every submission comes with a live URL and screenshot proof. No manual outreach needed.',
    featureList: [
      'AI Backlink Deployment',
      '48-Hour Delivery Guarantee',
      'Real-time Screenshot Proof',
      'DA 50+ Platform Library',
      'Human-Like CrewAI Agents',
      'Full Anchor Text Control',
      'Automatic Credit Refund on Failure',
      'Privacy-First OAuth Signup',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: '1 free credit on signup — no credit card required',
      },
      {
        '@type': 'Offer',
        name: 'Base Plan',
        price: '19.9',
        priceCurrency: 'USD',
        description: '100 credits/month — 48-hour delivery with screenshot proof',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '39.9',
        priceCurrency: 'USD',
        description: '500 credits/month — priority queue, API access, unlimited history',
      },
    ],
    screenshot: `${baseUrl}/imgs/features/admin.png`,
    publisher: {
      '@type': 'Organization',
      name: 'LinkFlow AI',
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ProductStructuredData(props: {
  name?: string;
  price?: string;
  rating?: { value: number; count: number };
}) {
  return <StructuredData type="product" data={props} />;
}

export function ArticleStructuredData(props: {
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return <StructuredData type="article" data={props} />;
}

export function BreadcrumbStructuredData(props: {
  items: Array<{ name: string; url: string }>;
}) {
  return <StructuredData type="breadcrumb" data={props} />;
}
