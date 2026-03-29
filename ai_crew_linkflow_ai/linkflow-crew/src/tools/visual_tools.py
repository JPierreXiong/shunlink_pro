"""
Visual Tools — 截图处理与云上传

功能:
  1. 给截图加水印 (Pillow)
  2. 上传到 Cloudinary
  3. 本地清理
"""

import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont
import cloudinary
import cloudinary.uploader

logger = logging.getLogger(__name__)

# 配置 Cloudinary (从环境变量读取)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def add_watermark(image_path: str, task_id: str) -> str:
    """
    给截图加水印并保存
    
    Args:
        image_path: 原始截图路径
        task_id: 任务 ID
    
    Returns:
        带水印的图片路径
    """
    try:
        # 打开图片
        img = Image.open(image_path)
        draw = ImageDraw.Draw(img)
        
        # 水印文字内容
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        watermark_text = f"Verified by ShunLink Pro | Task: {task_id} | {timestamp}"
        
        # 获取图片尺寸
        width, height = img.size
        
        # 尝试使用系统字体，如果失败则使用默认字体
        try:
            # Windows 字体路径
            font_path = "C:\\Windows\\Fonts\\arial.ttf"
            if not os.path.exists(font_path):
                # Linux/Mac 字体路径
                font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
            
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, 14)
            else:
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # 计算文字位置 (右下角)
        text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        x = width - text_width - 10
        y = height - text_height - 10
        
        # 绘制半透明背景 (可选)
        padding = 5
        draw.rectangle(
            [(x - padding, y - padding), (x + text_width + padding, y + text_height + padding)],
            fill=(0, 0, 0, 128)  # 半透明黑色
        )
        
        # 绘制文字 (红色)
        draw.text((x, y), watermark_text, fill=(255, 0, 0), font=font)
        
        # 保存带水印的图片
        watermarked_path = image_path.replace(".png", "_watermarked.png")
        img.save(watermarked_path)
        
        logger.info(f"[Watermark] Added watermark to {image_path} → {watermarked_path}")
        return watermarked_path
        
    except Exception as e:
        logger.error(f"[Watermark] Error adding watermark: {e}")
        # 如果水印失败，返回原始路径
        return image_path


def upload_to_cloudinary(image_path: str, task_id: str) -> Optional[str]:
    """
    上传截图到 Cloudinary
    
    Args:
        image_path: 图片路径
        task_id: 任务 ID
    
    Returns:
        Cloudinary 公开 URL 或 None
    """
    try:
        response = cloudinary.uploader.upload(
            image_path,
            folder="shunlink_proofs",
            public_id=f"proof_{task_id}",
            overwrite=True,
            resource_type="auto"
        )
        
        secure_url = response.get("secure_url")
        logger.info(f"[Cloudinary] Uploaded {image_path} → {secure_url}")
        return secure_url
        
    except Exception as e:
        logger.error(f"[Cloudinary] Upload failed: {e}")
        return None


def cleanup_local_files(original_path: str, watermarked_path: str):
    """
    清理本地临时文件
    
    Args:
        original_path: 原始截图路径
        watermarked_path: 带水印的截图路径
    """
    try:
        if os.path.exists(original_path):
            os.remove(original_path)
            logger.info(f"[Cleanup] Removed {original_path}")
        
        if os.path.exists(watermarked_path):
            os.remove(watermarked_path)
            logger.info(f"[Cleanup] Removed {watermarked_path}")
    except Exception as e:
        logger.warning(f"[Cleanup] Error removing files: {e}")


def process_and_upload_proof(local_path: str, task_id: str) -> Optional[str]:
    """
    完整流程: 水印 → 上传 → 清理
    
    Args:
        local_path: 本地截图路径
        task_id: 任务 ID
    
    Returns:
        Cloudinary 公开 URL 或 None
    """
    try:
        # 1. 添加水印
        watermarked_path = add_watermark(local_path, task_id)
        
        # 2. 上传到 Cloudinary
        proof_url = upload_to_cloudinary(watermarked_path, task_id)
        
        # 3. 清理本地文件
        cleanup_local_files(local_path, watermarked_path)
        
        return proof_url
        
    except Exception as e:
        logger.error(f"[ProcessProof] Error: {e}")
        return None









