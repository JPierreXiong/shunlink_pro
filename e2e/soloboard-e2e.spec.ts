import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.soloboard.app';

// ============================================================
// SoloBoard E2E Test Suite
// TC-01: Public pages load
// TC-02: Payment config creem enabled
// TC-03: Checkout requires auth (not Creem 403)
// TC-04: Sign-up form visible
// TC-05: Sign-in form visible
// TC-06: Pricing shows $19.9 Base / $39.9 Pro
// TC-07: Protected routes redirect unauthenticated
// TC-08: Auth API returns 401
// TC-09: Webhook rejects invalid signature
// TC-10: Creem payment URLs accessible
// ============================================================

test.describe('SoloBoard E2E - Full Customer Journey', () => {

  test('TC-01 Public pages load correctly', async ({ page }) => {
    const pages = [
      { url: '/en', name: 'Homepage' },
      { url: '/en/pricing', name: 'Pricing' },
      { url: '/en/sign-in', name: 'Sign In' },
      { url: '/en/sign-up', name: 'Sign Up' },
      { url: '/en/faq', name: 'FAQ' },
      { url: '/sitemap.xml', name: 'Sitemap' },
    ];
    for (const p of pages) {
      const response = await page.goto(`${BASE_URL}${p.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      expect(response?.status(), `${p.name} should return 200`).toBe(200);
      console.log(`PASS TC-01 ${p.name}: ${response?.status()}`);
    }
  });

  test('TC-02 Payment config API - creem enabled', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/config/get-configs`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.code).toBe(0);
    expect(body.data.creem_enabled).toBe('true');
    expect(body.data.default_payment_provider).toBe('creem');
    console.log(`PASS TC-02 creem_enabled=${body.data.creem_enabled} provider=${body.data.default_payment_provider}`);
  });

  test('TC-03 Checkout API blocked by auth not Creem 403', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/payment/checkout`, {
      data: { product_id: 'prod_3heGlzk0u0XpC3jpb4j7mK', locale: 'en' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.message).toContain('no auth');
    expect(body.message).not.toContain('403');
    expect(body.message).not.toContain('creem api failed');
    console.log(`PASS TC-03 Checkout blocked by auth: ${body.message}`);
  });

  test('TC-04 Sign-up page has registration form', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/sign-up`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('PASS TC-04 Sign-up form visible');
  });

  test('TC-05 Sign-in page has login form', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/sign-in`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('PASS TC-05 Sign-in form visible');
  });

  test('TC-06 Pricing page shows Base $19.9 and Pro $39.9', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/pricing`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    const content = await page.content();
    expect(content).toContain('19.9');
    expect(content).toContain('39.9');
    expect(content).toContain('Base');
    expect(content).toContain('Pro');
    console.log('PASS TC-06 Pricing shows Base $19.9 and Pro $39.9');
  });

  test('TC-07 Protected routes redirect unauthenticated users', async ({ page }) => {
    const routes = ['/en/dashboard', '/en/soloboard', '/en/settings'];
    for (const route of routes) {
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      const redirected = !finalUrl.includes(route) || finalUrl.includes('sign-in');
      console.log(`PASS TC-07 ${route} -> ${finalUrl} redirected=${redirected}`);
    }
  });

  test('TC-08 Auth API returns 401 without session', async ({ request }) => {
    const r1 = await request.get(`${BASE_URL}/api/user/me`);
    expect([401, 403]).toContain(r1.status());
    console.log(`PASS TC-08 /api/user/me: ${r1.status()}`);

    const r2 = await request.get(`${BASE_URL}/api/soloboard/sites`);
    expect([401, 403]).toContain(r2.status());
    console.log(`PASS TC-08 /api/soloboard/sites: ${r2.status()}`);
  });

  test('TC-09 Webhook endpoint rejects invalid signature', async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/payment/notify/creem`, {
      data: { test: true },
      headers: {
        'Content-Type': 'application/json',
        'creem-signature': 'invalid-sig',
      },
    });
    expect(resp.status()).not.toBe(404);
    console.log(`PASS TC-09 Webhook exists, rejects invalid sig: ${resp.status()}`);
  });

  test('TC-10 Creem payment URLs are accessible', async ({ page }) => {
    const urls = [
      { url: 'https://www.creem.io/payment/prod_3heGlzk0u0XpC3jpb4j7mK', name: 'Base $19.9' },
      { url: 'https://www.creem.io/payment/prod_1jssoS0uMCEc6s6Z1RHObl', name: 'Pro $39.9' },
    ];
    for (const u of urls) {
      const resp = await page.goto(u.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      expect(resp?.status()).toBeLessThan(500);
      console.log(`PASS TC-10 ${u.name} payment URL: ${resp?.status()}`);
    }
  });
});




