from helper.cloudinary_helper import upload_image

from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException

from config.db import website_theme_collection
from helper.auth_helper import verify_token
from model.theme_model import DEFAULT_THEME


router = APIRouter(
    prefix="/admin",
    tags=["Website Settings"]
)

SETTINGS_ID = "singleton"  # only ever one website-settings document


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def serialize(settings):

    settings = settings or {}

    return {
        "website_name": settings.get("website_name", ""),
        "website_logo": settings.get("website_logo"),
        "theme": settings.get("theme", DEFAULT_THEME)
    }


@router.get("/get-website-settings")
def get_website_settings(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    settings = website_theme_collection.find_one({"_id": SETTINGS_ID})

    return {
        "success": True,
        "settings": serialize(settings)
    }


@router.get("/website-settings")
def website_settings():

    settings = website_theme_collection.find_one({"_id": SETTINGS_ID})

    return {
        "success": True,
        "settings": serialize(settings)
    }

@router.put("/update-website-settings")
def update_website_settings(
    website_name: str = Form(None),
    hue: int = Form(None),
    saturation: int = Form(None),
    lightness: int = Form(None),
    corner_radius: int = Form(None),
    logo: UploadFile = File(None),
    user=Depends(verify_token)
):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    update_fields = {}

    if website_name is not None:
        update_fields["website_name"] = website_name.strip()

    if logo is not None:
        logo_url = upload_image(logo)
        update_fields["website_logo"] = logo_url

    theme_fields_present = any(
        v is not None for v in [hue, saturation, lightness, corner_radius]
    )

    if theme_fields_present:

        existing = website_theme_collection.find_one({"_id": SETTINGS_ID}) or {}
        existing_theme = existing.get("theme", DEFAULT_THEME)

        update_fields["theme"] = {
            "hue": clamp(
                hue if hue is not None else existing_theme["hue"],
                0, 360
            ),
            "saturation": clamp(
                saturation if saturation is not None else existing_theme["saturation"],
                0, 100
            ),
            "lightness": clamp(
                lightness if lightness is not None else existing_theme["lightness"],
                20, 80
            ),
            "corner_radius": clamp(
                corner_radius if corner_radius is not None else existing_theme["corner_radius"],
                0, 24
            ),
        }

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    website_theme_collection.update_one(
        {"_id": SETTINGS_ID},
        {"$set": update_fields},
        upsert=True
    )

    settings = website_theme_collection.find_one({"_id": SETTINGS_ID})

    return {
        "success": True,
        "settings": serialize(settings)
    }
    