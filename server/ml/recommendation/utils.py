from .constants import CATEGORY_MAPPING, CITY_MAPPING


def encode_category(category: str) -> int:
    return CATEGORY_MAPPING.get(category, 0)


def encode_city(city: str) -> int:
    return CITY_MAPPING.get(city, 0)


def normalize(value, max_value):
    if max_value == 0:
        return 0

    return round(value / max_value, 3)