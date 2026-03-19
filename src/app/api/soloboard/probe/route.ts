export const dynamic = 'force-dynamic';

/**
 * Domain Probe API
 * 1. Check if website is online
 * 2. Auto-fetch website Logo (favicon)
 * 3. Return response time
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
    const startTime = Date.now();

    try {
      const response = await fetch(normalizedDomain, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;
      const cleanDomain = normalizedDomain.replace(/^https?:\/\//, '').split('/')[0];
      const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

      return NextResponse.json({
        status: 'online',
        online: true,
        responseTime,
        logoUrl,
        domain: cleanDomain,
        message: 'Website is online',
      });
    } catch (error) {
      const cleanDomain = normalizedDomain.replace(/^https?:\/\//, '').split('/')[0];
      const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;

      return NextResponse.json({
        status: 'offline',
        online: false,
        responseTime: null,
        logoUrl,
        domain: cleanDomain,
        message: 'Website is unreachable',
      });
    }
  } catch (error) {
    console.error('Probe API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
