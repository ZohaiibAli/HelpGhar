from pydantic import BaseModel
from typing import Optional


class ThemeSettings(BaseModel):
    hue: int = 162
    saturation: int = 55
    lightness: int = 55
    corner_radius: int = 14


class WebsiteSettings(BaseModel):
    website_name: Optional[str] = ""
    website_logo: Optional[str] = None
    theme: ThemeSettings = ThemeSettings()


DEFAULT_THEME = {
    "hue": 162,
    "saturation": 55,
    "lightness": 55,
    "corner_radius": 14
}