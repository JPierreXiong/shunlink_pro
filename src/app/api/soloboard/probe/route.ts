export const dynamic = 'force-dynamic';

/**
 * Domain Probe API - 域名探测接口
 * 功能�? * 1. 检测网站是否在�? * 2. 自动抓取网站 Logo (favicon)
 * 3. 返回响应时间
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // 标准化域�?    const normalizedDomain = domain.startsWith('http') 
      ? domain 
      : `https://${domain}`;

    const startTime = Date.now();

    try {
      // 探测网站是否在线
      const response = await fetch(normalizedDomain, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5秒超�?      });

      const responseTime = Date.now() - startTime;

      // 使用 Google Favicon Service 获取 Logo
      // 这是最可靠的方式，支持所有网�?      const cleanDomain = normalizedDomain.replace(/^https?:\/\//, '').split('/')[0];
      const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

      return NextResponse.json({
        status: 'online',
        online: true,
        responseTime,
        logoUrl,
        domain: cleanDomain,
        message: '�?Website is online',
      });
    } catch (error) {
      // 网站离线或无法访�?      const cleanDomain = normalizedDomain.replace(/^https?:\/\//, '').split('/')[0];
      const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

      return NextResponse.json({
        status: 'offline',
        online: false,
        responseTime: null,
        logoUrl,
        domain: cleanDomain,
        message: '�?Website is unreachable',
      });
    }
  } catch (error) {
    console.error('Probe API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







