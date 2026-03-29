# setup-docker-local.ps1 - Docker local test environment init script (Windows)

Write-Host "LinkFlow AI Worker - Docker local test init" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1) Check Docker CLI
Write-Host "`n[1/6] Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker is installed" -ForegroundColor Green
    Write-Host $dockerVersion -ForegroundColor Green
}
catch {
    Write-Host "[ERR] Docker is not installed" -ForegroundColor Red
    Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# 2) Check Docker daemon
Write-Host "`n[2/6] Checking Docker daemon..." -ForegroundColor Yellow
docker ps | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Docker daemon is not running" -ForegroundColor Red
    Write-Host "Start Docker Desktop and run again" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Docker daemon is running" -ForegroundColor Green

# 3) Current directory
Write-Host "`n[3/6] Checking project directory..." -ForegroundColor Yellow
$ProjectDir = Get-Location
Write-Host "[OK] Project directory: $ProjectDir" -ForegroundColor Green

# 4) Required files
Write-Host "`n[4/6] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @("Dockerfile", "requirements.txt", "task_consumer.py", "database.py")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "[ERR] Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] All required files are present" -ForegroundColor Green

# 5) .env file
Write-Host "`n[5/6] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "[WARN] .env not found, creating template..." -ForegroundColor Yellow

    $envContent = @"
# Database (required)
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech:6432/database?sslmode=require

# Cloudinary (required)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI (required)
OPENAI_API_KEY=sk-your-openai-key

# Worker settings
ZEABUR_CONTAINER_ID=worker-1
POLL_INTERVAL_SECONDS=5
MAX_TASK_RETRIES=3
WORKER_LOG_LEVEL=INFO

# Vercel callback (optional)
VERCEL_APP_URL=https://your-app.vercel.app
WORKER_SECRET=your-worker-secret

# Playwright
HEADLESS=true
"@

    Set-Content -Path ".env" -Value $envContent
    Write-Host "[WARN] Please fill .env with real values, then rerun this script" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "[OK] .env exists" -ForegroundColor Green
}

# 6) Build image
Write-Host "`n[6/6] Building Docker image..." -ForegroundColor Yellow
$ImageName = "linkflow-worker:latest"
Write-Host "Building image: $ImageName" -ForegroundColor Yellow

docker build -t $ImageName .

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Docker image built successfully" -ForegroundColor Green
}
else {
    Write-Host "[ERR] Docker image build failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "Done. Docker local test environment is ready." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1) Run worker:  docker run --env-file .env $ImageName" -ForegroundColor Yellow
Write-Host "2) Interactive: docker run -it --env-file .env $ImageName bash" -ForegroundColor Yellow
Write-Host "3) List image:  docker images | findstr linkflow" -ForegroundColor Yellow
Write-Host "4) Remove img:  docker rmi $ImageName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tips:" -ForegroundColor Magenta
Write-Host "- Ensure DATABASE_URL points to the correct Neon instance" -ForegroundColor Gray
Write-Host "- Prefer pooled URL (-pooler suffix)" -ForegroundColor Gray
Write-Host "- First run may take longer due to Playwright browser download" -ForegroundColor Gray
