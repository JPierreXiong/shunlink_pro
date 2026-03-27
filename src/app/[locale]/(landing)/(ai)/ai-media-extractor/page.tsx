import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

/**
 * AI Media Extractor Page - Redirected to dashboard
 * 
 * The old media extraction page now routes users to dashboard.
 */
export default async function AiMediaExtractorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to dashboard
  redirect(`/${locale}/dashboard`);
}







