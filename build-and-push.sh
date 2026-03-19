#!/bin/bash

# SoloBoard 构建和推送脚本
# 使用方法: bash build-and-push.sh

echo "🚀 开始构建和推送流程"
echo "================================"

# Step 1: 构建项目
echo ""
echo "📦 Step 1: 构建项目..."
pnpm build

# 检查构建是否成功
if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "✅ 构建成功！"

# Step 2: 添加所有文件
echo ""
echo "📝 Step 2: 添加文件到 Git..."
git add .

# Step 3: 提交
echo ""
echo "💾 Step 3: 提交更改..."
git commit -m "feat: 完成端到端测试文档和自动化测试脚本

- 新增完整测试计划 (E2E_TEST_COMPLETE_2025.md)
- 新增自动化测试脚本 (scripts/e2e-test-complete.ts)
- 新增测试执行指南 (测试执行指南.md)
- 新增测试总结文档 (测试总结.md)
- 新增项目交付文档 (项目交付文档.md)
- 覆盖 7 个测试阶段，50+ 测试项
- 包含数据库验证和自动清理
- 完整的测试报告生成

测试覆盖:
- 用户注册和登录
- 支付订阅 (Creem)
- 添加网站
- 配置 API (GA4/Stripe/Lemon/Shopify)
- 数据同步
- QStash 调度
- 报警系统

文档统计:
- 新增文档: 5 个
- 总文档数: 20+ 个
- 代码行数: ~2,000 行
- 文档行数: ~5,000 行"

# Step 4: 推送到 GitHub
echo ""
echo "🚀 Step 4: 推送到 GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ 推送失败，请检查网络连接和权限"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 所有步骤完成！"
echo ""
echo "📊 提交内容:"
echo "  - 5 个新测试文档"
echo "  - 1 个自动化测试脚本"
echo "  - 1 个项目交付文档"
echo ""
echo "🎯 下一步:"
echo "  1. 运行测试: pnpm tsx scripts/e2e-test-complete.ts"
echo "  2. 配置 QStash: pnpm tsx scripts/setup-qstash-schedules.ts"
echo "  3. 部署到 Vercel"
echo ""

