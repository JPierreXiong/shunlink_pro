import { redirect } from 'next/navigation';

/**
 * Media Tasks Page - Redirected to dashboard
 * 
 * The old media task history page now routes users to dashboard.
 */
export default async function MediaTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Redirect to dashboard
  redirect(`/${locale}/dashboard`);
}


