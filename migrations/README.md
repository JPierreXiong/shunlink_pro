# 📋 数据库迁移执行指南

## 🎯 迁移目的

修复数据库表结构，使其与代码一致：
1. 修复 `site_metrics_history` 表的字段名
2. 创建 `alert_rules` 表
3. 创建 `alert_history` 表

---

## 📁 SQL 文件位置

```
migrations/2026-03-09-alert-system.sql
```

---

## 🚀 执行步骤

### 方式 1: 在 Neon Dashboard 执行（推荐）

#### 步骤 1: 登录 Neon
```
https://console.neon.tech
```

#### 步骤 2: 选择项目和数据库
1. 选择您的项目
2. 点击左侧菜单的 "SQL Editor"

#### 步骤 3: 执行 SQL
1. 打开文件 `migrations/2026-03-09-alert-system.sql`
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 "Run" 按钮

#### 步骤 4: 验证结果
查看输出，应该看到：
```
✅ site_metrics_history.date 字段存在
✅ alert_rules 表已创建
✅ alert_history 表已创建

========================================
✅ 数据库迁移完成！
========================================

已完成的操作:
1. ✅ 修复 site_metrics_history 表字段
2. ✅ 创建 alert_rules 表
3. ✅ 创建 alert_history 表
4. ✅ 创建所有必要的索引
5. ✅ 添加外键约束
```

---

### 方式 2: 使用 psql 命令行

```bash
# 1. 设置数据库 URL
export DATABASE_URL="postgresql://neondb_owner:npg_au5XJdonk1Es@ep-mute-smoke-ainrvel2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 2. 执行迁移
psql $DATABASE_URL -f migrations/2026-03-09-alert-system.sql
```

---

### 方式 3: 使用 Drizzle Studio

```bash
# 1. 启动 Drizzle Studio
pnpm db:studio

# 2. 在浏览器中打开
# https://local.drizzle.studio

# 3. 手动创建表（不推荐，较复杂）
```

---

## ✅ 验证迁移成功

### 检查表是否存在

在 SQL Editor 中执行：

```sql
-- 检查 alert_rules 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'alert_rules'
ORDER BY ordinal_position;

-- 检查 alert_history 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'alert_history'
ORDER BY ordinal_position;

-- 检查 site_metrics_history 的 date 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'site_metrics_history' 
AND column_name = 'date';
```

### 预期结果

#### alert_rules 表应该有这些字段：
- id (text)
- user_id (text)
- site_id (text)
- type (text)
- threshold (integer)
- frequency (text)
- channels (text)
- enabled (boolean)
- last_triggered_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

#### alert_history 表应该有这些字段：
- id (text)
- rule_id (text)
- site_id (text)
- user_id (text)
- type (text)
- status (text)
- channels (text)
- data (jsonb)
- error_message (text)
- created_at (timestamp)

#### site_metrics_history 表应该有：
- date (text) ✅

---

## 🧪 迁移后测试

### 运行端到端测试

```bash
cd "d:\AIsoftware\SoloBoard_Command_center"
pnpm tsx scripts/e2e-test-complete.ts
```

### 预期结果

```
📊 测试结果总结
=====================================
Phase 1 - 用户注册: ✅ 通过
Phase 2 - 支付订阅: ✅ 通过
Phase 3 - 添加网站: ✅ 通过
Phase 4 - 配置 API: ✅ 通过
Phase 5 - 数据同步: ✅ 通过  ← 应该通过
Phase 6 - QStash 调度: ✅ 通过
Phase 7 - 报警系统: ✅ 通过  ← 应该通过

总测试数: 7
通过: 7
失败: 0
通过率: 100.0%

🎉 所有测试通过！
```

---

## 🐛 常见问题

### 问题 1: 权限不足

**错误信息**:
```
ERROR: permission denied for table alert_rules
```

**解决方案**:
确保您使用的是数据库所有者账号（neondb_owner）

---

### 问题 2: 表已存在

**错误信息**:
```
ERROR: relation "alert_rules" already exists
```

**解决方案**:
这是正常的，SQL 脚本使用了 `CREATE TABLE IF NOT EXISTS`，会自动跳过已存在的表。

---

### 问题 3: 外键约束失败

**错误信息**:
```
ERROR: foreign key constraint failed
```

**解决方案**:
确保 `user` 和 `monitored_sites` 表存在。如果不存在，需要先运行主迁移。

---

## 📊 迁移内容详情

### 1. 修复 site_metrics_history 表
- 将 `metric_date` 重命名为 `date`（如果存在）
- 添加 `date` 字段（如果不存在）
- 添加 `uptime_percentage` 字段（如果不存在）

### 2. 创建 alert_rules 表
- 11 个字段
- 3 个索引
- 2 个外键约束

### 3. 创建 alert_history 表
- 10 个字段
- 4 个索引
- 3 个外键约束

---

## ✅ 完成检查清单

迁移执行前：
- [ ] 已备份数据库（可选，Neon 自动备份）
- [ ] 已登录 Neon Dashboard
- [ ] 已打开 SQL Editor

迁移执行中：
- [ ] 复制 SQL 文件内容
- [ ] 粘贴到 SQL Editor
- [ ] 点击 "Run" 执行
- [ ] 查看执行结果

迁移执行后：
- [ ] 验证表已创建
- [ ] 验证字段正确
- [ ] 运行端到端测试
- [ ] 测试通过率 100%

---

## 🎉 迁移成功后

### 下一步操作

1. **运行测试**
   ```bash
   pnpm tsx scripts/e2e-test-complete.ts
   ```

2. **提交代码**
   ```bash
   git add migrations/2026-03-09-alert-system.sql
   git commit -m "feat: Add database migration for alert system"
   git push origin master
   ```

3. **部署到生产环境**
   - 在 Vercel 生产数据库执行相同的 SQL
   - 验证生产环境测试

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 SQL 执行日志
2. 验证数据库连接
3. 查看错误信息
4. 参考本文档的常见问题部分

---

**准备好了吗？现在就去 Neon Dashboard 执行迁移吧！** 🚀

执行完成后，运行测试命令验证：
```bash
pnpm tsx scripts/e2e-test-complete.ts
```



