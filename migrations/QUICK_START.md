# ⚡ 数据库迁移 - 快速执行清单

## 📋 执行步骤（5 分钟）

### 1️⃣ 打开 Neon Dashboard
```
https://console.neon.tech
```

### 2️⃣ 进入 SQL Editor
- 选择您的项目
- 点击左侧 "SQL Editor"

### 3️⃣ 复制 SQL 文件
打开文件：`migrations/2026-03-09-alert-system.sql`

### 4️⃣ 执行 SQL
- 粘贴到 SQL Editor
- 点击 "Run" 按钮

### 5️⃣ 验证结果
应该看到：
```
✅ site_metrics_history.date 字段存在
✅ alert_rules 表已创建
✅ alert_history 表已创建
✅ 数据库迁移完成！
```

### 6️⃣ 运行测试
```bash
pnpm tsx scripts/e2e-test-complete.ts
```

### 7️⃣ 验证通过率
预期结果：
```
通过: 7/7
通过率: 100.0%
🎉 所有测试通过！
```

---

## ✅ 完成！

迁移成功后，您将拥有：
- ✅ 完整的报警系统数据库表
- ✅ 修复的字段名称
- ✅ 所有索引和外键约束
- ✅ 100% 测试通过率

---

## 📞 遇到问题？

参考详细文档：`migrations/README.md`



