@echo off
REM LinkFlow AI - Windows 快速启动脚本

setlocal enabledelayedexpansion

echo.
echo 🚀 LinkFlow AI 快速启动脚本 (Windows)
echo =====================================
echo.

REM 检查 Node.js
echo 1️⃣  检查 Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo    Node.js 版本: %NODE_VERSION%
echo.

REM 检查 pnpm
echo 2️⃣  检查 pnpm...
pnpm -v >nul 2>&1
if errorlevel 1 (
    echo ⚠️  pnpm 未安装，正在安装...
    npm install -g pnpm
)
for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
echo    pnpm 版本: %PNPM_VERSION%
echo.

REM 检查 .env.local
echo 3️⃣  检查环境配置...
if not exist ".env.local" (
    echo ❌ .env.local 不存在
    echo    请创建 .env.local 文件，参考 E2E_TEST_PLAN.md
    exit /b 1
)
echo ✅ .env.local 已存在
echo.

REM 安装依赖
echo 4️⃣  安装依赖...
if not exist "node_modules" (
    echo    正在安装依赖...
    call pnpm install
) else (
    echo    依赖已安装，跳过
)
echo.

REM 检查数据库连接
echo 5️⃣  检查数据库连接...
call pnpm run test:db >nul 2>&1
if errorlevel 1 (
    echo ⚠️  数据库连接失败，请检查 DATABASE_URL
) else (
    echo ✅ 数据库连接成功
)
echo.

REM 代码检查
echo 6️⃣  运行代码检查...
echo    运行 linter...
call pnpm run lint >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Lint 检查有警告
) else (
    echo ✅ Lint 检查通过
)
echo.

REM 类型检查
echo    运行类型检查...
call pnpm run type-check >nul 2>&1
if errorlevel 1 (
    echo ❌ 类型检查失败
    exit /b 1
)
echo ✅ 类型检查通过
echo.

REM 构建检查
echo 7️⃣  构建检查...
echo    正在构建项目...
call pnpm run build >nul 2>&1
if errorlevel 1 (
    echo ❌ 构建失败
    exit /b 1
)
echo ✅ 构建成功
echo.

REM 启动开发服务器
echo 8️⃣  启动开发服务器...
echo.
echo ✨ 所有检查通过！
echo.
echo 🌐 应用将在以下地址启动:
echo    http://localhost:3003
echo.
echo 📝 测试账户:
echo    Email: test@example.com
echo    Password: TestPassword123!
echo.
echo 💳 Creem 测试卡:
echo    卡号: 4242 4242 4242 4242
echo    过期: 12/25
echo    CVC: 123
echo.
echo 按 Ctrl+C 停止服务器
echo.

call pnpm run dev

endlocal
