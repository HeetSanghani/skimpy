import os
from typing import Tuple, Optional, Union

import requests
from fastapi import HTTPException, UploadFile


def _is_svg_bytes(file_bytes: bytes) -> bool:
    if not file_bytes:
        return False
    head = file_bytes.lstrip()[:200].lower()
    return head.startswith(b"<svg") or head.startswith(b"<?xml") or b"<svg" in head


IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")


def _ensure_api_key() -> None:

    if not IMGBB_API_KEY:
        raise HTTPException(status_code=500, detail="IMGBB_API_KEY is not configured")


def upload_image_to_imgbb(file_or_bytes: Union[UploadFile, bytes]) -> Tuple[str, Optional[str]]:
    """
    Upload an image to ImgBB.

    Returns a tuple of (image_url, delete_url?). delete_url may be None if not provided.
    """
    _ensure_api_key()

    # Read file bytes from UploadFile or use provided bytes
    if isinstance(file_or_bytes, UploadFile):
        file_bytes = file_or_bytes.file.read() if hasattr(file_or_bytes, "file") else None
        if file_bytes is None or len(file_bytes) == 0:
            # In async contexts, caller may pass bytes directly
            raise HTTPException(status_code=400, detail="Invalid image file")
    else:
        file_bytes = file_or_bytes

    # SVG uploads are disabled. Please upload PNG.
    if _is_svg_bytes(file_bytes):
        raise HTTPException(status_code=400, detail="SVG images are not supported. Please upload a PNG image.")

    response = requests.post(
        "https://api.imgbb.com/1/upload",
        params={"key": IMGBB_API_KEY},
        files={"image": file_bytes},
    )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to upload image to ImgBB")

    data = response.json().get("data", {})

    # ImgBB free plan: data["url"] is the VIEWER page (blocked for embedding).
    # data["image"]["url"] and data["display_url"] are the real direct CDN URLs.
    image_url = (
        (data.get("image") or {}).get("url")   # preferred: direct CDN link
        or data.get("display_url")              # fallback 1
        or data.get("url")                      # fallback 2 (viewer page — may block)
    )
    delete_url = data.get("delete_url")

    if not image_url:
        raise HTTPException(status_code=502, detail="ImgBB did not return an image URL")

    return image_url, delete_url


