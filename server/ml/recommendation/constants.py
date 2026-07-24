"""
HelpGhar Recommendation Constants
"""

CATEGORY_MAPPING = {
    "House Servants": 1,
    "Drivers": 2,
    "Baby Sitters": 3,
    "Cooks": 4,
    "Home Teachers": 5,
    "Watchmen": 6,
    "Electricians": 7,
    "Plumbers": 8,
    "Cleaners": 9,
}

CITY_MAPPING = {
    "Karachi": 1,
    "Lahore": 2,
    "Islamabad": 3,
    "Rawalpindi": 4,
    "Peshawar": 5,
    "Quetta": 6,
}

# ------------------------------------------------------------
# Content-based scoring weights.
# These must sum to 100 -- the recommendation score is shown to
# customers as a "% Match" badge, so it has to stay bounded.
# ------------------------------------------------------------

SIMILARITY_WEIGHT = 30
MARKETPLACE_WEIGHT = 20
RATING_WEIGHT = 15
EXPERIENCE_WEIGHT = 5
POSITIVE_REVIEW_WEIGHT = 10
VERIFIED_WEIGHT = 3
AVAILABLE_WEIGHT = 2
PREFERENCE_WEIGHT = 15

MAX_EXPERIENCE_YEARS = 15

# ------------------------------------------------------------
# Preference learning bonuses (sum == PREFERENCE_WEIGHT above)
# ------------------------------------------------------------

PREFERRED_CATEGORY_BONUS = 7
PREFERRED_CITY_BONUS = 4
PREFERRED_BUDGET_BONUS = 4
BUDGET_TOLERANCE = 5000

# Bookings needed before we fully trust a customer's learned
# preferences instead of discounting them.
PREFERENCE_CONFIDENCE_BOOKINGS = 5

# ------------------------------------------------------------
# Hybrid blending between content-based and collaborative score
# ------------------------------------------------------------

CONTENT_BLEND_WEIGHT = 0.60
COLLABORATIVE_BLEND_WEIGHT = 0.40

# Neighbors considered for collaborative filtering, and the
# saturation rate used to squash the unbounded raw similarity
# sum into a 0-100 range with diminishing returns.
MAX_COLLABORATIVE_NEIGHBORS = 50
COLLABORATIVE_SATURATION_RATE = 1.5