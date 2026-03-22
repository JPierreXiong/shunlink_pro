/**
 * 浏览器端支付流程测试页面
 * 访问 /test-payment 查看完整报告
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TestReport {
  timestamp: string;
  user: any;
  orders: any[];
  subscriptions: any[];
  currentSubscription: any;
  sites: any[];
  permissions: {
    planName: string;
    siteLimit: number;
    currentSites: number;
    canAddMore: boolean;
    remaining: number;
    validUntil: string | null;
  };
  issues: string[];
  recommendations: string[];
}

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);

  const runTest = async () => {
    setLoading(true);
    const testReport: TestReport = {
      timestamp: new Date().toISOString(),
      user: null,
      orders: [],
      subscriptions: [],
      currentSubscription: null,
      sites: [],
      permissions: {
        planName: 'Free',
        siteLimit: 1,
        currentSites: 0,
        canAddMore: false,
        remaining: 1,
        validUntil: null,
      },
      issues: [],
      recommendations: [],
    };

    try {
      // 1. 检查用户信息
      console.log('🔍 检查用户信息...');
      try {
        const userRes = await fetch('/api/user/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          testReport.user = userData;
          console.log('✅ 用户已登录:', userData);
        } else {
          testReport.issues.push('用户未登录或 session 失效');
          testReport.recommendations.push('请先登录账号');
        }
      } catch (error: any) {
        testReport.issues.push(`用户 API 错误: ${error.message}`);
      }

      // 2. 检查站点和权限
      console.log('🔍 检查站点权限...');
      try {
        const sitesRes = await fetch('/api/dashboard/sites');
        if (sitesRes.ok) {
          const sitesData = await sitesRes.json();
          testReport.sites = sitesData.sites || [];
          
          if (sitesData.subscription) {
            testReport.permissions = {
              planName: sitesData.subscription.plan,
              siteLimit: sitesData.subscription.limit,
              currentSites: sitesData.total || 0,
              canAddMore: sitesData.subscription.canAddMore,
              remaining: sitesData.subscription.remaining,
              validUntil: null,
            };
          }
          console.log('✅ 站点数据:', sitesData);
        } else {
          testReport.issues.push(`站点 API 错误: ${sitesRes.status}`);
        }
      } catch (error: any) {
        testReport.issues.push(`站点 API 错误: ${error.message}`);
      }

      // 3. 检查订阅（通过 admin API）
      console.log('🔍 检查订阅信息...');
      try {
        // 注意：这需要管理员权限，普通用户可能无法访问
        const subRes = await fetch('/api/admin/dashboard');
        if (subRes.ok) {
          const dashData = await subRes.json();
          if (dashData.subscriptions) {
            testReport.subscriptions = dashData.subscriptions;
          }
          console.log('✅ Dashboard 数据:', dashData);
        }
      } catch (error: any) {
        console.log('⚠️ 无法访问 admin API（正常，需要管理员权限）');
      }

      // 4. 生成建议
      if (!testReport.user) {
        testReport.recommendations.push('请先登录账号');
      } else if (testReport.permissions.planName === 'Free') {
        testReport.recommendations.push('当前使用免费套餐，升级可获得更多站点配额');
      }

      if (testReport.sites.length === 0) {
        testReport.recommendations.push('还没有添加任何站点，点击"Add Website"开始监控');
      }

      if (!testReport.permissions.canAddMore) {
        testReport.recommendations.push('已达到站点数量限制，请升级套餐');
      }

    } catch (error: any) {
      testReport.issues.push(`测试失败: ${error.message}`);
    }

    setReport(testReport);
    setLoading(false);
  };

  useEffect(() => {
    runTest();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">正在测试支付流程...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const daysLeft = report.permissions.validUntil 
    ? Math.ceil((new Date(report.permissions.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">支付流程测试报告</h1>
          <p className="text-muted-foreground">
            测试时间: {new Date(report.timestamp).toLocaleString('zh-CN')}
          </p>
        </div>
        <Button onClick={runTest} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          重新测试
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 用户信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {report.user ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              用户信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.user ? (
              <div className="space-y-2">
                <p><strong>姓名:</strong> {report.user.name}</p>
                <p><strong>邮箱:</strong> {report.user.email}</p>
                <p><strong>ID:</strong> {report.user.id}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ 用户未登录</p>
            )}
          </CardContent>
        </Card>

        {/* 权限状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              权限状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">当前套餐</p>
                <p className="text-2xl font-bold">{report.permissions.planName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">站点限制</p>
                <p className="text-2xl font-bold">{report.permissions.siteLimit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">当前站点</p>
                <p className="text-2xl font-bold">{report.permissions.currentSites}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">剩余配额</p>
                <p className="text-2xl font-bold">{report.permissions.remaining}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <strong>可添加站点:</strong>
                {report.permissions.canAddMore ? (
                  <Badge variant="default" className="bg-green-600">是 ✅</Badge>
                ) : (
                  <Badge variant="destructive">否 ❌</Badge>
                )}
              </div>
              
              {report.permissions.validUntil && (
                <div className="mt-2">
                  <strong>有效期至:</strong> {new Date(report.permissions.validUntil).toLocaleDateString('zh-CN')}
                  {daysLeft > 0 && <span className="text-muted-foreground ml-2">(剩余 {daysLeft} 天)</span>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 站点列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              已添加站点 ({report.sites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.sites.length > 0 ? (
              <div className="space-y-2">
                {report.sites.map((site, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{site.name}</p>
                      <p className="text-sm text-muted-foreground">{site.domain}</p>
                    </div>
                    <Badge>{site.platform}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">还没有添加任何站点</p>
            )}
          </CardContent>
        </Card>

        {/* 问题和建议 */}
        {(report.issues.length > 0 || report.recommendations.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                诊断结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.issues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">⚠️ 发现的问题:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {report.issues.map((issue, i) => (
                      <li key={i} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {report.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-blue-600">💡 建议:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <a href="/dashboard">前往 Dashboard</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings/billing">查看 Billing</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/pricing">升级套餐</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/settings/credits">查看积分</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

