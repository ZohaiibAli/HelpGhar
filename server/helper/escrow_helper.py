"""
Escrow + completion PIN.

Money flow:
    customer pays          -> payment "held"     (HelpGhar holds it)
    worker enters the PIN  -> payment "released" (worker has earned it)
    booking cancelled      -> payment "refunded" (back to the customer)

The PIN is generated when the booking is paid for and is only ever shown
to the customer. The worker gets it from the customer in person once the
work is done, which is the proof the job actually happened.
"""

import secrets
from datetime import datetime

from config.db import booking_collection, payment_collection

PIN_MAX_ATTEMPTS = 5

# Booking statuses during which the customer's money sits in escrow.
ESCROW_BOOKING_STATUSES = ("confirmed", "in_progress")

# Fields that must never reach the worker (or anyone but the customer).
_PRIVATE_FIELDS = ("completionPin",)


def generate_pin() -> str:
    """Cryptographically random 4-digit PIN, zero-padded ("0042")."""
    return f"{secrets.randbelow(10000):04d}"


def pin_matches(expected: str, given: str) -> bool:
    return secrets.compare_digest(
        str(expected or "").encode(), str(given or "").strip().encode()
    )


def strip_private(booking: dict) -> dict:
    """Remove the completion PIN before a booking leaves the server for
    anyone other than the customer who owns it."""
    for field in _PRIVATE_FIELDS:
        booking.pop(field, None)
    return booking


def release_escrow(booking_id: str, released_by: str) -> None:
    payment_collection.update_one(
        {"bookingId": booking_id, "status": "held"},
        {
            "$set": {
                "status": "released",
                "releasedAt": datetime.utcnow().isoformat(),
                "releasedBy": released_by,
            }
        },
    )


def refund_escrow(booking_id: str, refunded_by: str = "system") -> None:
    payment_collection.update_one(
        {"bookingId": booking_id, "status": "held"},
        {
            "$set": {
                "status": "refunded",
                "refundedAt": datetime.utcnow().isoformat(),
                "refundedBy": refunded_by,
            }
        },
    )


def migrate_legacy_payments() -> None:
    """
    Before escrow, every payment was stored as "successful" the moment it
    was made. Convert those once, at startup (idempotent):
      - booking still active      -> "held", and the booking gets a PIN
      - anything else (completed) -> "released", so past earnings stay
    """

    try:
        for payment in payment_collection.find({"status": "successful"}):
            booking = booking_collection.find_one(
                {"bookingId": payment.get("bookingId")}
            )

            active = bool(
                booking and booking.get("status") in ESCROW_BOOKING_STATUSES
            )

            payment_collection.update_one(
                {"_id": payment["_id"]},
                {"$set": {"status": "held" if active else "released"}},
            )

        # Any paid, still-active booking without a PIN gets one so the
        # worker can still complete it; the customer sees it in My Bookings.
        for booking in booking_collection.find(
            {
                "status": {"$in": list(ESCROW_BOOKING_STATUSES)},
                "completionPin": {"$exists": False},
            }
        ):
            booking_collection.update_one(
                {"_id": booking["_id"]},
                {"$set": {"completionPin": generate_pin(), "pinAttempts": 0}},
            )
    except Exception as e:
        print("Escrow migration failed:", str(e))
