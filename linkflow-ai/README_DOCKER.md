# 🚀 LinkFlow AI — Docker Setup Guide

**3 steps. No coding required.**

---

## What You Need

| Tool | What it does | Download |
|---|---|---|
| **Docker Desktop** | Runs both services in containers | [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop/) |
| **A text editor** | Edit your API keys | Notepad (Windows) / TextEdit (Mac) |

That's it. No Python, no Node.js, no terminal knowledge needed.

---

## Step 1 — Install Docker Desktop

1. Download Docker Desktop from the link above
2. Install and launch it
3. Wait until you see **"Docker Desktop is running"** in the system tray

> Think of Docker Desktop as a player that runs the program package we give you.

---

## Step 2 — Configure Your API Keys

1. In this folder, find the file called **`env.template`**
2. Copy it and rename the copy to **`.env`**
   - Windows: right-click → Copy → Paste → rename to `.env`
   - Or in terminal: `copy env.template .env`
3. Open `.env` with Notepad and fill in your values:

```
DATABASE_URL=postgresql://...?sslmode=require   ← from Neon dashboard
NEXTAUTH_SECRET=...                              ← random 32-char string
OPENAI_API_KEY=sk-proj-...                       ← from OpenAI
CLOUDINARY_URL=cloudinary://...                 ← from Cloudinary dashboard
```

> **Critical:** Your `DATABASE_URL` must end with `?sslmode=require`.
> Neon PostgreSQL rejects connections without SSL.

### Validate your .env before starting

Double-click **`scripts/check-env.ps1`** (Windows) to automatically
check all required values are filled in correctly.

---

## Step 3 — Launch

### Windows
Double-click **`start.bat`**

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

The first launch downloads and builds the images — this takes **5–10 minutes**.
Subsequent launches take < 10 seconds.

Once running, open your browser: **http://localhost:3000**

---

## Useful Commands

| Task | Command |
|---|---|
| View live logs | `docker compose -f linkflow-ai/docker-compose.yml logs -f` |
| View worker logs only | `docker compose -f linkflow-ai/docker-compose.yml logs -f linkflow-crew` |
| Stop everything | `docker compose -f linkflow-ai/docker-compose.yml down` |
| Rebuild after code change | `docker compose -f linkflow-ai/docker-compose.yml build` |
| Check container status | `docker compose -f linkflow-ai/docker-compose.yml ps` |

---

## Architecture Inside Docker

```
┌─────────────────────────────────────────┐
│           Docker Network (linkflow-net)  │
│                                         │
│  ┌──────────────────┐  internal DNS     │
│  │  linkflow-web    │ ─────────────────>│
│  │  Next.js :3000   │  http://linkflow- │
│  │  (your browser   │  crew:8080        │
│  │   connects here) │                   │
│  └──────────────────┘  ┌─────────────┐ │
│                         │linkflow-crew│ │
│                         │Python :8080 │ │
│                         └─────────────┘ │
│                                         │
│  Both connect to Neon DB (external)     │
└─────────────────────────────────────────┘
```

> **Note:** Web calls AI worker via `http://linkflow-crew:8080` — never `localhost:8080`.
> Docker handles the routing automatically using service names.

---

## Troubleshooting

**Port 3000 already in use**
```bash
docker compose -f linkflow-ai/docker-compose.yml down
# Then try start.bat again
```

**Database connection error**
- Check your `DATABASE_URL` ends with `?sslmode=require`
- Verify the Neon project is not paused (free tier auto-pauses)

**ModuleNotFoundError in crew logs**
```bash
docker compose -f linkflow-ai/docker-compose.yml build --no-cache linkflow-crew
```

**Chromium not found**
```bash
# Rebuild the crew image
docker compose -f linkflow-ai/docker-compose.yml build --no-cache linkflow-crew
```

---

## Data Persistence

Worker logs are stored in a Docker **named volume** (`crew-logs`).
Even if you stop and restart containers, your logs are preserved.

To view persisted logs:
```bash
docker compose -f linkflow-ai/docker-compose.yml logs linkflow-crew
```

---

*Built with CrewAI, Playwright, Next.js 14, and Neon PostgreSQL.*

