#!/bin/bash
# setup-docker-local.sh — Docker 本地测试环境初始化脚本

set -e

echo "🐳 LinkFlow AI Worker - Docker 本地测试环境初始化"
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
echo -e "\n${YELLOW}[1/6]${NC} 检查 Docker 安装..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker 已安装${NC}"
docker --version

# 检查 Docker Daemon 是否运行
echo -e "\n${YELLOW}[2/6]${NC} 检查 Docker Daemon..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker Daemon 未运行${NC}"
    echo "请启动 Docker Desktop 或 Docker 服务"
    exit 1
fi
echo -e "${GREEN}✅ Docker Daemon 正在运行${NC}"

# 进入项目目录
echo -e "\n${YELLOW}[3/6]${NC} 进入项目目录..."
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo -e "${GREEN}✅ 项目目录: $PROJECT_DIR${NC}"

# 检查必要文件
echo -e "\n${YELLOW}[4/6]${NC} 检查必要文件..."
required_files=("Dockerfile" "requirements.txt" "task_consumer.py" "database.py")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ 缺少文件: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ 所有必要文件都存在${NC}"

# 创建 .env 文件（如果不存在）
echo -e "\n${YELLOW}[5/6]${NC} 检查环境变量文件..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，创建模板...${NC}"
    cat > .env << 'EOF'
# 数据库连接 (必需)
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech:6432/database?sslmode=require

# Cloudinary 配置 (必需)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# OpenAI 配置 (必需)
OPENAI_API_KEY=sk-your-openai-key

# Worker 配置
ZEABUR_CONTAINER_ID=worker-1
POLL_INTERVAL_SECONDS=5
MAX_TASK_RETRIES=3
WORKER_LOG_LEVEL=INFO

# Vercel 回调 (可选)
VERCEL_APP_URL=https://your-app.vercel.app
WORKER_SECRET=your-worker-secret

# Playwright 配置
HEADLESS=true
EOF
    echo -e "${YELLOW}⚠️  请编辑 .env 文件并填入实际的配置值${NC}"
    echo -e "${YELLOW}   然后重新运行此脚本${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env 文件已存在${NC}"
fi

# 构建 Docker 镜像
echo -e "\n${YELLOW}[6/6]${NC} 构建 Docker 镜像..."
IMAGE_NAME="linkflow-worker:latest"
echo -e "${YELLOW}构建镜像: $IMAGE_NAME${NC}"

docker build -t $IMAGE_NAME .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker 镜像构建成功${NC}"
else
    echo -e "${RED}❌ Docker 镜像构建失败${NC}"
    exit 1
fi

# 显示后续步骤
echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Docker 本地测试环境初始化完成！"
echo "==================================================${NC}"
echo ""
echo "📝 后续步骤:"
echo ""
echo "1️⃣  运行 Docker 容器 (Mock 模式):"
echo -e "   ${YELLOW}docker run --env-file .env $IMAGE_NAME${NC}"
echo ""
echo "2️⃣  运行 Docker 容器 (交互模式):"
echo -e "   ${YELLOW}docker run -it --env-file .env $IMAGE_NAME bash${NC}"
echo ""
echo "3️⃣  查看镜像信息:"
echo -e "   ${YELLOW}docker images | grep linkflow${NC}"
echo ""
echo "4️⃣  删除镜像:"
echo -e "   ${YELLOW}docker rmi $IMAGE_NAME${NC}"
echo ""
echo "💡 提示:"
echo "   - 确保 .env 文件中的 DATABASE_URL 指向正确的 Neon 实例"
echo "   - 使用 Pooled URL (-pooler 后缀) 以获得更好的连接管理"
echo "   - 第一次运行会下载 Playwright 浏览器，可能需要几分钟"
echo ""









