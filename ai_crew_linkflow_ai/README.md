# LinkFlow AI

**Your 24-Hour Automated Backlink Deployment Engine.**

AI-powered backlink submission to 50+ Web 2.0 platforms with transparent screenshot proof and a 48-hour SLA guarantee.

---

## Architecture

```
LinkFlow-Project/
├── linkflow-web/     ← Next.js 14 frontend (Vercel)
├── linkflow-crew/    ← Python CrewAI worker (Railway/VPS)
├── shared/           ← Shared SQL schema and config docs
└── .cursor/          ← Cursor AI sub-agents and skills
```

Both systems communicate through a shared **Neon PostgreSQL** database.

---

## Quick Start

### 1. Database Setup

```bash
# Run the schema against your Neon instance
psql $DATABASE_URL -f shared/schema.sql
```

### 2. Web Frontend (linkflow-web)

```bash
cd linkflow-web
npm install
cp .env.example .env.local
# Fill in .env.local with your Neon URL, NextAuth secrets, Creem keys
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Python Worker (linkflow-crew)

```bash
cd linkflow-crew
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
# Fill in .env with DATABASE_URL, OPENAI_API_KEY, CLOUDINARY_URL
python main.py
```

---

## Environment Variables

See:
- `linkflow-web/.env.example` — Next.js web variables
- `linkflow-crew/.env.example` — Python worker variables
- `shared/GLOBAL_CONFIG.md` — Global architecture and proxy setup

---

## Key Features

| Feature | Details |
|---|---|
| **AI Agents** | CrewAI Navigator + Content Specialist agents |
| **Browser Automation** | Playwright with residential proxy support |
| **Self-Healing** | AI inspects DOM when CSS selectors fail |
| **2FA Support** | Human-in-loop: AI pauses, user submits code, AI resumes |
| **Screenshot Proof** | Full-page screenshots uploaded to Cloudinary/Vercel Blob |
| **48h SLA** | Auto-refund on deadline breach |
| **Multi-Worker Safe** | `FOR UPDATE SKIP LOCKED` prevents duplicate processing |
| **Credit System** | Creem payment integration, 1 free credit on signup |

---

## Task Status Machine

```
pending → processing → success
                     ↘ failed        (3 retries → auto-refund)
                     ↘ need_2fa     (await human 2FA input)
need_2fa → pending   (after user submits code)
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| `linkflow-web` | Vercel | Set all env vars in Vercel dashboard |
| `linkflow-crew` | Railway / VPS | Needs persistent process + Chromium |
| Database | Neon | Shared between both services |
| Screenshots | Cloudinary or Vercel Blob | Public URLs stored in DB |

---

## Cursor Development Workflow

- **Window A** → Open `linkflow-web/` for frontend/payment work
- **Window B** → Open `linkflow-crew/` for AI agent/automation work
- Sub-agents in `.cursor/agents/` auto-audit schema consistency and security
- Skills in `.cursor/skills/` provide copy-paste code patterns

---

## Testing

### Test the worker without real platforms

```sql
-- Insert a test task directly in Neon
INSERT INTO backlink_tasks (user_id, target_url, anchor_text, platform_type)
SELECT id, 'https://example.com', 'test anchor', 'Web2.0'
FROM users LIMIT 1;
```

Then run `python main.py` and watch the console.

### Test with headful browser (see what the AI is doing)

```bash
# In linkflow-crew/.env:
HEADLESS=false
```


