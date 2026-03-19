# 🎯 QStash 定时任务迁移

## 📌 概述

本次更新将 SoloBoard 的定时任务从 Vercel Cron 迁移到 Upstash QStash，解决了 Vercel 免费版每天只能运行 1 次的限制。

## 🚀 快速开始

### 1. 获取 QStash 凭证

访问 [Upstash Console](https://console.upstash.com/qstash) 获取凭证。

### 2. 配置环境变量

```bash
QSTASH_TOKEN=your_token
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key
CRON_SECRET=your_cron_secret
```

### 3. 部署并创建调度任务

```bash
# 部署代码
git push origin master

# 创建调度任务
pnpm run qstash:setup
```

## 📋 调度任务

创建后将有 6 个调度任务：

- **store-metrics-daily**: 每天 1 次 - 存储历史数据
- **check-alerts-offline**: 每 5 分钟 - 宕机检测
- **check-alerts-revenue-traffic**: 每 30 分钟 - 收入/流量异常
- **check-alerts-no-sales**: 每天 1 次 - 无销售检测
- **sync-sites-free-users**: 每天 2 次 - 免费用户同步
- **sync-sites-paid-users**: 每天 8 次 - 付费用户同步

## 📚 文档

- **QSTASH_QUICK_START.md** - 5 分钟快速开始
- **QSTASH_SETUP_GUIDE.md** - 完整配置指南
- **QSTASH_MIGRATION_COMPLETE.md** - 迁移详情

## 🔧 常用命令

```bash
# 查看调度任务
pnpm run qstash:list

# 删除所有任务
pnpm run qstash:delete

# 重新创建任务
pnpm run qstash:setup
```

## 💰 成本

- 免费额度: 500 次/月
- 超出后: $0.50/1000 次
- 预估: 100 用户约 $10/月

## ✅ 优势

- ✅ 支持更高频率调度（每 5 分钟）
- ✅ 差异化服务（免费/付费用户）
- ✅ 更安全的签名验证
- ✅ 详细的执行日志

---

**详细文档请查看 `QSTASH_SETUP_GUIDE.md`**






