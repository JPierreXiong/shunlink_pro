"""
LinkFlow AI — Screenshot Storage

Uploads Playwright screenshots to cloud storage and returns a
public URL that can be stored in the database and shown in the
frontend dashboard.

Supports two backends:
  - Cloudinary  (set STORAGE_BACKEND=cloudinary in .env)
  - Vercel Blob (set STORAGE_BACKEND=vercel_blob in .env)
"""

import logging
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "cloudinary").lower()


def upload_screenshot(local_path: str, task_id: str) -> str:
    """
    Upload a local screenshot file to cloud storage.

    Args:
        local_path: Absolute path to the PNG/JPEG file.
        task_id:    Used as the public_id / filename in storage.

    Returns:
        A public HTTPS URL to the uploaded image.

    Raises:
        RuntimeError if upload fails.
    """
    if not Path(local_path).exists():
        raise FileNotFoundError(f"Screenshot not found: {local_path}")

    if STORAGE_BACKEND == "cloudinary":
        return _upload_cloudinary(local_path, task_id)
    elif STORAGE_BACKEND == "vercel_blob":
        return _upload_vercel_blob(local_path, task_id)
    else:
        raise ValueError(f"Unknown STORAGE_BACKEND: {STORAGE_BACKEND}")


def _upload_cloudinary(local_path: str, task_id: str) -> str:
    """Upload to Cloudinary using the REST API directly (no SDK needed)."""
    import cloudinary
    import cloudinary.uploader

    cloudinary_url = os.getenv("CLOUDINARY_URL")
    cloud_name = os.getenv("CLOUDINARY_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if (not cloudinary_url) and cloud_name and api_key and api_secret:
        cloudinary_url = f"cloudinary://{api_key}:{api_secret}@{cloud_name}"

    if not cloudinary_url:
        raise RuntimeError("Cloudinary config missing: set CLOUDINARY_URL or CLOUDINARY_NAME/API_KEY/API_SECRET")

    # cloudinary.config() auto-reads CLOUDINARY_URL from env
    cloudinary.config(cloudinary_url=cloudinary_url)

    public_id = f"linkflow/screenshots/{task_id}"

    logger.info(f"Uploading screenshot to Cloudinary: {public_id}")
    result = cloudinary.uploader.upload(
        local_path,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        folder="linkflow/screenshots",
    )

    url = result.get("secure_url", "")
    if not url:
        raise RuntimeError(f"Cloudinary upload failed: {result}")

    logger.info(f"Screenshot uploaded: {url}")
    return url


def _upload_vercel_blob(local_path: str, task_id: str) -> str:
    """Upload to Vercel Blob Storage using the REST API."""
    token = os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN")
    if not token:
        raise RuntimeError("VERCEL_BLOB_READ_WRITE_TOKEN environment variable is not set")

    filename = f"linkflow/screenshots/{task_id}_{int(time.time())}.png"

    with open(local_path, "rb") as f:
        file_data = f.read()

    logger.info(f"Uploading screenshot to Vercel Blob: {filename}")
    response = requests.put(
        f"https://blob.vercel-storage.com/{filename}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "image/png",
            "x-content-type": "image/png",
        },
        data=file_data,
        timeout=60,
    )

    if response.status_code not in (200, 201):
        raise RuntimeError(
            f"Vercel Blob upload failed [{response.status_code}]: {response.text}"
        )

    data = response.json()
    url = data.get("url", "")
    if not url:
        raise RuntimeError(f"Vercel Blob response missing URL: {data}")

    logger.info(f"Screenshot uploaded: {url}")
    return url


def cleanup_local_screenshot(local_path: str) -> None:
    """Delete the temporary local screenshot file after upload."""
    try:
        Path(local_path).unlink(missing_ok=True)
        logger.debug(f"Deleted local screenshot: {local_path}")
    except Exception as e:
        logger.warning(f"Could not delete local screenshot {local_path}: {e}")


