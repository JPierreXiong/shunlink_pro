/**
 * dashboard - 现代化站点卡片组�? * 
 * 设计理念�? * - 一秒看现状：大字报核心指标
 * - 状态呼吸灯：实时在线状�? * - 迷你趋势图：24 小时波形
 * - 悬浮操作：快捷跳转后�? */

'use client';

import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  ArrowUpRight,
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  MoreVertical,
  RefreshCw,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SiteCardProps {
  id: string;
  name: string;
  url: string;
  platform: string;
  status: 'online' | 'offline' | 'error' | 'unknown';
  favicon?: string;
  metrics: {
    primaryValue: number;
    primaryLabel: string;
    primaryUnit?: string;
    secondaryValue: number;
    secondaryLabel: string;
    secondaryUnit?: string;
    trend?: number; // 百分比变�?    sparkline?: number[]; // 24 小时波形数据
  };
  lastSync?: Date;
  onRefresh?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}

export function SiteCard({
  id,
  name,
  url,
  platform,
  status,
  favicon,
  metrics,
  lastSync,
  onRefresh,
  onDelete,
  onViewDetails,
}: SiteCardProps) {
  // 状态颜色映�?  const statusConfig = {
    online: {
      color: 'bg-green-500',
      pingColor: 'bg-green-400',
      label: '在线',
    },
    offline: {
      color: 'bg-red-500',
      pingColor: 'bg-red-400',
      label: '离线',
    },
    error: {
      color: 'bg-yellow-500',
      pingColor: 'bg-yellow-400',
      label: '异常',
    },
    unknown: {
      color: 'bg-gray-500',
      pingColor: 'bg-gray-400',
      label: '未知',
    },
  };

  const currentStatus = statusConfig[status];

  // 趋势方向
  const trendDirection = metrics.trend && metrics.trend > 0 ? 'up' : 'down';
  const trendColor = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300">
      {/* 顶部渐变装饰�?*/}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* 左侧：网站信�?*/}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Favicon */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
                {favicon ? (
                  <img src={favicon} alt={name} className="w-6 h-6" />
                ) : (
                  <Globe className="w-5 h-5 text-primary" />
                )}
              </div>
              {/* 状态呼吸灯 */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span
                  className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    currentStatus.pingColor
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-3 w-3',
                    currentStatus.color
                  )}
                />
              </span>
            </div>

            {/* 网站名称�?URL */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground">
                {name}
              </h3>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <span className="truncate">{url}</span>
              </p>
            </div>
          </div>

          {/* 右侧：操作菜�?*/}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <ExternalLink className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新数据
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                配置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 核心指标：大字报 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 主要指标 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{metrics.primaryLabel}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {metrics.primaryUnit === '$' && '$'}
              {metrics.primaryValue.toLocaleString()}
              {metrics.primaryUnit && metrics.primaryUnit !== '$' && metrics.primaryUnit}
            </div>
          </div>

          {/* 次要指标 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              <span>{metrics.secondaryLabel}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-500">
              {metrics.secondaryUnit === '$' && '$'}
              {metrics.secondaryValue.toLocaleString()}
              {metrics.secondaryUnit && metrics.secondaryUnit !== '$' && metrics.secondaryUnit}
            </div>
          </div>
        </div>

        {/* 趋势变化 */}
        {metrics.trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            {trendDirection === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {Math.abs(metrics.trend).toFixed(1)}% vs 昨日
            </span>
          </div>
        )}

        {/* 迷你波形�?(Sparkline) */}
        {metrics.sparkline && metrics.sparkline.length > 0 && (
          <div className="relative">
            <div className="flex items-end gap-[2px] h-12 w-full bg-secondary/20 rounded-md px-1 py-1">
              {metrics.sparkline.map((value, index) => (
                <div
                  key={index}
                  className="bg-primary/60 rounded-t-sm flex-1 transition-all hover:bg-primary"
                  style={{ height: `${value}%` }}
                  title={`${value}%`}
                />
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-muted-foreground">
              <span>24h �?/span>
              <span>现在</span>
            </div>
          </div>
        )}

        {/* 底部信息�?*/}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* 平台标识 */}
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
            {platform}
          </Badge>

          {/* 快捷操作 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary hover:text-primary/80"
            onClick={onViewDetails}
          >
            进入后台
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {/* 最后同步时�?*/}
        {lastSync && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>
              最后同�? {new Date(lastSync).toLocaleTimeString('zh-CN')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




