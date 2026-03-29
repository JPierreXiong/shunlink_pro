# 🐳 Docker 快速命令参考

## 🚀 快速开始

### Windows (PowerShell)
```powershell
cd ai_crew_linkflow_ai/linkflow-crew
.\setup-docker-local.ps1
docker run --env-file .env linkflow-worker:latest
```

### Linux/Mac (Bash)
```bash
cd ai_crew_linkflow_ai/linkflow-crew
chmod +x setup-docker-local.sh
./setup-docker-local.sh
docker run --env-file .env linkflow-worker:latest
```

---

## 📋 常用命令速查表

### 镜像操作

| 命令 | 说明 |
|------|------|
| `docker build -t linkflow-worker:latest .` | 构建镜像 |
| `docker images` | 查看所有镜像 |
| `docker images \| grep linkflow` | 查看 linkflow 镜像 |
| `docker rmi linkflow-worker:latest` | 删除镜像 |
| `docker inspect linkflow-worker:latest` | 查看镜像详情 |
| `docker tag linkflow-worker:latest myrepo/linkflow:v1` | 标记镜像 |

### 容器操作

| 命令 | 说明 |
|------|------|
| `docker run --env-file .env linkflow-worker:latest` | 运行容器 |
| `docker run -it --env-file .env linkflow-worker:latest bash` | 交互模式 |
| `docker run -d --name linkflow --env-file .env linkflow-worker:latest` | 后台运行 |
| `docker ps` | 查看运行中的容器 |
| `docker ps -a` | 查看所有容器 |
| `docker logs <container-id>` | 查看日志 |
| `docker logs -f <container-id>` | 实时日志 |
| `docker stop <container-id>` | 停止容器 |
| `docker start <container-id>` | 启动容器 |
| `docker rm <container-id>` | 删除容器 |
| `docker exec -it <container-id> bash` | 进入容器 |
| `docker stats <container-id>` | 查看资源使用 |

### 调试命令

| 命令 | 说明 |
|------|------|
| `docker logs --tail 100 <container-id>` | 查看最后 100 行日志 |
| `docker logs <container-id> \| grep ERROR` | 查看错误日志 |
| `docker exec <container-id> ps aux` | 查看进程 |
| `docker exec <container-id> free -h` | 查看内存使用 |
| `docker exec <container-id> df -h` | 查看磁盘使用 |
| `docker inspect <container-id>` | 查看容器详情 |

### 清理命令

| 命令 | 说明 |
|------|------|
| `docker system prune` | 清理未使用的资源 |
| `docker builder prune` | 清理构建缓存 |
| `docker volume prune` | 清理未使用的卷 |
| `docker network prune` | 清理未使用的网络 |

---

## 🔍 常见场景

### 场景 1: 构建并运行

```bash
# 1. 构建镜像
docker build -t linkflow-worker:latest .

# 2. 运行容器
docker run --env-file .env linkflow-worker:latest
```

### 场景 2: 后台运行并监控

```bash
# 1. 后台运行
docker run -d --name linkflow --env-file .env linkflow-worker:latest

# 2. 查看日志
docker logs -f linkflow

# 3. 查看资源使用
docker stats linkflow

# 4. 停止容器
docker stop linkflow
```

### 场景 3: 调试容器

```bash
# 1. 进入容器
docker exec -it linkflow bash

# 2. 查看日志文件
tail -f logs/task_consumer.log

# 3. 测试数据库连接
python -c "from database import check_connection; check_connection()"

# 4. 退出容器
exit
```

### 场景 4: 查看容器日志

```bash
# 查看所有日志
docker logs linkflow

# 查看最后 50 行
docker logs --tail 50 linkflow

# 实时查看
docker logs -f linkflow

# 查看错误
docker logs linkflow | grep ERROR

# 导出日志
docker logs linkflow > container.log
```

### 场景 5: 清理资源

```bash
# 停止所有容器
docker stop $(docker ps -q)

# 删除所有容器
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi $(docker images -q)

# 清理所有未使用资源
docker system prune -a
```

---

## 🐛 故障排查

### 问题: 镜像构建失败

```bash
# 查看详细错误
docker build --progress=plain -t linkflow-worker:latest .

# 清理缓存后重试
docker builder prune
docker build -t linkflow-worker:latest .
```

### 问题: 容器无法启动

```bash
# 查看错误日志
docker logs <container-id>

# 运行交互模式调试
docker run -it --env-file .env linkflow-worker:latest bash

# 检查环境变量
docker run --env-file .env linkflow-worker:latest env
```

### 问题: 数据库连接失败

```bash
# 测试连接
docker run -it --env-file .env linkflow-worker:latest \
  python -c "from database import check_connection; check_connection()"

# 检查环境变量
cat .env | grep DATABASE_URL
```

### 问题: 内存占用过高

```bash
# 查看内存使用
docker stats <container-id>

# 限制内存
docker run --memory=512m --env-file .env linkflow-worker:latest

# 查看进程
docker exec <container-id> ps aux
```

---

## 📊 性能测试

### 测试单个任务

```bash
# 1. 插入任务
psql $DATABASE_URL -c "
INSERT INTO backlink_tasks (user_id, target_url, anchor_text, platform_type, status)
VALUES ('user-123', 'https://example.com', 'Test', 'Web2.0', 'pending');
"

# 2. 运行容器并计时
time docker run --env-file .env linkflow-worker:latest

# 3. 查看结果
psql $DATABASE_URL -c "SELECT status FROM backlink_tasks ORDER BY created_at DESC LIMIT 1;"
```

### 测试并发处理

```bash
# 1. 插入 10 个任务
for i in {1..10}; do
  psql $DATABASE_URL -c "
  INSERT INTO backlink_tasks (user_id, target_url, anchor_text, platform_type, status)
  VALUES ('user-$i', 'https://example.com/$i', 'Test $i', 'Web2.0', 'pending');
  "
done

# 2. 运行容器
docker run --env-file .env linkflow-worker:latest

# 3. 查看成功率
psql $DATABASE_URL -c "
SELECT status, COUNT(*) FROM backlink_tasks 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
"
```

---

## 💡 提示

### 环境变量

```bash
# 查看容器中的环境变量
docker exec <container-id> env

# 传递单个环境变量
docker run -e DATABASE_URL=... linkflow-worker:latest

# 从文件读取环境变量
docker run --env-file .env linkflow-worker:latest
```

### 卷挂载

```bash
# 挂载日志目录
docker run -v $(pwd)/logs:/app/logs --env-file .env linkflow-worker:latest

# 挂载代码目录 (开发用)
docker run -v $(pwd):/app --env-file .env linkflow-worker:latest
```

### 网络

```bash
# 创建网络
docker network create linkflow-network

# 运行容器在指定网络
docker run --network linkflow-network --env-file .env linkflow-worker:latest

# 查看网络
docker network ls
docker network inspect linkflow-network
```

---

## 🎯 工作流

### 开发流程

```bash
# 1. 修改代码
# 编辑 task_consumer.py, crew.py 等

# 2. 重新构建镜像
docker build -t linkflow-worker:latest .

# 3. 运行容器测试
docker run --env-file .env linkflow-worker:latest

# 4. 查看日志
docker logs <container-id>

# 5. 调试
docker exec -it <container-id> bash
```

### 部署流程

```bash
# 1. 构建镜像
docker build -t linkflow-worker:latest .

# 2. 标记镜像
docker tag linkflow-worker:latest myrepo/linkflow-worker:v1.0

# 3. 推送到仓库
docker push myrepo/linkflow-worker:v1.0

# 4. 在 Zeabur 部署
# 使用镜像 URL: myrepo/linkflow-worker:v1.0
```

---

## 📚 更多信息

- 📖 [Docker 官方文档](https://docs.docker.com/)
- 📖 [Docker CLI 参考](https://docs.docker.com/engine/reference/commandline/cli/)
- 📖 [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- 📖 [Docker Compose 参考](https://docs.docker.com/compose/compose-file/)

---

**需要帮助?** 查看 [DOCKER_LOCAL_TESTING_GUIDE.md](./DOCKER_LOCAL_TESTING_GUIDE.md)









