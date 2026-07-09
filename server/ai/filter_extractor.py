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
# stored in MongoDB, confirmed via gig_collection.distinct("category"))
# to a list of phrases a user might actually type.
# ---------------------------------------------------------------------

CATEGORY_SYNONYMS = {
    "House Servants": [
        "house servant", "house servants", "maid", "domestic help",
        "housemaid", "servant", "house help", "khadmat", "helper",
    ],
    "Drivers": [
        "driver", "drivers", "driving service", "chauffeur",
    ],
    "Baby Sitters": [
        "baby sitter", "babysitter", "baby sitters", "nanny",
        "childcare", "child care", "ayah",
    ],
    "Cooks": [
        "cook", "cooks", "chef", "cooking", "khansama",
    ],
    "Home Teachers": [
        "home teacher", "home teachers", "tutor", "tuition", "teacher",
        "teachers", "home tutor", "o-level", "o level", "a-level",
        "a level", "matric", "coaching",
    ],
    "Watchmen": [
        "watchman", "watchmen", "security guard", "guard", "chowkidar",
    ],
    "Electricians": [
        "electrician", "electricians", "electrical", "wiring", "wire",
        "switchboard", "switch board", "mcb", "short circuit",
    ],
    "Plumbers": [
        "plumber", "plumbers", "plumbing", "pipe", "leak", "leakage",
        "drain", "blocked drain", "tap", "faucet",
    ],
    "Cleaners": [
        "cleaner", "cleaners", "cleaning", "deep cleaning",
        "housekeeping", "sweeping", "mopping",
    ],
}

# ---------------------------------------------------------------------
# CITY ALIASES
#
# Your gigs collection has the same city stored multiple inconsistent
# ways (e.g. "Karachi", "Karachi ", "Khi", "khi"). Each canonical city
# maps to every spelling/abbreviation seen in the wild, and
# worker_service.build_query() uses these same aliases to build a
# regex that matches all known variants in the database.
# ---------------------------------------------------------------------

CITY_ALIASES = {
    "Karachi": ["karachi", "khi"],
    "Lahore": ["lahore"],
    "Islamabad": ["islamabad", "isb"],
    "Rawalpindi": ["rawalpindi", "pindi"],
    "Multan": ["multan"],
    "Faisalabad": ["faisalabad"],
    "Peshawar": ["peshawar"],
    "Quetta": ["quetta"],
}


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


def extract_city(q: str) -> Optional[str]:
    """
    Returns the canonical city name if any known alias/abbreviation is
    found in the question, else None.
    """

    for canonical, aliases in CITY_ALIASES.items():

        for alias in aliases:

            if alias in q:

                return canonical

    return None


def extract_filters(question: str) -> WorkerSearchFilters:

    q = question.lower()

    filters = WorkerSearchFilters()

    filters.category = extract_category(q)
    filters.city = extract_city(q)

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