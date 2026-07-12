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


def normalize_numbers(q: str) -> str:
    """
    Expands shorthand like "15k" -> "15000" and strips thousands
    commas like "15,000" -> "15000" so the price regexes below match
    consistently regardless of how the number was written.
    """

    q = re.sub(r"(\d+)\s*k\b", lambda m: str(int(m.group(1)) * 1000), q)
    q = re.sub(r"(\d),(\d{3})\b", r"\1\2", q)
    return q


def extract_filters(question: str) -> WorkerSearchFilters:

    q = normalize_numbers(question.lower())

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

    under = re.search(r"(under|below|less than|upto|up to)\s*rs?\.?\s*(\d+)", q)

    if under:

        filters.max_price = int(under.group(2))

    above = re.search(r"(above|over|greater than|more than)\s*rs?\.?\s*(\d+)", q)

    if above:

        filters.min_price = int(above.group(2))

    # -------------------------------------------------------------
    # Roman Urdu / mixed-language ceiling phrasing.
    #
    # Rather than enumerate every possible phrase ("andar", "tak",
    # "budget", "kam", and dozens of spelling variants people
    # actually type), use a broad fallback: if any recognised
    # "ceiling" indicator word appears anywhere in the message and a
    # number is present, treat that number as max_price. This is
    # intentionally loose - within a worker-search question, a stated
    # number next to any of these words is overwhelmingly likely to
    # be the person's budget ceiling, not something else.
    # -------------------------------------------------------------

    if filters.max_price is None:

        CEILING_INDICATORS = [
            "budget", "andar", "andr", "tak", "takk", "kam", "km",
            "under", "below", "less than", "upto", "up to", "max",
            "maximum", "se zyada nahi", "se kam", "bss", "bas", "sirf",
        ]

        if any(word in q for word in CEILING_INDICATORS):

            number_match = re.search(r"\d+", q)

            if number_match:

                filters.max_price = int(number_match.group())

    return filters