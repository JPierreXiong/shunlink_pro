# 🔐 敏感信息处理指南

**重要**: GitHub 检测到敏感信息泄露，已删除包含密钥的文件。

---

## ⚠️ 已删除的文件

1. ❌ `scripts/configure-api-keys.ts` - 包含 Google API Key
2. ❌ `sync-code-env-to-vercel.ts` - 包含 Supabase Service Key

---

## 🔐 安全建议

### 1. 立即轮换所有密钥

```bash
# 轮换以下密钥:
- Google API Key
- Supabase Service Key
- 所有其他 API 密钥
```

### 2. 更新 .gitignore

确保以下文件被忽略:

```
# 环境变量
.env
.env.local
.env.*.local

# 配置文件
*.key
*.pem
*.p12

# 脚本文件
scripts/configure-*.ts
*-env-to-*.ts
```

### 3. 使用环境变量

不要在代码中硬编码密钥，使用环境变量:

```typescript
// ❌ 错误
const API_KEY = "sk-1234567890abcdef";

// ✅ 正确
const API_KEY = process.env.GOOGLE_API_KEY;
```

### 4. 使用密钥管理服务

- **Vercel**: 使用 Environment Variables
- **Zeabur**: 使用 Variables 选项卡
- **GitHub**: 使用 Secrets

---

## 📋 检查清单

- [ ] 已删除包含密钥的文件
- [ ] 已轮换所有暴露的密钥
- [ ] 已更新 .gitignore
- [ ] 已配置环境变量
- [ ] 已在 GitHub 上强制推送 (如需要)

---

## 🚀 继续开始 Docker 测试

现在可以安全地继续进行 Docker 本地测试:

```bash
cd ai_crew_linkflow_ai/linkflow-crew

# Windows
.\setup-docker-local.ps1

# Linux/Mac
./setup-docker-local.sh
```

---

**安全第一！** 确保所有敏感信息都已妥善处理。









