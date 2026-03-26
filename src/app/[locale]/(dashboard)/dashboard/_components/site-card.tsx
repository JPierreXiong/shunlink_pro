/**
 * LinkFlow AI - 站点卡片组件
 * 
 * 显示单个站点的关键指标，支持拖拽排序
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Activity,
  DollarSign,
  Eye,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Trash2,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { MetricsChart } from './metrics-chart';
import { useTranslations } from 'next-intl';

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

interface SiteCardProps {
  site: Site;
  onRefresh: () => void;
}

export function SiteCard({ site, onRefresh }: SiteCardProps) {
  const t = useTranslations('dashboard.site');
  const [showMenu, setShowMenu] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 获取平台图标
  const getPlatformIcon = () => {
    switch (site.platform) {
      case 'GA4':
        return '📊';
      case 'STRIPE':
        return '💳';
      case 'UPTIME':
        return '🟢';
      case 'LEMON_SQUEEZY':
        return '🍋';
      case 'SHOPIFY':
        return '🛍️';
      default:
        return '🌐';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (site.status === 'error') return 'bg-red-500';
    if (site.healthStatus === 'offline') return 'bg-red-500';
    if (site.healthStatus === 'online') return 'bg-green-500';
    return 'bg-gray-400';
  };

  // 格式化指标
  const formatMetrics = () => {
    if (!site.lastSnapshot?.metrics) {
      return { primary: t('metrics.no_data'), secondary: '' };
    }

    const metrics = site.lastSnapshot.metrics;

    switch (site.platform) {
      case 'GA4':
        return {
          primary: `${metrics.activeUsers || 0} ${t('metrics.online')}`,
          secondary: `${metrics.pageViews || 0} ${t('metrics.views')}`,
          icon: <Eye className="w-4 h-4" />,
        };
      case 'STRIPE':
        return {
          primary: `$${((metrics.todayRevenue || 0) / 100).toFixed(2)}`,
          secondary: `${metrics.todayTransactions || 0} ${t('metrics.transactions')}`,
          icon: <DollarSign className="w-4 h-4" />,
        };
      case 'UPTIME':
        return {
          primary: metrics.isOnline ? t('status.online') : t('status.offline'),
          secondary: `${metrics.responseTime || 0}ms`,
          icon: <Activity className="w-4 h-4" />,
        };
      default:
        return { primary: t('metrics.no_data'), secondary: '' };
    }
  };

  const { primary, secondary, icon } = formatMetrics();

  // 删除站点
  const handleDelete = async () => {
    if (!confirm(t('actions.delete_confirm', { name: site.name }))) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/sites/${site.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      toast.success(t('actions.delete_success'));
      onRefresh();
    } catch (error) {
      toast.error(t('actions.delete_failed'));
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <div className="w-4 h-4 flex flex-col justify-center space-y-0.5">
            <div className="w-full h-0.5 bg-gray-400 rounded"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded"></div>
            <div className="w-full h-0.5 bg-gray-400 rounded"></div>
          </div>
        </div>

        {/* 菜单按钮 */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button
                onClick={() => {
                  setShowChart(!showChart);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t('actions.view_details')}</span>
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{t('actions.edit')}</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? t('actions.deleting') : t('actions.delete')}</span>
              </button>
            </div>
          )}
        </div>

        {/* 卡片内容 */}
        <div className="p-6">
          {/* 平台图标和状态 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">{getPlatformIcon()}</div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {site.platform}
              </span>
            </div>
          </div>

          {/* 站点名称 */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {site.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
            {site.url}
          </p>

          {/* 主要指标 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                {icon}
                <span className="text-sm">{t('metrics.primary')}</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {primary}
              </span>
            </div>
            {secondary && (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                {secondary}
              </div>
            )}
          </div>

          {/* 最后更新时间 */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('last_updated')}</span>
              <span>
                {site.lastSyncAt
                  ? new Date(site.lastSyncAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : t('not_synced')}
              </span>
            </div>
          </div>

          {/* 错误提示 */}
          {site.status === 'error' && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600">{t('sync_failed')}</span>
            </div>
          )}
        </div>

        {/* 趋势图表（展开时显示） */}
        {showChart && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4">
            <MetricsChart siteId={site.id} platform={site.platform} />
          </div>
        )}
      </div>
    </div>
  );
}











