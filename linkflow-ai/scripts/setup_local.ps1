# LinkFlow AI — One-Click Local Setup Script (Windows PowerShell)
# Run from the LinkFlow-Project root:
#   cd D:\AIsoftware\linkflow\LinkFlow-Project
#   .\scripts\setup_local.ps1

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  LinkFlow AI — Local Environment Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$ROOT = Split-Path -Parent $PSScriptRoot
$CREW_DIR = Join-Path $ROOT "linkflow-crew"
$WEB_DIR  = Join-Path $ROOT "linkflow-web"

# ── STEP 1: Python Worker Setup ──────────────────────────────────────────────
Write-Host "[1/5] Setting up Python worker (linkflow-crew)..." -ForegroundColor Yellow

Set-Location $CREW_DIR

# Create venv if not exists
if (-not (Test-Path ".venv")) {
    Write-Host "  Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv .venv
}

# Activate venv
$activate = Join-Path $CREW_DIR ".venv\Scripts\Activate.ps1"
& $activate

# Install dependencies
Write-Host "  Installing Python dependencies..." -ForegroundColor Gray
pip install -r requirements.txt --quiet

# Install Playwright browsers
Write-Host "  Installing Playwright Chromium..." -ForegroundColor Gray
playwright install chromium

Write-Host "  [OK] Python worker ready." -ForegroundColor Green

# ── STEP 2: Check .env file ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/5] Checking linkflow-crew environment variables..." -ForegroundColor Yellow

$envFile = Join-Path $CREW_DIR ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $CREW_DIR ".env.example") $envFile
    Write-Host "  [!] Created .env from .env.example" -ForegroundColor Red
    Write-Host "  [!] IMPORTANT: Fill in DATABASE_URL, OPENAI_API_KEY, CLOUDINARY_URL in:" -ForegroundColor Red
    Write-Host "      $envFile" -ForegroundColor Red
} else {
    Write-Host "  [OK] .env file exists." -ForegroundColor Green

    # Check critical vars
    $envContent = Get-Content $envFile -Raw
    $missing = @()
    if ($envContent -notmatch 'DATABASE_URL=postgresql') { $missing += 'DATABASE_URL' }
    if ($envContent -notmatch 'OPENAI_API_KEY=sk-')      { $missing += 'OPENAI_API_KEY' }
    if ($envContent -notmatch 'CLOUDINARY_URL=cloudinary') { $missing += 'CLOUDINARY_URL' }

    if ($missing.Count -gt 0) {
        Write-Host "  [!] Missing or placeholder values detected:" -ForegroundColor Red
        foreach ($v in $missing) { Write-Host "      - $v" -ForegroundColor Red }
        Write-Host "  Please edit: $envFile" -ForegroundColor Red
    } else {
        Write-Host "  [OK] All critical env vars found." -ForegroundColor Green
    }
}

# ── STEP 3: Next.js Web Setup ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/5] Setting up Next.js web (linkflow-web)..." -ForegroundColor Yellow

Set-Location $WEB_DIR

if (-not (Test-Path "node_modules")) {
    Write-Host "  Running npm install..." -ForegroundColor Gray
    npm install --silent
} else {
    Write-Host "  [OK] node_modules exists, skipping install." -ForegroundColor Green
}

# Generate Prisma client
Write-Host "  Generating Prisma client..." -ForegroundColor Gray
npx prisma generate

Write-Host "  [OK] Next.js web ready." -ForegroundColor Green

# ── STEP 4: Check .env.local ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Checking linkflow-web environment variables..." -ForegroundColor Yellow

$webEnv = Join-Path $WEB_DIR ".env.local"
if (-not (Test-Path $webEnv)) {
    Copy-Item (Join-Path $WEB_DIR ".env.example") $webEnv
    Write-Host "  [!] Created .env.local from .env.example" -ForegroundColor Red
    Write-Host "  [!] IMPORTANT: Fill in all values in: $webEnv" -ForegroundColor Red
} else {
    $webContent = Get-Content $webEnv -Raw
    $webMissing = @()
    if ($webContent -notmatch 'DATABASE_URL=postgresql') { $webMissing += 'DATABASE_URL' }
    if ($webContent -notmatch 'NEXTAUTH_SECRET=')         { $webMissing += 'NEXTAUTH_SECRET' }
    if ($webContent -notmatch 'GITHUB_ID=')               { $webMissing += 'GITHUB_ID' }

    if ($webMissing.Count -gt 0) {
        Write-Host "  [!] Missing values: $($webMissing -join ', ')" -ForegroundColor Red
    } else {
        Write-Host "  [OK] All critical web env vars found." -ForegroundColor Green
    }
}

# ── STEP 5: Test DB connection ────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Testing database connection..." -ForegroundColor Yellow

Set-Location $CREW_DIR
& $activate

$dbTest = @"
import os, sys
from dotenv import load_dotenv
load_dotenv()
try:
    import psycopg2
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) FROM backlink_tasks')
    count = cur.fetchone()[0]
    conn.close()
    print(f'DB OK — {count} tasks in backlink_tasks table')
except Exception as e:
    print(f'DB ERROR: {e}')
    sys.exit(1)
"@

python -c $dbTest

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Next steps:" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal A (Python Worker — headful debug mode):" -ForegroundColor White
Write-Host "    cd linkflow-crew" -ForegroundColor Gray
Write-Host "    .venv\Scripts\activate" -ForegroundColor Gray
Write-Host "    set HEADLESS=false && python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal B (Next.js Web):" -ForegroundColor White
Write-Host "    cd linkflow-web" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host "    Open: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal C (Dry-run test — no real browser):" -ForegroundColor White
Write-Host "    cd linkflow-crew" -ForegroundColor Gray
Write-Host "    .venv\Scripts\activate" -ForegroundColor Gray
Write-Host "    python test_local.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  Seed a test task in DB:" -ForegroundColor White
Write-Host "    psql `$DATABASE_URL -f ../shared/schema_patch.sql" -ForegroundColor Gray
Write-Host "    psql `$DATABASE_URL -f ../scripts/seed_test_task.sql" -ForegroundColor Gray
Write-Host ""


