/**
 * SoloBoard - Website Monitoring Dashboard
 * 
 * Uses ShipAny standard layout (Header + Hero + Footer)
 * Core principle: Don't change ShipAny structure
 */

import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/core/auth';
import { envConfigs } from '@/config';
import { defaultLocale } from '@/config/locale';
import { SoloBoardDashboard } from './_components/dashboard-dashboard';
import { BreadcrumbSchema } from '@/shared/components/seo/breadcrumb-schema';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('common.dashboard.page');

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical:
        locale !== defaultLocale
          ? `${envConfigs.app_url}/${locale}/dashboard`
          : `${envConfigs.app_url}/dashboard`,
    },
  };
}

export default async function SoloBoardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 🔒 检查用户登录状态
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  // 未登录用户重定向到登录页
  if (!session?.user) {
    redirect(`/${locale}/sign-in?callbackUrl=/${locale}/dashboard`);
  }
  
  // Prepare breadcrumb data for SEO
  const breadcrumbs = [
    { 
      name: 'Home', 
      url: locale === defaultLocale 
        ? `${envConfigs.app_url}` 
        : `${envConfigs.app_url}/${locale}` 
    },
    { 
      name: 'Dashboard', 
      url: locale === defaultLocale 
        ? `${envConfigs.app_url}/dashboard` 
        : `${envConfigs.app_url}/${locale}/dashboard` 
    },
  ];
  
  return (
    <>
      {/* Add Breadcrumb Schema for SEO */}
      <BreadcrumbSchema items={breadcrumbs} />
      
      {/* Main dashboard content */}
      <SoloBoardDashboard />
    </>
  );
}
