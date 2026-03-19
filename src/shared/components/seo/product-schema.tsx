/**
 * Product Schema for SoloBoard Pricing
 * Helps Google display pricing information in search results
 */

export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SoloBoard',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'Website monitoring dashboard for solo entrepreneurs. Track GA4 analytics, payment revenue, and uptime status for multiple websites in one place.',
    url: 'https://www.soloboard.app',
    image: 'https://www.soloboard.app/logo.png',
    screenshot: 'https://www.soloboard.app/og-image.png',
    author: {
      '@type': 'Organization',
      name: 'SoloBoard',
      url: 'https://www.soloboard.app',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        description: '3 websites, sync every 48 hours',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://www.soloboard.app/pricing',
      },
      {
        '@type': 'Offer',
        name: 'Base Plan',
        description: '5 websites, sync every 6 hours',
        price: '19.90',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://www.soloboard.app/pricing',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        description: '10 websites, sync every 60 minutes',
        price: '39.90',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://www.soloboard.app/pricing',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'GA4 Analytics Integration',
      'Stripe Revenue Tracking',
      'Uptime Monitoring',
      '9-Grid Dashboard Layout',
      'Multi-site Management',
      'Real-time Data Sync',
      'Historical Data & Trends',
      'Secure API Key Encryption',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


