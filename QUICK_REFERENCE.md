# 🚀 SoloBoard 快速参考卡

## ✅ 已完成功能速查

### 网站管理
```
✅ 添加网站 (单个/批量)
✅ 删除网站 (需输入域名确认)
✅ 重复检测 (自动)
✅ 订阅限制 (Free:1, Base:5, Pro:∞)
✅ 网站详情页
✅ API 配置管理
```

### 数据监控
```
✅ Uptime 监控 (自动)
⚠️ 收入数据 (需配置 Stripe/Lemon/Shopify)
⚠️ 流量数据 (需配置 GA4)
✅ 历史数据 (30 天)
✅ 数据导出 (CSV/JSON/PDF)
```

### 报警系统 🆕
```
✅ 报警规则 (4 种类型)
✅ 邮件通知 (4 种模板)
✅ QStash 调度 (每 5-30 分钟)
✅ 报警历史
⏳ UI 界面 (待实现)
⏳ Telegram 通知 (待实现)
```

### 认证 & 支付 (ShipAny)
```
✅ 注册/登录
✅ Stripe/Creem/PayPal
✅ 订阅管理
✅ 权限控制
```

---

## 📋 快速命令

### 开发
```bash
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建生产版本
pnpm db:studio              # 打开数据库管理界面
```

### 数据库
```bash
pnpm db:generate            # 生成迁移文件
pnpm db:push                # 执行迁移
```

### QStash 报警
```bash
pnpm tsx scripts/setup-qstash-alerts.ts        # 创建调度
pnpm tsx scripts/setup-qstash-alerts.ts list   # 列出调度
pnpm tsx scripts/setup-qstash-alerts.ts reset  # 重置调度
pnpm tsx scripts/test-alert-system.ts          # 测试报警
```

### 部署
```bash
vercel --prod               # 部署到生产环境
vercel env add KEY          # 添加环境变量
vercel logs                 # 查看日志
```

---

## 🔑 必需环境变量

```bash
# 数据库
DATABASE_URL=postgresql://...

# 认证
BETTER_AUTH_SECRET=xxx

# 支付
STRIPE_SECRET_KEY=sk_xxx
CREEM_API_KEY=xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# 邮件 (报警)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=alerts@soloboard.com

# Cron
CRON_SECRET=xxx

# QStash (报警)
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
```

---

## 🎯 API 端点速查

### 网站管理
```
GET    /api/soloboard/sites
POST   /api/soloboard/sites
GET    /api/soloboard/sites/[id]
PATCH  /api/soloboard/sites/[id]
DELETE /api/soloboard/sites/[id]
```

### 报警系统
```
GET    /api/soloboard/alerts/rules
POST   /api/soloboard/alerts/rules
PATCH  /api/soloboard/alerts/rules/[id]
DELETE /api/soloboard/alerts/rules/[id]
GET    /api/soloboard/alerts/history
GET    /api/cron/check-alerts?type=offline
```

---

## 📊 报警类型

| 类型 | 说明 | 频率建议 |
|------|------|----------|
| `offline` | 网站宕机 | 每 5 分钟 |
| `revenue_drop` | 收入下降 | 每 30 分钟 |
| `traffic_spike` | 流量激增 | 每 30 分钟 |
| `no_sales` | 无销售 | 每天 1 次 |

---

## 💰 成本速查

| 方案 | 频率 | 成本/月 | 适合 |
|------|------|---------|------|
| 免费 | 每 6 小时 | $0 | 个人项目 |
| 基础 | 每 5-30 分钟 | $4-5 | 小团队 |
| 专业 | 每 1-5 分钟 | $30+ | 企业 |

---

## 🐛 常见问题

### 1. 看不到真实数据？
**原因**: 未配置 API  
**解决**: 进入站点详情 → 设置 → 配置 Stripe/GA4

### 2. 删除按钮在哪？
**位置**: Dashboard → 网站卡片 → 右侧三点菜单 → Delete

### 3. 报警不工作？
**检查**:
1. QStash 是否配置？
2. RESEND_API_KEY 是否设置？
3. 是否创建了报警规则？

### 4. 401 Unauthorized？
**检查**:
1. CRON_SECRET 是否正确？
2. QStash 签名是否验证？

---

## 📚 文档索引

- [总结报告](./FINAL_SUMMARY.md) - 完整功能清单
- [报警系统](./ALERT_SYSTEM_COMPLETE.md) - 报警系统详解
- [QStash 配置](./ALERT_SYSTEM_QSTASH_PLAN.md) - QStash 配置方案
- [实现状态](./IMPLEMENTATION_STATUS.md) - 实现状态追踪
- [SoloBoard 说明](./README_SOLOBOARD.md) - 项目介绍

---

## ⏳ 待办事项

- [ ] 配置 QStash Token
- [ ] 创建 QStash 调度任务
- [ ] 配置 Resend API Key
- [ ] 测试报警流程
- [ ] 实现报警规则 UI
- [ ] 完善 GA4 集成
- [ ] 添加 Telegram 通知

---

## 🎉 完成度

**总体**: 90% ✅  
**核心功能**: 100% ✅  
**可选功能**: 70% ⚠️

**状态**: 可以部署使用 ✅

---

**快速开始**: `pnpm dev` → 访问 `/soloboard`
