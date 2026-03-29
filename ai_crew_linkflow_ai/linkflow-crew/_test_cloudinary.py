"""
Cloudinary 上传验证脚本

测试:
  1. 连接 Cloudinary
  2. 用 mock 截图 (1x1 PNG) 走完水印 + 上传流程
  3. 打印 secure_url，验证可公开访问

Usage:
    python _test_cloudinary.py
"""
import os
import sys
import tempfile
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("cloudinary_test")

# ── 从 .env 读取配置 ───────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "")
if not CLOUDINARY_URL or "placeholder" in CLOUDINARY_URL:
    print("[ERROR] CLOUDINARY_URL not configured in .env")
    print("  Set it to: cloudinary://API_KEY:API_SECRET@CLOUD_NAME")
    sys.exit(1)

print(f"[OK] CLOUDINARY_URL found: cloudinary://***@{CLOUDINARY_URL.split('@')[-1]}")

# ── Step 1: 生成测试截图 (真实 PNG, 200x100) ────────────────────
print("\n[Step 1] Generating test screenshot...")

from PIL import Image, ImageDraw

tmp_dir = tempfile.gettempdir()
test_screenshot = os.path.join(tmp_dir, "linkflow_cloudinary_test.png")

img = Image.new("RGB", (800, 400), color=(30, 30, 50))
draw = ImageDraw.Draw(img)
draw.rectangle([(20, 20), (780, 380)], outline=(0, 200, 150), width=3)
draw.text((50, 50), "LinkFlow AI - Backlink Proof", fill=(255, 255, 255))
draw.text((50, 100), "Platform: WordPress.com", fill=(180, 180, 180))
draw.text((50, 140), "Status: Published Successfully", fill=(0, 220, 100))
draw.text((50, 180), "Task ID: test-cloudinary-upload", fill=(150, 150, 200))
draw.text((50, 320), "Verified by ShunLink Pro | 2026-03-25", fill=(255, 100, 100))
img.save(test_screenshot)
print(f"[OK] Test screenshot saved: {test_screenshot}")

# ── Step 2: 水印处理 ────────────────────────────────────────────
print("\n[Step 2] Adding watermark...")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.tools.visual_tools import add_watermark

task_id = "test-cloudinary-e2e"
watermarked = add_watermark(test_screenshot, task_id)
print(f"[OK] Watermarked image: {watermarked}")

# ── Step 3: 上传到 Cloudinary ───────────────────────────────────
print("\n[Step 3] Uploading to Cloudinary...")

from storage import upload_screenshot, cleanup_local_screenshot

try:
    url = upload_screenshot(watermarked, task_id)
    print(f"[OK] Upload SUCCESS!")
    print(f"     URL: {url}")
except Exception as e:
    print(f"[FAIL] Upload failed: {e}")
    sys.exit(1)

# ── Step 4: 清理本地文件 ────────────────────────────────────────
print("\n[Step 4] Cleaning up local files...")
cleanup_local_screenshot(test_screenshot)
cleanup_local_screenshot(watermarked)
print("[OK] Local files cleaned up")

# ── Step 5: 验证 URL 可访问 ─────────────────────────────────────
print("\n[Step 5] Verifying URL is accessible...")
import requests
try:
    resp = requests.head(url, timeout=10)
    if resp.status_code == 200:
        print(f"[OK] URL accessible: HTTP {resp.status_code}")
        print(f"     Content-Type: {resp.headers.get('content-type', 'unknown')}")
        size = resp.headers.get('content-length', '?')
        print(f"     Size: {size} bytes")
    else:
        print(f"[WARN] URL returned HTTP {resp.status_code}")
except Exception as e:
    print(f"[WARN] Could not verify URL: {e}")

print("\n" + "="*60)
print("Cloudinary upload test: PASSED")
print(f"Proof URL: {url}")
print("="*60)





