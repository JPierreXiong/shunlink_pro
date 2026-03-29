# Zeabur Worker 快速开始指南

## 🎯 5 分钟快速启动

### 1. 克隆代码并进入目录

```bash
cd ai_crew_linkflow_ai/linkflow-crew
```

### 2. 创建虚拟环境

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

创建 `.env` 文件:

```env
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech:6432/db?sslmode=require
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
OPENAI_API_KEY=sk-...
ZEABUR_CONTAINER_ID=worker-1
POLL_INTERVAL_SECONDS=5
MAX_TASK_RETRIES=3
```

### 5. 测试数据库连接

```bash
python -c "from database import check_connection; check_connection()"
```

应该看到:
```
[DB] Connection pool healthy (pool_size=2, max_overflow=0)
```

### 6. 启动 Worker (Mock 模式)

```bash
USE_MOCK_CREW=true python task_consumer.py
```

应该看到:
```
======================================================================
LinkFlow AI Task Consumer starting...
  Worker ID           : worker-1
  POLL_INTERVAL       : 5s
  MAX_RETRIES         : 3
  VERCEL_APP_URL      : (not set)
======================================================================
Task Consumer running. Polling for pending tasks...
```

### 7. 在另一个终端插入测试任务

```bash
psql $DATABASE_URL -c "
INSERT INTO backlink_tasks (
    user_id, target_url, anchor_text, platform_type, status
) VALUES (
    'user-123',
    'https://example.com',
    'My Backlink',
    'Web2.0',
    'pending'
) RETURNING id;
"
```

### 8. 观察 Worker 处理任务

在第一个终端应该看到:
```
[task] Processing {task_id} (retry=0)
[MOCK] MockBacklinkCrew created for task {task_id}
[MOCK] Simulating 15-30s of AI + browser work...
[MOCK] Outcome decided: success
[task] {task_id} -> success | live_url=https://mock-platform.example.com/post/...
```

---

## 📁 项目结构

```
ai_crew_linkflow_ai/linkflow-crew/
├── database.py                      # 数据库连接池
├── task_consumer.py                 # 主轮询循环
├── crew.py                          # BacklinkCrew 编排器
├── requirements.txt                 # Python 依赖
├── Dockerfile                       # Docker 镜像
├── .env.example                     # 环境变量模板
├── src/
│   ├── agents/
│   │   ├── manager_agent.py        # 决策 Agent
│   │   ├── browser_agent.py        # 执行 Agent
│   │   └── audit_agent.py          # 质检 Agent
│   ├── tools/
│   │   ├── browser_tools.py        # Playwright 工具
│   │   └── visual_tools.py         # 截图处理
│   └── tasks/
│       ├── manager_task.py         # Manager Task
│       ├── browser_task.py         # Browser Task
│       └── audit_task.py           # Audit Task
└── logs/                            # 日志目录
```

---

## 🔍 常见命令

### 查看日志

```bash
# 实时日志
tail -f logs/task_consumer.log

# 搜索特定任务
grep "task_id" logs/task_consumer.log

# 搜索错误
grep "ERROR" logs/task_consumer.log
```

### 数据库查询

```bash
# 查看待处理任务
psql $DATABASE_URL -c "SELECT id, status, retry_count FROM backlink_tasks WHERE status = 'pending';"

# 查看处理中的任务
psql $DATABASE_URL -c "SELECT id, status, worker_id FROM backlink_tasks WHERE status = 'processing';"

# 查看完成的任务
psql $DATABASE_URL -c "SELECT id, status, screenshot_url FROM backlink_tasks WHERE status = 'success';"

# 查看需要 2FA 的任务
psql $DATABASE_URL -c "SELECT id, status, twofa_prompt FROM backlink_tasks WHERE status = 'need_2fa';"
```

### 手动测试

```bash
# 1. 插入测试任务
psql $DATABASE_URL -c "
INSERT INTO backlink_tasks (user_id, target_url, anchor_text, platform_type, status)
VALUES ('user-123', 'https://example.com', 'Test Link', 'Web2.0', 'pending');
"

# 2. 启动 Worker
python task_consumer.py

# 3. 查看结果
psql $DATABASE_URL -c "SELECT id, status, screenshot_url FROM backlink_tasks ORDER BY created_at DESC LIMIT 1;"
```

---

## 🐛 调试技巧

### 启用详细日志

```bash
WORKER_LOG_LEVEL=DEBUG python task_consumer.py
```

### 测试特定功能

```bash
# 测试数据库连接
python -c "from database import get_db; session = get_db().__enter__(); print('OK')"

# 测试 Cloudinary
python -c "from src.tools.visual_tools import upload_to_cloudinary; print('OK')"

# 测试 Playwright
python -c "from src.tools.browser_tools import get_page; page = get_page(); print('OK')"
```

### 查看连接池状态

```bash
python -c "from database import get_pool_status; print(get_pool_status())"
```

---

## 🚀 部署到 Zeabur

### 1. 构建 Docker 镜像

```bash
docker build -t linkflow-worker:latest .
```

### 2. 测试镜像

```bash
docker run --env-file .env linkflow-worker:latest
```

### 3. 推送到镜像仓库

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag linkflow-worker:latest your-username/linkflow-worker:latest

# 推送
docker push your-username/linkflow-worker:latest
```

### 4. 在 Zeabur 部署

1. 登录 Zeabur 控制台
2. 创建新服务 → Docker
3. 输入镜像 URL: `your-username/linkflow-worker:latest`
4. 配置环境变量
5. 启动服务

---

## ✅ 验收清单

启动 Worker 后，检查以下项目:

- [ ] 日志显示 "Task Consumer running"
- [ ] 没有数据库连接错误
- [ ] 能正常轮询任务
- [ ] 能正常处理 Mock 任务
- [ ] 任务状态正确更新到数据库
- [ ] 没有内存泄漏 (运行 1 小时后)
- [ ] 能正确处理 SIGTERM 信号 (Ctrl+C)

---

## 📚 相关文档

- [架构设计](./ZEABUR_WORKER_ARCHITECTURE.md)
- [部署指南](./ZEABUR_DEPLOYMENT_GUIDE.md)
- [实现清单](./ZEABUR_IMPLEMENTATION_CHECKLIST.md)

---

## 💡 下一步

1. **完成 Phase 1**: 实现所有基础框架
2. **本地测试**: 使用 Mock Crew 进行端到端测试
3. **集成 CrewAI**: 将 stub 替换为真实的 Agent 实现
4. **部署到 Zeabur**: 在生产环境中运行

---

**需要帮助?** 查看日志或参考相关文档。

**最后更新**: 2026-03-21









