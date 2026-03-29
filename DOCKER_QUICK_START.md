# 🐳 Docker 本地测试 - 快速启动指南

**目标**: 5 分钟内启动 Docker 容器进行本地测试  
**难度**: ⭐ 简单  
**时间**: 5-15 分钟

---

## ⚡ 超快速开始 (3 步)

### Step 1️⃣: 进入项目目录

```bash
cd ai_crew_linkflow_ai/linkflow-crew
```

### Step 2️⃣: 运行初始化脚本

#### Windows (PowerShell)
```powershell
.\setup-docker-local.ps1
```

#### Linux/Mac (Bash)
```bash
chmod +x setup-docker-local.sh
./setup-docker-local.sh
```

### Step 3️⃣: 运行容器

```bash
docker run --env-file .env linkflow-worker:latest
```

---

## ✅ 预期输出

如果一切正常，你应该看到:

```
======================================================================
LinkFlow AI Task Consumer starting...
  Worker ID           : worker-1
  POLL_INTERVAL       : 5s
  MAX_RETRIES         : 3
  CLEANUP_INTERVAL    : 3600s
  VERCEL_APP_URL      : (not set)
======================================================================
[Cleanup] Background cleanup thread started
Task Consumer running. Polling for pending tasks...
```

---

## 🔧 手动步骤 (如果脚本失败)

### 1. 检查 Docker

```bash
# 检查 Docker 是否安装
docker --version

# 检查 Docker 是否运行
docker ps
```

### 2. 创建 .env 文件

```bash
cat > .env << EOF
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech:6432/db?sslmode=require
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OPENAI_API_KEY=sk-...
ZEABUR_CONTAINER_ID=worker-1
POLL_INTERVAL_SECONDS=5
MAX_TASK_RETRIES=3
WORKER_LOG_LEVEL=INFO
HEADLESS=true
EOF
```

### 3. 构建镜像

```bash
docker build -t linkflow-worker:latest .
```

### 4. 运行容器

```bash
docker run --env-file .env linkflow-worker:latest
```

---

## 📝 配置 .env 文件

编辑 `.env` 文件，填入实际的配置值:

```env
# 必需: 数据库连接 (使用 Pooled URL)
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech:6432/database?sslmode=require

# 必需: Cloudinary 配置
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 必需: OpenAI 配置
OPENAI_API_KEY=sk-your-openai-key

# 可选: Worker 配置
ZEABUR_CONTAINER_ID=worker-1
POLL_INTERVAL_SECONDS=5
MAX_TASK_RETRIES=3
WORKER_LOG_LEVEL=INFO

# 可选: Vercel 回调
VERCEL_APP_URL=https://your-app.vercel.app
WORKER_SECRET=your-worker-secret
```

---

## 🧪 测试任务处理

### 在另一个终端插入测试任务

```bash
# 连接到数据库
psql $DATABASE_URL -c "
INSERT INTO backlink_tasks (user_id, target_url, anchor_text, platform_type, status)
VALUES ('user-123', 'https://example.com', 'Test Link', 'Web2.0', 'pending');
"
```

### 观察容器日志

容器应该会自动检测到新任务并处理:

```
[task] Processing {task_id} (retry=0)
[agent] Running task {task_id} | url=https://example.com | platform=Web2.0
[MOCK] MockBacklinkCrew created for task {task_id}
[MOCK] Simulating 15-30s of AI + browser work...
[MOCK] Outcome decided: success
[task] {task_id} -> success | live_url=https://mock-platform.example.com/post/...
```

### 验证任务完成

```bash
psql $DATABASE_URL -c "
SELECT id, status, screenshot_url FROM backlink_tasks 
WHERE id = '{task_id}';
"
```

---

## 🎯 常用命令

### 查看容器日志

```bash
# 获取容器 ID
CONTAINER_ID=$(docker ps -q -f ancestor=linkflow-worker:latest)

# 查看日志
docker logs $CONTAINER_ID

# 实时查看
docker logs -f $CONTAINER_ID

# 查看最后 50 行
docker logs --tail 50 $CONTAINER_ID
```

### 进入容器调试

```bash
# 进入容器
docker exec -it $CONTAINER_ID bash

# 查看日志文件
tail -f logs/task_consumer.log

# 测试数据库连接
python -c "from database import check_connection; check_connection()"

# 退出
exit
```

### 停止容器

```bash
# 停止
docker stop $CONTAINER_ID

# 删除
docker rm $CONTAINER_ID
```

---

## 🐛 常见问题

### Q: 镜像构建失败

```bash
# 清理缓存后重试
docker builder prune
docker build -t linkflow-worker:latest .
```

### Q: 容器无法启动

```bash
# 查看错误日志
docker logs <container-id>

# 检查 .env 文件
cat .env

# 测试数据库连接
psql $DATABASE_URL -c "SELECT 1"
```

### Q: 无法连接数据库

```bash
# 确保使用 Pooled URL (-pooler)
echo $DATABASE_URL

# 测试连接
psql $DATABASE_URL -c "SELECT 1"
```

---

## 📊 性能监控

### 查看容器资源使用

```bash
docker stats $CONTAINER_ID
```

### 查看性能统计

容器每处理 10 个任务会自动打印统计:

```
📊 Performance Statistics
  Tasks Processed    : 10
  Success            : 8 (80.0%)
  Failure            : 2 (20.0%)
  Avg Time           : 45.2s
  Uptime             : 450s
```

---

## 📚 更多信息

- 📖 [Docker 本地测试完整指南](./DOCKER_LOCAL_TESTING_GUIDE.md)
- 📖 [Docker 快速命令参考](./DOCKER_QUICK_REFERENCE.md)
- 📖 [Zeabur 部署指南](./ZEABUR_DEPLOYMENT_GUIDE.md)

---

## ✅ 检查清单

启动前确保:

- [ ] Docker 已安装
- [ ] Docker Daemon 正在运行
- [ ] .env 文件已配置
- [ ] DATABASE_URL 使用 Pooled URL (-pooler)
- [ ] 所有必要文件都存在 (Dockerfile, requirements.txt 等)

---

## 🎉 下一步

### 本地测试完成后

1. ✅ 验证所有功能正常
2. ✅ 检查性能指标
3. ✅ 查看日志输出
4. ✅ 准备部署到 Zeabur

### 部署到 Zeabur

1. 推送镜像到镜像仓库
2. 在 Zeabur 配置环境变量
3. 部署容器
4. 监控生产环境

---

**准备好了吗?** 👉 运行初始化脚本开始测试！

```bash
# Windows
.\setup-docker-local.ps1

# Linux/Mac
./setup-docker-local.sh
```

**需要帮助?** 查看 [DOCKER_LOCAL_TESTING_GUIDE.md](./DOCKER_LOCAL_TESTING_GUIDE.md)









