# 🚀 QStash 快速部署指南

从 Vercel Cron 迁移到 QStash 的快速步骤。

## ⚡ 快速开始（5 分钟）

### 1️⃣ 获取 QStash 凭证

访问 [Upstash Console](https://console.upstash.com/qstash)，获取：

```bash
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx
```

### 2️⃣ 生成 CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3️⃣ 配置 Vercel 环境变量

```bash
vercel env add QSTASH_TOKEN
vercel env add QSTASH_CURRENT_SIGNING_KEY
vercel env add QSTASH_NEXT_SIGNING_KEY
vercel env add CRON_SECRET
```

或在 Vercel Dashboard 中手动添加。

### 4️⃣ 部署代码

```bash
git add .
git commit -m "Migrate to QStash"
git push origin master
```

### 5️⃣ 创建调度任务

```bash
pnpm run qstash:setup
```

### 6️⃣ 验证

访问 [Upstash Console](https://console.upstash.com/qstash) 查看调度任务。

## 📋 调度任务列表

创建后将有 6 个调度任务：

| 任务 | 频率 | 说明 |
|------|------|------|
| store-metrics-daily | 每天 1 次 | 存储历史数据 |
| check-alerts-offline | 每 5 分钟 | 宕机检测 |
| check-alerts-revenue-traffic | 每 30 分钟 | 收入/流量异常 |
| check-alerts-no-sales | 每天 1 次 | 无销售检测 |
| sync-sites-free-users | 每天 2 次 | 免费用户同步 |
| sync-sites-paid-users | 每天 8 次 | 付费用户同步 |

## 🧪 测试

```bash
# 测试免费用户同步
curl -X GET "https://your-app.vercel.app/api/cron/sync-sites?plan=free" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 测试付费用户同步
curl -X GET "https://your-app.vercel.app/api/cron/sync-sites?plan=paid" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔧 常用命令

```bash
# 查看调度任务
pnpm run qstash:list

# 删除所有任务
pnpm run qstash:delete

# 重新创建任务
pnpm run qstash:setup
```

## 📊 成本

- 免费额度: 500 次/月
- 超出后: $0.50/1000 次
- 预估: 100 用户约 $10/月

## 📚 详细文档

参考 `QSTASH_SETUP_GUIDE.md` 获取完整配置说明。

---

**完成！QStash 现在将自动执行定时任务。** ✅






