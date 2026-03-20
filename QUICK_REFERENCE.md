# LinkFlow AI - 快速参考指南

## 🎯 5 分钟快速开始

### 1. 环境配置
```bash
# 创建 .env.local 文件（参考下面的配置）
# 复制所有必需的环境变量
```

### 2. 启动应用
```bash
# Linux/Mac
./start-dev.sh

# Windows
start-dev.bat

# 或手动启动
pnpm install
pnpm run db:push
pnpm run dev
```

### 3. 访问应用
- 应用: http://localhost:3003
- 数据库: `pnpm run db:studio`

---

## 🔑 环境变量速查表

```env
# 数据库 (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_6r3PnCxiIbTt@ep-sweet-block-ah1rvh25-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Creem 支付
CREEM_ENABLED=true
CREEM_API_KEY=creem_test_1o4mxoT3PFuKs0dpWApGQf
CREEM_WEBHOOK_SECRET=whsec_1rF4xvsHn7bm7tgE2dzV1N
CREEM_PRODUCT_IDS={"trial_usd":"prod_4Y4lBGKsdhfOD7ejD3ztv8","base_usd":"prod_2g7Mu4ZN8dpgRFmgUJSKMJ","pro_usd":"prod_4Q8J71fNF2Tuig6WDe1Y3H"}

# 认证
BETTER_AUTH_SECRET=test-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3003

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3003
APP_URL=http://localhost:3003
APP_NAME=LinkFlow AI
DEFAULT_LOCALE=en

# Cloudinary
CLOUDINARY_URL=cloudinary://964981846976821:5sZ5IKvDvIRJpXqM3FvqtQ_fAeM@dhdqvckri
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhdqvckri
```

---

## 📋 常用命令

### 开发
```bash
pnpm run dev              # 启动开发服务器
pnpm run build            # 构建生产版本
pnpm run start            # 启动生产服务器
```

### 代码质量
```bash
pnpm run lint             # 运行 linter
pnpm run lint:fix         # 修复 lint 错误
pnpm run type-check       # 类型检查
pnpm run format           # 格式化代码
pnpm run check            # 运行所有检查
```

### 数据库
```bash
pnpm run db:generate      # 生成迁移
pnpm run db:push          # 推送迁移到数据库
pnpm run db:migrate       # 执行迁移
pnpm run db:studio        # 打开数据库管理界面
pnpm run test:db          # 测试数据库连接
```

### 测试
```bash
pnpm run verify-database           # 验证数据库
pnpm run test:creem-integration    # 测试 Creem 集成
```

---

## 🧪 测试账户

### 用户账户
```
Email: test@example.com
Password: TestPassword123!
```

### Creem 测试卡
```
卡号: 4242 4242 4242 4242
过期: 12/25
CVC: 123
```

### Creem 产品链接
- Trial ($5): https://www.creem.io/test/payment/prod_4Y4lBGKsdhfOD7ejD3ztv8
- Base ($19.90): https://www.creem.io/test/payment/prod_2g7Mu4ZN8dpgRFmgUJSKMJ
- Pro ($49.90): https://www.creem.io/test/payment/prod_4Q8J71fNF2Tuig6WDe1Y3H

---

## 🔍 故障排查

### 问题: 数据库连接失败
```bash
# 检查 DATABASE_URL
echo $DATABASE_URL

# 测试连接
pnpm run test:db

# 重新推送迁移
pnpm run db:push --force
```

### 问题: 认证失败
```bash
# 检查 BETTER_AUTH_SECRET
echo $BETTER_AUTH_SECRET

# 重启开发服务器
# Ctrl+C 停止，然后重新运行 pnpm run dev
```

### 问题: 支付失败
```bash
# 检查 Creem 配置
pnpm run test:creem-integration

# 验证产品 ID
echo $CREEM_PRODUCT_IDS
```

### 问题: 构建失败
```bash
# 清除缓存
rm -rf .next node_modules

# 重新安装和构建
pnpm install
pnpm run build
```

---

## 📊 API 端点

### 认证
```
POST   /api/auth/sign-up          # 注册
POST   /api/auth/sign-in          # 登录
POST   /api/auth/sign-out         # 登出
GET    /api/auth/session          # 获取会话
```

### 支付
```
POST   /api/payment/checkout      # 创建支付
GET    /api/payment/order/:id     # 获取订单
POST   /api/payment/notify/creem  # Creem Webhook
```

### 用户
```
GET    /api/user/profile          # 获取用户信息
PUT    /api/user/profile          # 更新用户信息
GET    /api/user/credits          # 获取积分
```

---

## 🌐 页面路由

### 公开页面
```
/                          # 首页
/pricing                   # 定价页面
/platforms                 # 支持的平台
/about                     # 关于我们
/faq                       # 常见问题
```

### 认证页面
```
/sign-up                   # 注册
/sign-in                   # 登录
/forgot-password           # 忘记密码
```

### 用户页面
```
/dashboard                 # 仪表板
/settings                  # 设置
/settings/billing          # 账单
/settings/profile          # 个人资料
```

---

## 📱 多语言支持

### 支持的语言
- English (en)
- 中文 (zh)
- Français (fr)

### 切换语言
```
http://localhost:3003/en/pricing
http://localhost:3003/zh/pricing
http://localhost:3003/fr/pricing
```

---

## 🚀 部署到 Vercel

### 快速部署
```bash
# 1. 上传到 GitHub
git add .
git commit -m "feat: LinkFlow AI"
git push origin main

# 2. 在 Vercel 中导入仓库
# https://vercel.com/new

# 3. 配置环境变量
# 添加所有 .env.local 中的变量

# 4. 部署
# Vercel 会自动部署
```

### 部署后验证
```bash
# 检查应用
curl https://linkflowai.vercel.app

# 检查数据库
# 访问 /api/health

# 检查支付
# 测试 Creem 支付流程
```

---

## 📈 性能优化

### 已实现的优化
- ✅ Next.js 15 (最新版本)
- ✅ 图片优化 (Cloudinary)
- ✅ 代码分割
- ✅ 缓存策略
- ✅ CDN 部署 (Vercel Edge)

### 监控指标
```bash
# 访问 Vercel Analytics
https://vercel.com/dashboard

# 检查 Core Web Vitals
# LCP (Largest Contentful Paint): < 2.5s
# FID (First Input Delay): < 100ms
# CLS (Cumulative Layout Shift): < 0.1
```

---

## 🔐 安全最佳实践

### 已实现
- ✅ HTTPS 加密
- ✅ 环境变量隔离
- ✅ CORS 配置
- ✅ 密码加密
- ✅ 会话管理

### 待实现
- [ ] 速率限制
- [ ] DDoS 防护
- [ ] WAF 配置
- [ ] 审计日志
- [ ] 安全头配置

---

## 📞 获取帮助

### 文档
1. [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md) - 端测计划
2. [GITHUB_UPLOAD_GUIDE.md](./GITHUB_UPLOAD_GUIDE.md) - GitHub 上传指南
3. [PROJECT_DELIVERY_CHECKLIST.md](./PROJECT_DELIVERY_CHECKLIST.md) - 项目交付清单

### 外部资源
- [Next.js 文档](https://nextjs.org/docs)
- [Creem API 文档](https://www.creem.io/docs)
- [Neon 文档](https://neon.tech/docs)
- [Vercel 文档](https://vercel.com/docs)

### 联系方式
- GitHub Issues: https://github.com/JPierreXiong/shunlink_pro/issues
- Email: support@linkflowai.app

---

## 🎯 下一步

1. ✅ 完成本地测试
2. ✅ 上传到 GitHub
3. ✅ 部署到 Vercel
4. ✅ 配置生产环境
5. ✅ 启动营销活动

---

**最后更新**: 2026-03-20  
**版本**: 1.0.0
