"""
Extract structured filters from user queries.

This module DOES NOT call Gemini.

It converts natural language into MongoDB filters.
"""

import re
from typing import Optional
from pydantic import BaseModel


class WorkerSearchFilters(BaseModel):

    category: Optional[str] = None

    city: Optional[str] = None

    gender: Optional[str] = None

    min_price: Optional[int] = None

    max_price: Optional[int] = None

    min_rating: Optional[float] = None

    min_experience: Optional[int] = None

    available: Optional[bool] = None

    verified: Optional[bool] = None


# ---------------------------------------------------------------------
# CATEGORY SYNONYMS
#
# Maps the canonical category name (must match the "category" value
# stored in MongoDB) to a list of phrases a user might actually type.
# This fixes the bug where "deep cleaning" / "ac repair" / "wiring
# issue" never resolved to a category, causing the search to fall back
# to an unfiltered query that returned arbitrary gigs.
# ---------------------------------------------------------------------

CATEGORY_SYNONYMS = {
    "Electrician": [
        "electrician", "electrical", "wiring", "wire", "switchboard",
        "switch board", "mcb", "short circuit", "fan installation",
        "light fitting",
    ],
    "Plumber": [
        "plumber", "plumbing", "pipe", "leak", "leakage", "drain",
        "blocked drain", "tap", "faucet", "water tank", "flush",
    ],
    "Cleaner": [
        "cleaner", "cleaning", "deep cleaning", "maid", "housekeeping",
        "sweeping", "mopping", "move-in cleaning", "move out cleaning",
    ],
    "Tutor": [
        "tutor", "tuition", "teacher", "o-level", "o level", "a-level",
        "a level", "home tutor", "matric", "coaching",
    ],
    "Mechanic": [
        "mechanic", "car repair", "bike repair", "vehicle repair",
        "engine", "car service",
    ],
    "Carpenter": [
        "carpenter", "carpentry", "furniture repair", "wood work",
        "woodwork",
    ],
    "Painter": [
        "painter", "painting", "paint job", "wall paint",
    ],
    "AC Technician": [
        "ac technician", "ac repair", "air conditioner", "ac service",
        "hvac", "ac gas", "ac installation",
    ],
    "Driver": [
        "driver", "driving service", "chauffeur",
    ],
}

CITIES = [
    "lahore", "karachi", "islamabad", "rawalpindi", "multan",
    "faisalabad", "peshawar", "quetta",
]


def extract_category(q: str) -> Optional[str]:
    """
    Returns the canonical category name (as stored in MongoDB) if any
    known synonym is found in the question, else None.
    """

    for canonical, synonyms in CATEGORY_SYNONYMS.items():

        for phrase in synonyms:

            if phrase in q:

                return canonical

    return None


def extract_filters(question: str) -> WorkerSearchFilters:

    q = question.lower()

    filters = WorkerSearchFilters()

    filters.category = extract_category(q)

    for city in CITIES:

        if city in q:

            filters.city = city.title()

            break

    if "female" in q:

        filters.gender = "Female"

    elif "male" in q:

        filters.gender = "Male"

    if "available" in q:

        filters.available = True

    if "verified" in q:

        filters.verified = True

    exp = re.search(r"(\d+)\s*(year|years)", q)

    if exp:

        filters.min_experience = int(exp.group(1))

    rating = re.search(r"rating\s*(above)?\s*(\d+(\.\d+)?)", q)

    if rating:

        filters.min_rating = float(rating.group(2))

    under = re.search(r"(under|below|less than)\s*rs?\.?\s*(\d+)", q)

    if under:

        filters.max_price = int(under.group(2))

    above = re.search(r"(above|over|greater than)\s*rs?\.?\s*(\d+)", q)

    if above:

        filters.min_price = int(above.group(2))

    return filters