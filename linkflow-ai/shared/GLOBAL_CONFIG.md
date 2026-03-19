# LinkFlow AI — Global Configuration Guide

## Critical: IP Quality Requirements

> **IP quality is the single most important factor** in whether your submitted backlinks appear legitimate to Google and the target platforms. Datacenter IPs are immediately flagged.

### Mandatory: Residential Proxies

All Playwright browser sessions MUST route through residential proxies.

Recommended providers (in order of quality):
1. **Bright Data** (formerly Luminati) — Best rotation, stickiest sessions
   - Product: Residential Proxies
   - Format: `http://user:pass@zproxy.lum-superproxy.io:22225`
2. **Oxylabs** — Best for geo-targeting
3. **Smartproxy** — Budget option, good rotation
4. **IPRoyal** — Pay-as-you-go, no subscription

### Proxy Config in `linkflow-crew/.env`
```bash
PROXY_SERVER=http://your-proxy-provider:port
PROXY_USERNAME=your_proxy_user
PROXY_PASSWORD=your_proxy_pass
ROTATE_PROXY_PER_TASK=true
```

### Playwright Proxy Integration
```python
browser = await playwright.chromium.launch(
    headless=True,
    proxy={
        "server": os.getenv("PROXY_SERVER"),
        "username": os.getenv("PROXY_USERNAME"),
        "password": os.getenv("PROXY_PASSWORD"),
    }
)
```

---

## Free Trial Anti-Abuse Rules

The 1-free-credit signup offer MUST be protected:

1. **Require OAuth login** — Only GitHub or Google sign-in for free tier. No email-only signups.
2. **Device fingerprinting** — Use FingerprintJS or Vercel middleware.
3. **Rate limit by IP** — Max 1 signup per IP per 24h.
4. **Honeypot fields** — Add a hidden `<input>` in the signup form.

---

## Environment Variables Reference

### linkflow-web (.env.local)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/linkflow?sslmode=require
DIRECT_URL=postgresql://user:pass@host/linkflow?sslmode=require

# Auth (NextAuth.js)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Creem Payment
CREEM_API_KEY=your-creem-api-key
CREEM_WEBHOOK_SECRET=your-creem-webhook-secret
CREEM_PRODUCT_10_CREDITS=prod_xxxx   # $39 → 10 credits
CREEM_PRODUCT_25_CREDITS=prod_yyyy   # $89 → 25 credits

# Storage (pick one)
VERCEL_BLOB_READ_WRITE_TOKEN=vercelblob_xxx
CLOUDINARY_URL=cloudinary://key:secret@cloud_name

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### linkflow-crew (.env)
```bash
# Database (same Neon instance)
DATABASE_URL=postgresql://user:pass@host/linkflow?sslmode=require

# AI
OPENAI_API_KEY=sk-...
# or use Claude:
ANTHROPIC_API_KEY=sk-ant-...

# Proxy
PROXY_SERVER=http://your-proxy:port
PROXY_USERNAME=your_proxy_user
PROXY_PASSWORD=your_proxy_pass
ROTATE_PROXY_PER_TASK=true

# Storage
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
# or Vercel Blob:
VERCEL_BLOB_READ_WRITE_TOKEN=vercelblob_xxx

# Worker
POLL_INTERVAL_SECONDS=10
MAX_RETRIES=3
HEADLESS=true
WORKER_LOG_LEVEL=INFO
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vercel (linkflow-web)              │
│  Next.js 14 · Tailwind · Prisma · NextAuth          │
│  - Serves UI                                        │
│  - Handles Creem webhook → writes credits           │
│  - Creates tasks in Neon DB                         │
└────────────────────┬────────────────────────────────┘
                     │ Neon PostgreSQL (shared DB)
┌────────────────────┴────────────────────────────────┐
│            Railway / VPS (linkflow-crew)             │
│  Python · CrewAI · Playwright · psycopg2            │
│  - Polls DB every 10s                               │
│  - Runs browser automation via residential proxy    │
│  - Uploads screenshots → writes results to DB       │
└─────────────────────────────────────────────────────┘
```

---

## 48-Hour SLA Management

- Tasks have a `deadline` of `NOW() + 48 hours`
- Worker should check `deadline > NOW()` before processing
- If `deadline` is exceeded and task is still `pending`, auto-set to `failed` and refund credit
- Add a daily cron job (on Railway) to sweep expired tasks:

```python
UPDATE backlink_tasks
SET status = 'failed', error_message = 'Deadline exceeded'
WHERE status IN ('pending', 'need_2fa')
  AND deadline < NOW();

-- Then refund credits for those tasks
```
