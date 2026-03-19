# LinkFlow AI — Environment Variable Checker
# Double-click this file or run: .\scripts\check-env.ps1
# It checks your .env file for common mistakes before you start Docker.

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  LinkFlow AI — Environment Check" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Find .env file (check root and parent)
$envPath = $null
$candidates = @(
    (Join-Path $PSScriptRoot "..\.env"),
    (Join-Path $PSScriptRoot "..\..\linkflow-ai\.env"),
    ".env"
)
foreach ($c in $candidates) {
    if (Test-Path $c) { $envPath = (Resolve-Path $c).Path; break }
}

if (-not $envPath) {
    Write-Host "[FAIL] .env file not found!" -ForegroundColor Red
    Write-Host "  Run: copy .env.example .env    then fill in your values." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "  Reading: $envPath" -ForegroundColor Gray
$env = Get-Content $envPath -Raw
Write-Host ""

$pass = 0
$fail = 0
$warn = 0

function Check($label, $pattern, $hint, $severity = 'error') {
    if ($env -match $pattern) {
        Write-Host "  [OK]   $label" -ForegroundColor Green
        $script:pass++
    } else {
        if ($severity -eq 'warn') {
            Write-Host "  [WARN] $label" -ForegroundColor Yellow
            Write-Host "         $hint" -ForegroundColor DarkYellow
            $script:warn++
        } else {
            Write-Host "  [FAIL] $label" -ForegroundColor Red
            Write-Host "         $hint" -ForegroundColor DarkRed
            $script:fail++
        }
    }
}

# ── Critical checks ──────────────────────────────────────────
Check `
    "DATABASE_URL is set" `
    'DATABASE_URL=postgresql://' `
    "Set DATABASE_URL=postgresql://... in your .env"

Check `
    "DATABASE_URL has sslmode=require (required for Neon)" `
    'sslmode=require' `
    "Add ?sslmode=require to the end of your DATABASE_URL"

Check `
    "NEXTAUTH_SECRET is set" `
    'NEXTAUTH_SECRET=.{16,}' `
    "Generate one: openssl rand -base64 32  (must be 16+ chars)"

Check `
    "OPENAI_API_KEY is set" `
    'OPENAI_API_KEY=sk-' `
    "Get from: https://platform.openai.com/api-keys"

Check `
    "CLOUDINARY_URL is set" `
    'CLOUDINARY_URL=cloudinary://' `
    "Get from: https://cloudinary.com → Dashboard → API Environment variable"

Check `
    "GITHUB_ID is set" `
    'GITHUB_ID=\S{5,}' `
    "Create at: https://github.com/settings/applications/new"

Check `
    "GITHUB_SECRET is set" `
    'GITHUB_SECRET=\S{10,}' `
    "Create at: https://github.com/settings/applications/new"

Check `
    "RESEND_API_KEY is set" `
    'RESEND_API_KEY=re_' `
    "Get from: https://resend.com → API Keys" `
    'warn'

Check `
    "CREEM_API_KEY is set" `
    'CREEM_API_KEY=creem_' `
    "Get from: https://creem.io → Settings → API" `
    'warn'

# ── Placeholder detection ─────────────────────────────────────
if ($env -match 'your_|xxxx|replace-with|your-') {
    Write-Host "  [WARN] Placeholder values detected — some fields may not be filled in." -ForegroundColor Yellow
    $warn++
}

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Results: $pass OK   $warn Warnings   $fail Errors" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($fail -gt 0) {
    Write-Host "  Fix the errors above before running Docker." -ForegroundColor Red
} elseif ($warn -gt 0) {
    Write-Host "  Warnings found — optional services may not work." -ForegroundColor Yellow
    Write-Host "  You can still run Docker, but some features may be disabled." -ForegroundColor Yellow
} else {
    Write-Host "  All checks passed! You are ready to run start.bat" -ForegroundColor Green
}

Write-Host ""
Read-Host "Press Enter to exit"

