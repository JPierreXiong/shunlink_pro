#!/bin/bash
set -e

echo ""
echo "================================================================"
echo "  LinkFlow AI — Mac/Linux Launcher"
echo "================================================================"
echo ""

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker Desktop is not running."
    echo "Please start Docker Desktop and try again."
    echo "Download: https://docker.com/products/docker-desktop/"
    exit 1
fi

# Check .env exists
if [ ! -f ".env" ]; then
    echo "[ERROR] .env file not found."
    echo "Please copy .env.example to .env and fill in your API keys:"
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env    # or open with any text editor"
    exit 1
fi

echo "[1/3] Stopping any previous containers..."
docker compose -f linkflow-ai/docker-compose.yml down

echo "[2/3] Building images (first run may take 5-10 minutes)..."
docker compose -f linkflow-ai/docker-compose.yml build

echo "[3/3] Starting LinkFlow AI..."
docker compose -f linkflow-ai/docker-compose.yml up -d

echo ""
echo "================================================================"
echo "  LinkFlow AI is running!"
echo "  Open your browser: http://localhost:3000"
echo ""
echo "  View logs:  docker compose -f linkflow-ai/docker-compose.yml logs -f"
echo "  Stop:       docker compose -f linkflow-ai/docker-compose.yml down"
echo "================================================================"
echo ""

# Auto-open browser on Mac
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
fi

