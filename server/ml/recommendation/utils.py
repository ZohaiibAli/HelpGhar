import math

from .constants import CATEGORY_MAPPING, CITY_MAPPING


def encode_category(category: str) -> int:
    return CATEGORY_MAPPING.get(category, 0)


def encode_city(city: str) -> int:
    return CITY_MAPPING.get(city, 0)


def normalize(value, max_value):
    if not max_value:
        return 0

    return round(value / max_value, 3)


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def saturate(value, rate=1.0, scale=100):
    """
    Squashes an unbounded non-negative value into [0, scale)
    with diminishing returns, instead of letting it grow without
    limit. Used for collaborative-filtering scores, which are a
    raw sum of similarities and would otherwise blow past 100.
    """

    if value <= 0:
        return 0.0

    return scale * (1 - math.exp(-rate * value))