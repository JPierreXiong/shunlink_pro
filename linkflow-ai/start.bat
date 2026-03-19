@echo off
chcp 65001 >nul
echo.
echo ================================================================
echo   LinkFlow AI — Windows Launcher
echo ================================================================
echo.

:: Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop is not running.
    echo Please start Docker Desktop and try again.
    echo Download: https://docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check .env exists
if not exist ".env" (
    echo [ERROR] .env file not found.
    echo Please copy .env.example to .env and fill in your API keys.
    echo.
    echo   copy .env.example .env
    echo   Then edit .env with Notepad.
    pause
    exit /b 1
)

echo [1/3] Stopping any previous containers...
docker compose -f linkflow-ai\docker-compose.yml down

echo [2/3] Building images (first run may take 5-10 minutes)...
docker compose -f linkflow-ai\docker-compose.yml build
if errorlevel 1 (
    echo [ERROR] Build failed. Check error messages above.
    pause
    exit /b 1
)

echo [3/3] Starting LinkFlow AI...
docker compose -f linkflow-ai\docker-compose.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   LinkFlow AI is running!
echo   Open your browser: http://localhost:3000
echo.
echo   To view logs:  docker compose -f linkflow-ai\docker-compose.yml logs -f
echo   To stop:       docker compose -f linkflow-ai\docker-compose.yml down
echo ================================================================
echo.
start http://localhost:3000
pause

