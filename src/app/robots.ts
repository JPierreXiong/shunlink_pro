import { MetadataRoute } from 'next';
import { envConfigs } from '@/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = envConfigs.app_url || 'https://www.linkflowai.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/settings',
          '/activity',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}













