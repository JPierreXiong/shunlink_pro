/**
 * SoloBoard - 多站点监控仪表盘
 * 
 * 九宫格布局，实时显示所有监控站点的关键指标
 * 
 * 核心原则：不改变 ShipAny 结构
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { SiteGrid } from './_components/site-grid';
import { AddSiteDialog } from './_components/add-site-dialog';

interface Site {
  id: string;
  name: string;
  url: string;
  platform: 'GA4' | 'STRIPE' | 'UPTIME' | 'LEMON_SQUEEZY' | 'SHOPIFY';
  status: 'active' | 'error' | 'paused';
  healthStatus: 'online' | 'offline' | 'unknown';
  lastSnapshot: {
    metrics: Record<string, any>;
    updatedAt: string;
  } | null;
  lastSyncAt: string | null;
  displayOrder: number;
}

interface SitesResponse {
  success: boolean;
  sites: Site[];
  total: number;
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SoloBoardDashboardPage() {
  const t = useTranslations('dashboard');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 使用 SWR 实现实时数据刷新
  const { data, error, mutate, isLoading } = useSWR<SitesResponse>(
    '/api/dashboard/sites',
    fetcher,
    {
      refreshInterval: 30000, // 每 30 秒自动刷新
      revalidateOnFocus: true, // 窗口获得焦点时刷新
      revalidateOnReconnect: true, // 网络重连时刷新
    }
  );

  // 手动刷新
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      toast.success(t('errors.refresh_success'));
    } catch (error) {
      toast.error(t('errors.refresh_failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // 添加站点成功后刷新列表
  const handleSiteAdded = () => {
    mutate();
    setIsAddDialogOpen(false);
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('errors.load_failed')}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('errors.retry')}
          </button>
        </div>
      </div>
    );
  }

  const sites = data?.sites || [];
  const totalSites = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('subtitle', { count: totalSites })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{t('refresh')}</span>
              </button>

              {/* 添加站点按钮 */}
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t('add_site')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 总站点数 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('stats.monitored_sites')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalSites}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
            </div>
          </div>

          {/* 在线站点 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('stats.online_status')}
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {sites.filter((s) => s.healthStatus === 'online').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          {/* 最后同步 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('stats.last_sync')}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {sites.length > 0 && sites[0].lastSyncAt
                    ? new Date(sites[0].lastSyncAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : t('stats.not_synced')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        {/* 九宫格站点监控 */}
        {sites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('empty.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('empty.description')}
              </p>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                {t('empty.add_first')}
              </button>
            </div>
          </div>
        ) : (
          <SiteGrid sites={sites} onRefresh={mutate} />
        )}
      </div>

      {/* 添加站点对话框 */}
      <AddSiteDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleSiteAdded}
      />
    </div>
  );
}











