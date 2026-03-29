# 使用 Python 3.11 官方镜像作为基础
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖（Playwright 运行浏览器所需的底层库）
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装 Python 包
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 重要：安装 Playwright 浏览器内核及系统依赖
# 我们只安装 chromium 以节省镜像体积
RUN playwright install chromium
RUN playwright install-deps chromium

# 复制项目所有文件
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs

# 设置环境变量（Zeabur 会自动覆盖其中的敏感信息）
ENV PYTHONUNBUFFERED=1
ENV HEADLESS=true

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "from database import check_connection; check_connection()" || exit 1

# 启动命令：运行你的任务消费者
CMD ["python", "task_consumer.py"]
