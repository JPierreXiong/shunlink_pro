/**
 * Product Schema for LinkFlow AI Pricing
 * Helps Google display pricing information in search results
 */

export function ProductSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LinkFlow AI',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description: 'AI-powered backlink deployment platform. Deploy AI agents to secure high-authority backlinks in 48 hours. Every submission comes with a live URL and screenshot proof.',
    url: 'https://www.linkflowai.app',
    image: 'https://www.linkflowai.app/logo.png',
    screenshot: 'https://www.linkflowai.app/imgs/features/admin.png',
    author: {
      '@type': 'Organization',
      name: 'LinkFlow AI',
      url: 'https://www.linkflowai.app',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        description: '1 free credit on signup — test AI backlink deployment with proof',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://www.linkflowai.app/pricing',
      },
      {
        '@type': 'Offer',
        name: 'Base Plan',
        description: '100 backlink credits/month — 48-hour delivery with screenshot proof',
        price: '19.90',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://www.linkflowai.app/pricing',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        description: '500 backlink credits/month — priority queue, API access, unlimited history',
        price: '39.90',
        priceCurrency: 'USD',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://www.linkflowai.app/pricing',
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
      'AI Backlink Deployment',
      '48-Hour Delivery Guarantee',
      'Real-time Screenshot Proof',
      'DA 50+ Platform Library',
      'Human-Like AI Agents (CrewAI)',
      'Full Anchor Text Control',
      'Automatic Credit Refund on Failure',
      'Privacy-First OAuth Signup',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
