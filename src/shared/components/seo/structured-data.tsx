/**
 * SEO Structured Data (JSON-LD)
 * 为搜索引擎提供结构化数据，增强 SEO 效果
 */

import { envConfigs } from '@/config';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'product' | 'article' | 'breadcrumb';
  data?: any;
}

function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';

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
        sameAs: [
          // Add your social media links here
          // 'https://twitter.com/yourhandle',
          // 'https://facebook.com/yourpage',
        ],
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

/**
 * 预设的结构化数据组件
 */
export function WebsiteStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';
  
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
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const appName = envConfigs.app_name || 'SoloBoard';
  
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
    sameAs: [
      'https://twitter.com/SoloBoardApp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@soloboard.app',
      url: `${baseUrl}/contact`,
      availableLanguage: ['English', 'Chinese', 'French'],
    },
    description: 'SoloBoard is a multi-site monitoring dashboard for solo entrepreneurs. Track GA4 analytics, Stripe & Creem revenue, and uptime for all your websites in one place.',
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function SoftwareAppStructuredData() {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SoloBoard',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'Multi-site monitoring dashboard for solo entrepreneurs. Track GA4 traffic, Stripe & Creem revenue, and uptime for up to 10 websites in one beautiful dashboard.',
    featureList: [
      'Google Analytics 4 (GA4) integration',
      'Stripe revenue tracking',
      'Creem payment monitoring',
      'Website uptime monitoring',
      'Multi-site dashboard (up to 10 sites)',
      'Real-time data sync',
      'Email alerts',
      'AES-256 encrypted API key storage',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Monitor 3 websites, 48-hour data sync',
      },
      {
        '@type': 'Offer',
        name: 'Base Plan',
        price: '19.9',
        priceCurrency: 'USD',
        description: 'Monitor 5 websites, 6-hour data sync',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '39.9',
        priceCurrency: 'USD',
        description: 'Monitor 10 websites, 60-minute real-time sync',
      },
    ],
    screenshot: `${baseUrl}/imgs/features/admin.png`,
    publisher: {
      '@type': 'Organization',
      name: 'SoloBoard',
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

