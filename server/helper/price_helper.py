"""
Single source of truth for gig pricing.

A gig has ONE `price` per `priceUnit` ("hour" | "day" | "month"). Older
gigs were stored with a priceMin/priceMax range instead; for those the
midpoint is used, so every caller can read a price without caring which
shape the document is in.
"""

# HelpGhar takes 5% from BOTH sides of every booking:
#   customer pays  amount + 5%   (platformFee)
#   worker gets    amount - 5%   (workerFee is deducted on release)
# e.g. a Rs. 20,000 job -> customer pays 21,000, worker receives 19,000.
PLATFORM_FEE_RATE = 0.05
WORKER_FEE_RATE = 0.05

PRICE_UNITS = ("hour", "day", "month")

# How long a single booking may run, per unit. These bound the server-side
# price calculation so a duration can't be used to inflate/underflow a charge.
DURATION_LIMITS = {
    "hour": (1, 12),
    "day": (1, 30),
    "month": (1, 12),
}


def gig_price(gig: dict) -> int:
    price = gig.get("price")
    if isinstance(price, (int, float)) and price > 0:
        return int(round(price))

    price_min = gig.get("priceMin") or 0
    price_max = gig.get("priceMax") or 0
    if price_min and price_max:
        return int(round((price_min + price_max) / 2))
    return int(price_min or price_max or 0)


def gig_unit(gig: dict) -> str:
    unit = gig.get("priceUnit")
    return unit if unit in PRICE_UNITS else "hour"


def format_price(gig: dict) -> str:
    return f"Rs. {gig_price(gig):,} / {gig_unit(gig)}"


def calculate_booking_price(gig: dict, duration: int):
    """amount = price x duration (in the gig's own unit); fee = 5% of amount."""
    amount = gig_price(gig) * duration
    platform_fee = round(amount * PLATFORM_FEE_RATE)
    return amount, platform_fee, amount + platform_fee


def calculate_worker_fee(amount: int):
    """The worker's side of the cut: (workerFee, workerPayout)."""
    worker_fee = round(amount * WORKER_FEE_RATE)
    return worker_fee, amount - worker_fee


def worker_payout(booking: dict) -> int:
    """What the worker actually receives for a booking. Bookings made before
    the worker fee existed have no `workerPayout` and keep their old terms
    (the full amount)."""
    payout = booking.get("workerPayout")
    if isinstance(payout, (int, float)):
        return int(payout)
    return int(booking.get("amount", 0) or 0)
