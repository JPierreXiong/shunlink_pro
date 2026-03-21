/**
 * PageBreadcrumb — universal breadcrumb for sub-pages.
 * Renders both the visible UI nav and the BreadcrumbList JSON-LD schema.
 *
 * Usage:
 *   <PageBreadcrumb locale={locale} items={[
 *     { name: 'Pricing', href: '/pricing' },
 *   ]} />
 */

import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { BreadcrumbSchema } from '@/shared/components/seo/breadcrumb-schema';
import { envConfigs } from '@/config';

const APP_URL = 'https://www.linkflowai.app';

interface BreadcrumbStep {
  name: string;
  href: string; // relative path, e.g. '/pricing'
}

interface PageBreadcrumbProps {
  locale: string;
  items: BreadcrumbStep[];
  homeLabel?: string;
}

export function PageBreadcrumb({ locale, items, homeLabel = 'Home' }: PageBreadcrumbProps) {
  const base = envConfigs.app_url || APP_URL;
  const localePrefix = locale === 'en' ? '' : `/${locale}`;

  // Build schema items: Home + provided items
  const schemaItems = [
    { name: homeLabel, url: `${base}${localePrefix}/` },
    ...items.map((item) => ({
      name: item.name,
      url: `${base}${localePrefix}${item.href}`,
    })),
  ];

  return (
    <>
      <BreadcrumbSchema items={schemaItems} />
      <nav className="container mx-auto px-4 pt-6 pb-2 max-w-5xl" aria-label="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            {/* Home */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`${localePrefix}/`}>{homeLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {items.map((item, idx) => {
              const isLast = idx === items.length - 1;
              return (
                <span key={item.href} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={`${localePrefix}${item.href}`}>{item.name}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
    </>
  );
}




