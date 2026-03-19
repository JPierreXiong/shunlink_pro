import { MetadataRoute } from 'next';
import { envConfigs } from '@/config';

const LAST_MODIFIED_HIGH = new Date('2026-03-15');
const LAST_MODIFIED_LEGAL = new Date('2026-01-01');

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = envConfigs.app_url || 'https://www.soloboard.app';
  const locales = ['en', 'zh', 'fr'];

  // Priority and frequency config per route
  const routeConfig: Record<string, { priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; lastModified: Date }> = {
    '':                  { priority: 1.0, changeFrequency: 'weekly',  lastModified: LAST_MODIFIED_HIGH },
    '/pricing':          { priority: 0.9, changeFrequency: 'weekly',  lastModified: LAST_MODIFIED_HIGH },
    '/soloboard':        { priority: 0.9, changeFrequency: 'weekly',  lastModified: LAST_MODIFIED_HIGH },
    '/faq':              { priority: 0.8, changeFrequency: 'monthly', lastModified: LAST_MODIFIED_HIGH },
    '/blog':             { priority: 0.8, changeFrequency: 'daily',   lastModified: LAST_MODIFIED_HIGH },
    '/about':            { priority: 0.7, changeFrequency: 'monthly', lastModified: LAST_MODIFIED_HIGH },
    '/contact':          { priority: 0.7, changeFrequency: 'monthly', lastModified: LAST_MODIFIED_HIGH },
    '/privacy-policy':   { priority: 0.3, changeFrequency: 'yearly',  lastModified: LAST_MODIFIED_LEGAL },
    '/terms-of-service': { priority: 0.3, changeFrequency: 'yearly',  lastModified: LAST_MODIFIED_LEGAL },
    '/disclaimer':       { priority: 0.3, changeFrequency: 'yearly',  lastModified: LAST_MODIFIED_LEGAL },
  };

  const sitemapEntries: MetadataRoute.Sitemap = [];

  Object.entries(routeConfig).forEach(([route, config]) => {
    // Build hreflang alternates for this route
    const alternates: Record<string, string> = { 'x-default': `${baseUrl}${route || '/'}` };
    locales.forEach((loc) => {
      const locPath = loc === 'en' ? `${baseUrl}${route || '/'}` : `${baseUrl}/${loc}${route}`;
      alternates[loc === 'zh' ? 'zh-CN' : loc === 'fr' ? 'fr-FR' : 'en-US'] = locPath;
    });

    // Add one entry per locale
    locales.forEach((locale) => {
      const url = locale === 'en'
        ? `${baseUrl}${route || '/'}`
        : `${baseUrl}/${locale}${route}`;

      sitemapEntries.push({
        url,
        lastModified: config.lastModified,
        changeFrequency: config.changeFrequency,
        priority: locale === 'en' ? config.priority : Math.max(config.priority - 0.1, 0.1),
        alternates: {
          languages: alternates,
        },
      } as any);
    });
  });

  return sitemapEntries;
}
