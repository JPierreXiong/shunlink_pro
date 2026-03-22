#!/bin/bash

# LinkFlow AI - 快速启动脚本
# 用于本地开发和测试

set -e

echo "🚀 LinkFlow AI 快速启动脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Node.js 版本
echo -e "${BLUE}1️⃣  检查 Node.js 版本...${NC}"
NODE_VERSION=$(node -v)
echo "   Node.js 版本: $NODE_VERSION"
if [[ ! $NODE_VERSION =~ v22 ]]; then
  echo -e "${YELLOW}   ⚠️  建议使用 Node.js 22+${NC}"
fi
echo ""

# 检查 pnpm
echo -e "${BLUE}2️⃣  检查 pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}   pnpm 未安装，正在安装...${NC}"
  npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
echo "   pnpm 版本: $PNPM_VERSION"
echo ""

# 检查 .env.local
echo -e "${BLUE}3️⃣  检查环境配置...${NC}"
if [ ! -f .env.local ]; then
  echo -e "${RED}   ❌ .env.local 不存在${NC}"
  echo "   请创建 .env.local 文件，参考 E2E_TEST_PLAN.md"
  exit 1
fi
echo -e "${GREEN}   ✅ .env.local 已存在${NC}"
echo ""

# 安装依赖
echo -e "${BLUE}4️⃣  安装依赖...${NC}"
if [ ! -d "node_modules" ]; then
  echo "   正在安装依赖..."
  pnpm install
else
  echo "   依赖已安装，跳过"
fi
echo ""

# 检查数据库连接
echo -e "${BLUE}5️⃣  检查数据库连接...${NC}"
if pnpm run test:db 2>/dev/null; then
  echo -e "${GREEN}   ✅ 数据库连接成功${NC}"
else
  echo -e "${YELLOW}   ⚠️  数据库连接失败，请检查 DATABASE_URL${NC}"
fi
echo ""

# 代码检查
echo -e "${BLUE}6️⃣  运行代码检查...${NC}"
echo "   运行 linter..."
if pnpm run lint 2>/dev/null; then
  echo -e "${GREEN}   ✅ Lint 检查通过${NC}"
else
  echo -e "${YELLOW}   ⚠️  Lint 检查有警告${NC}"
fi
echo ""

# 类型检查
echo "   运行类型检查..."
if pnpm run type-check 2>/dev/null; then
  echo -e "${GREEN}   ✅ 类型检查通过${NC}"
else
  echo -e "${RED}   ❌ 类型检查失败${NC}"
  exit 1
fi
echo ""

# 构建检查
echo -e "${BLUE}7️⃣  构建检查...${NC}"
echo "   正在构建项目..."
if pnpm run build 2>/dev/null; then
  echo -e "${GREEN}   ✅ 构建成功${NC}"
else
  echo -e "${RED}   ❌ 构建失败${NC}"
  exit 1
fi
echo ""

# 启动开发服务器
echo -e "${BLUE}8️⃣  启动开发服务器...${NC}"
echo -e "${GREEN}✨ 所有检查通过！${NC}"
echo ""
echo "🌐 应用将在以下地址启动:"
echo "   http://localhost:3003"
echo ""
echo "📝 测试账户:"
echo "   Email: test@example.com"
echo "   Password: TestPassword123!"
echo ""
echo "💳 Creem 测试卡:"
echo "   卡号: 4242 4242 4242 4242"
echo "   过期: 12/25"
echo "   CVC: 123"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

pnpm run dev








