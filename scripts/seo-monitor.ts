/**
 * SEO Monitoring Script
 * 
 * Checks:
 * - Sitemap accessibility
 * - Robots.txt validity
 * - Meta tags presence
 * - Schema markup validation
 * - Page load performance
 * 
 * Usage: pnpm tsx scripts/seo-monitor.ts
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

interface SEOCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkSitemap(): Promise<SEOCheckResult> {
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    
    if (!response.ok) {
      return {
        name: 'Sitemap Check',
        status: 'fail',
        message: `Sitemap not accessible (${response.status})`,
      };
    }
    
    const content = await response.text();
    
    // Check if it contains soloboard.app
    if (content.includes('soloboard.app')) {
      const urlCount = (content.match(/<url>/g) || []).length;
      return {
        name: 'Sitemap Check',
        status: 'pass',
        message: `Sitemap accessible with ${urlCount} URLs`,
        details: 'Domain: soloboard.app ✓',
      };
    } else {
      return {
        name: 'Sitemap Check',
        status: 'warning',
        message: 'Sitemap accessible but domain might be incorrect',
        details: 'Check if URLs point to correct domain',
      };
    }
  } catch (error) {
    return {
      name: 'Sitemap Check',
      status: 'fail',
      message: 'Failed to fetch sitemap',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRobotsTxt(): Promise<SEOCheckResult> {
  try {
    const response = await fetch(`${BASE_URL}/robots.txt`);
    
    if (!response.ok) {
      return {
        name: 'Robots.txt Check',
        status: 'fail',
        message: `Robots.txt not accessible (${response.status})`,
      };
    }
    
    const content = await response.text();
    
    // Check for sitemap reference
    if (content.includes('Sitemap:')) {
      return {
        name: 'Robots.txt Check',
        status: 'pass',
        message: 'Robots.txt accessible with sitemap reference',
      };
    } else {
      return {
        name: 'Robots.txt Check',
        status: 'warning',
        message: 'Robots.txt accessible but missing sitemap reference',
      };
    }
  } catch (error) {
    return {
      name: 'Robots.txt Check',
      status: 'fail',
      message: 'Failed to fetch robots.txt',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkHomepageMetadata(): Promise<SEOCheckResult> {
  try {
    const response = await fetch(BASE_URL);
    
    if (!response.ok) {
      return {
        name: 'Homepage Metadata',
        status: 'fail',
        message: `Homepage not accessible (${response.status})`,
      };
    }
    
    const html = await response.text();
    
    const checks = {
      title: html.includes('<title>'),
      description: html.includes('name="description"'),
      ogTitle: html.includes('property="og:title"'),
      ogImage: html.includes('property="og:image"'),
      twitterCard: html.includes('name="twitter:card"'),
      canonical: html.includes('rel="canonical"'),
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    if (passedChecks === totalChecks) {
      return {
        name: 'Homepage Metadata',
        status: 'pass',
        message: `All ${totalChecks} meta tags present`,
        details: 'Title, Description, OG tags, Twitter Card, Canonical ✓',
      };
    } else {
      const missing = Object.entries(checks)
        .filter(([_, present]) => !present)
        .map(([name]) => name);
      
      return {
        name: 'Homepage Metadata',
        status: 'warning',
        message: `${passedChecks}/${totalChecks} meta tags present`,
        details: `Missing: ${missing.join(', ')}`,
      };
    }
  } catch (error) {
    return {
      name: 'Homepage Metadata',
      status: 'fail',
      message: 'Failed to check homepage',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkSchemaMarkup(): Promise<SEOCheckResult> {
  try {
    const response = await fetch(BASE_URL);
    
    if (!response.ok) {
      return {
        name: 'Schema Markup',
        status: 'fail',
        message: `Homepage not accessible (${response.status})`,
      };
    }
    
    const html = await response.text();
    
    const hasSchema = html.includes('application/ld+json');
    const schemaCount = (html.match(/application\/ld\+json/g) || []).length;
    
    if (hasSchema) {
      return {
        name: 'Schema Markup',
        status: 'pass',
        message: `${schemaCount} schema(s) found`,
        details: 'Structured data present ✓',
      };
    } else {
      return {
        name: 'Schema Markup',
        status: 'warning',
        message: 'No schema markup found',
        details: 'Consider adding structured data for better SEO',
      };
    }
  } catch (error) {
    return {
      name: 'Schema Markup',
      status: 'fail',
      message: 'Failed to check schema markup',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkOGImage(): Promise<SEOCheckResult> {
  try {
    // Check if dynamic OG image API works
    const response = await fetch(`${BASE_URL}/api/og`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('image')) {
        return {
          name: 'OG Image API',
          status: 'pass',
          message: 'Dynamic OG image API working',
          details: 'Endpoint: /api/og ✓',
        };
      }
    }
    
    return {
      name: 'OG Image API',
      status: 'warning',
      message: 'OG image API not responding correctly',
      details: 'Check /api/og endpoint',
    };
  } catch (error) {
    return {
      name: 'OG Image API',
      status: 'fail',
      message: 'Failed to check OG image API',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkPageSpeed(): Promise<SEOCheckResult> {
  try {
    const startTime = Date.now();
    const response = await fetch(BASE_URL);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    if (loadTime < 1000) {
      return {
        name: 'Page Load Speed',
        status: 'pass',
        message: `Homepage loads in ${loadTime}ms`,
        details: 'Excellent performance ✓',
      };
    } else if (loadTime < 3000) {
      return {
        name: 'Page Load Speed',
        status: 'warning',
        message: `Homepage loads in ${loadTime}ms`,
        details: 'Consider optimization',
      };
    } else {
      return {
        name: 'Page Load Speed',
        status: 'fail',
        message: `Homepage loads in ${loadTime}ms`,
        details: 'Performance optimization needed',
      };
    }
  } catch (error) {
    return {
      name: 'Page Load Speed',
      status: 'fail',
      message: 'Failed to measure page speed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function printResults(results: SEOCheckResult[]) {
  console.log('\n🔍 SEO Monitoring Report');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');
  
  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log('');
  });
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;
  
  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`⚠️  Warnings: ${warnings}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log('');
  
  const score = ((passed + warnings * 0.5) / total * 100).toFixed(1);
  console.log(`🎯 SEO Score: ${score}%`);
  console.log('');
  
  if (failed > 0) {
    console.log('⚠️  Action Required: Fix failed checks');
  } else if (warnings > 0) {
    console.log('💡 Recommendation: Address warnings for better SEO');
  } else {
    console.log('🎉 Excellent! All SEO checks passed');
  }
  console.log('');
}

async function main() {
  console.log('🚀 Starting SEO monitoring...\n');
  
  const checks = [
    checkSitemap(),
    checkRobotsTxt(),
    checkHomepageMetadata(),
    checkSchemaMarkup(),
    checkOGImage(),
    checkPageSpeed(),
  ];
  
  const results = await Promise.all(checks);
  
  printResults(results);
  
  // Exit with error code if any checks failed
  const hasFailed = results.some(r => r.status === 'fail');
  process.exit(hasFailed ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ SEO monitoring failed:', error);
  process.exit(1);
});


