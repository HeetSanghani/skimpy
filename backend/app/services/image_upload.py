import os
from typing import Tuple, Optional, Union

import requests
from fastapi import HTTPException, UploadFile


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

    response = requests.post(
        "https://api.imgbb.com/1/upload",
        params={"key": IMGBB_API_KEY},
        files={"image": file_bytes},
    )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to upload image to ImgBB")

    data = response.json().get("data", {})
    image_url = data.get("url")
    delete_url = data.get("delete_url")

    if not image_url:
        raise HTTPException(status_code=502, detail="ImgBB did not return an image URL")

    return image_url, delete_url


