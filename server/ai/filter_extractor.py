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


SERVICE_CATEGORIES = [

    "electrician",

    "plumber",

    "cleaner",

    "maid",

    "tutor",

    "mechanic",

    "carpenter",

    "technician",

    "painter",

    "ac technician",

    "driver"

]




CITIES = [

    "lahore",

    "karachi",

    "islamabad",

    "rawalpindi",

    "multan",

    "faisalabad",

    "peshawar",

    "quetta"

]


def extract_filters(question: str):

    q = question.lower()

    filters = WorkerSearchFilters()

    for service in SERVICE_CATEGORIES:

        if service in q:

            filters.category = service

            break

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


    exp = re.search(

        r"(\d+)\s*(year|years)",

        q

    )

    if exp:

        filters.min_experience = int(

            exp.group(1)

        )

    rating = re.search(

        r"rating\s*(above)?\s*(\d+(\.\d+)?)",

        q

    )

    if rating:

        filters.min_rating = float(

            rating.group(2)

        )


    under = re.search(

        r"(under|below|less than)\s*rs?\.?\s*(\d+)",

        q

    )

    if under:

        filters.max_price = int(

            under.group(2)

        )



    above = re.search(

        r"(above|over|greater than)\s*rs?\.?\s*(\d+)",

        q

    )

    if above:

        filters.min_price = int(

            above.group(2)

        )


    return filters