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


# Chat attachments accept more than avatars do: people send a photo of
# the job, but also a quote or a receipt. Everything outside this set is
# rejected -- an open-ended upload endpoint behind a login is still an
# open-ended upload endpoint.
CHAT_IMAGE_TYPES = ALLOWED_CONTENT_TYPES

CHAT_DOCUMENT_TYPES = {
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

# 10 MB. Cloudinary's own free-tier limit sits at 10 MB for raw files, so
# anything larger would fail there anyway -- better to reject it here
# with a message that says why.
MAX_CHAT_FILE_BYTES = 10 * 1024 * 1024


def upload_chat_attachment(file, folder: str = "HelpGhar/chat"):
    """
    Uploads one chat attachment and returns the metadata the message
    document stores. Images go up as images (so Cloudinary can serve
    optimised variants); everything else goes up as `raw`.
    """

    content_type = file.content_type or ""

    is_image = content_type in CHAT_IMAGE_TYPES

    if not is_image and content_type not in CHAT_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only images, PDFs, text and Office documents can be attached."
        )

    # UploadFile is a SpooledTemporaryFile: seek to the end to size it,
    # then rewind so the upload still reads from byte zero.
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_CHAT_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Attachments must be 10 MB or smaller."
        )

    if size == 0:
        raise HTTPException(status_code=400, detail="That file is empty.")

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="image" if is_image else "raw",
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Attachment upload failed: {e}"
        )

    return {
        "url": result["secure_url"],
        "name": file.filename or "attachment",
        "type": "image" if is_image else "file",
        "mime": content_type,
        "size": size,
    }


# Voice notes recorded in the browser. Chrome/Firefox/Edge record
# webm/ogg (Opus); Safari records mp4 (AAC). The rest cover a phone
# uploading a clip it already has.
CHAT_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/x-m4a",
    "video/webm",  # Some browsers label an audio-only webm recording as video.
}

# Mirrors the recorder's auto-stop on the client, with headroom for the
# encoder's rounding.
MAX_VOICE_SECONDS = 180

MAX_VOICE_BYTES = 10 * 1024 * 1024


def _playback_url(secure_url: str) -> str:
    """
    The same asset, delivered as mp3. Cloudinary transcodes on request when
    the extension changes -- that's what lets a webm recorded in Chrome play
    on an iPhone, which doesn't decode Opus-in-webm.
    """
    return re.sub(r"\.\w+$", ".mp3", secure_url)


def upload_voice_note(file, client_duration: float | None = None, folder: str = "HelpGhar/chat/voice"):
    """Uploads one recorded voice note and returns the attachment metadata."""

    # MediaRecorder labels its output "audio/webm;codecs=opus" -- the codec
    # parameter is irrelevant to the allow-list.
    content_type = (file.content_type or "").split(";")[0].strip().lower()

    if content_type not in CHAT_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail="That doesn't look like a voice recording.")

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size == 0:
        raise HTTPException(status_code=400, detail="The recording is empty.")

    if size > MAX_VOICE_BYTES:
        raise HTTPException(status_code=413, detail="Voice messages must be 10 MB or smaller.")

    try:
        # Cloudinary files audio under the "video" resource type.
        result = cloudinary.uploader.upload(file.file, folder=folder, resource_type="video")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Voice upload failed: {e}")

    # Cloudinary measures the real length; the browser's figure is only a
    # fallback (and is never trusted to *allow* an over-long note).
    duration = result.get("duration") or client_duration or 0

    if duration > MAX_VOICE_SECONDS:
        try:
            cloudinary.uploader.destroy(result["public_id"], resource_type="video")
        except Exception:
            pass
        raise HTTPException(
            status_code=400,
            detail=f"Voice messages can be at most {MAX_VOICE_SECONDS // 60} minutes long.",
        )

    return {
        "url": result["secure_url"],
        "playbackUrl": _playback_url(result["secure_url"]),
        "name": "Voice message",
        "type": "audio",
        "mime": content_type,
        "size": size,
        "duration": round(float(duration), 1),
    }


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