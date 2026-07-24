import re

import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def upload_image(file, folder: str = "HelpGhar/gigs") -> str:

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, WEBP or GIF images are allowed."
        )

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder
        )
    except Exception as e:
        # Previously unguarded -- if Cloudinary was unreachable or
        # rejected the file, this propagated as a raw unhandled 500.
        raise HTTPException(
            status_code=502,
            detail=f"Image upload failed: {e}"
        )

    return result["secure_url"]


def extract_public_id(url: str):
    """
    Best-effort extraction of a Cloudinary public_id from a
    secure_url, so a previously-uploaded asset can be deleted when
    it's replaced. Returns None if the URL doesn't look like a
    Cloudinary delivery URL.
    """

    if not url:
        return None

    match = re.search(r"/upload/(?:v\d+/)?(.+?)\.\w+$", url)

    return match.group(1) if match else None


def delete_image(url: str):
    """
    Best-effort cleanup of a replaced image. Never raises -- failing
    to delete an orphaned asset shouldn't break the request that's
    replacing it (e.g. logo/avatar update).
    """

    public_id = extract_public_id(url)

    if not public_id:
        return

    try:
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass