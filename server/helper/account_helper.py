"""
Account moderation: suspend (temporary), block (until undone), restore.

Status values on customers/workers are always lowercase:
    "active" | "suspended" | "blocked"

A suspension carries `suspendedUntil` (ISO, UTC). Once that moment has
passed the account is restored automatically -- lazily whenever the
account is looked at (login, any API call, the admin users list) and
by a periodic sweep so a suspended worker's gigs come back even if the
worker never logs in.
"""

from datetime import datetime, timedelta

from config.db import (
    booking_collection,
    customer_collection,
    gig_collection,
    worker_collection,
)
from helper.escrow_helper import refund_escrow

ACTIVE = "active"
SUSPENDED = "suspended"
BLOCKED = "blocked"

SUSPENSION_DAYS = (3, 7, 30)

ROLE_COLLECTION = {"customer": customer_collection, "worker": worker_collection}
ROLE_ID_FIELD = {"customer": "customerId", "worker": "workerId"}

# Bookings a suspended/blocked worker can no longer honour.
_OPEN_BOOKING_STATUSES = ("pending", "confirmed", "in_progress")


def _now() -> datetime:
    return datetime.utcnow()


def _parse(value):
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(value) if value else None
    except ValueError:
        return None


def normalise_status(value) -> str:
    """Legacy records use "Active"/"Suspended" (capitalised) or nothing."""
    value = (value or ACTIVE).strip().lower()
    return value if value in (ACTIVE, SUSPENDED, BLOCKED) else ACTIVE


def _suspend_gigs(worker_id: str) -> None:
    # Only live listings, and remember which ones we touched so a
    # restore never resurrects a gig the worker had removed themselves.
    gig_collection.update_many(
        {"workerId": worker_id, "status": "Active"},
        {"$set": {"status": "Suspended", "suspendedByModeration": True}},
    )


def _restore_gigs(worker_id: str) -> None:
    gig_collection.update_many(
        {"workerId": worker_id, "suspendedByModeration": True},
        {"$set": {"status": "Active"}, "$unset": {"suspendedByModeration": ""}},
    )


def _cancel_worker_bookings(worker_id: str, by: str) -> list:
    """Cancel everything the worker still owes and refund held payments.
    Returns the cancelled bookings so the caller can notify customers."""

    bookings = list(
        booking_collection.find(
            {"workerId": worker_id, "status": {"$in": list(_OPEN_BOOKING_STATUSES)}}
        )
    )

    for booking in bookings:
        booking_collection.update_one(
            {"_id": booking["_id"], "status": {"$in": list(_OPEN_BOOKING_STATUSES)}},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelledBy": "admin_moderation",
                    "cancelledAt": _now().isoformat(),
                }
            },
        )
        refund_escrow(booking["bookingId"], by)

    return bookings


def apply_moderation(role: str, user: dict, action: str, reason: str,
                     days: int | None, admin_id: str, dispute_id: str | None):
    """
    Suspend or block an account. Returns the list of bookings that were
    cancelled as a result (workers only), for customer notifications.
    """

    collection = ROLE_COLLECTION[role]
    now = _now()
    until = (now + timedelta(days=days)).isoformat() if action == SUSPENDED else None

    entry = {
        "action": action,
        "reason": reason,
        "days": days if action == SUSPENDED else None,
        "until": until,
        "by": admin_id,
        "at": now.isoformat(),
        "disputeId": dispute_id,
    }

    collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "status": action,
                "suspendedUntil": until,
                "moderationReason": reason,
                "moderatedAt": now.isoformat(),
                "moderatedBy": admin_id,
            },
            "$push": {"moderationHistory": entry},
        },
    )

    cancelled = []
    if role == "worker":
        _suspend_gigs(user["workerId"])
        cancelled = _cancel_worker_bookings(user["workerId"], f"admin:{admin_id}")

    return cancelled


def warn_account(role: str, user: dict, reason: str | None, admin_id: str,
                 dispute_id: str | None) -> None:
    """Record an official warning. The account stays active."""

    now = _now().isoformat()
    ROLE_COLLECTION[role].update_one(
        {"_id": user["_id"]},
        {
            "$inc": {"warningsCount": 1},
            "$set": {"lastWarnedAt": now},
            "$push": {"moderationHistory": {
                "action": "warned",
                "reason": reason,
                "by": admin_id,
                "at": now,
                "disputeId": dispute_id,
            }},
        },
    )


def restore_account(role: str, user: dict, by: str) -> None:
    collection = ROLE_COLLECTION[role]
    now = _now().isoformat()

    collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"status": ACTIVE, "suspendedUntil": None, "moderationReason": None},
            "$push": {"moderationHistory": {"action": "restore", "by": by, "at": now}},
        },
    )

    if role == "worker":
        _restore_gigs(user["workerId"])


def refresh(role: str, user: dict) -> dict:
    """Auto-restore an expired suspension. Returns the up-to-date user."""

    if not user:
        return user

    status = normalise_status(user.get("status"))
    until = _parse(user.get("suspendedUntil"))

    if status == SUSPENDED and until and until <= _now():
        restore_account(role, user, "system:expired")
        user = ROLE_COLLECTION[role].find_one({"_id": user["_id"]})

    return user


def block_message(user: dict) -> str | None:
    """Why this account can't be used, or None if it's fine."""

    status = normalise_status(user.get("status"))
    reason = user.get("moderationReason")
    reason_text = f" Reason: {reason}." if reason else ""

    if status == SUSPENDED:
        until = _parse(user.get("suspendedUntil"))
        when = until.strftime("%d %b %Y, %H:%M UTC") if until else "further notice"
        return (
            f"Your account is suspended until {when}.{reason_text} "
            "Please contact HelpGhar support if you think this is a mistake."
        )

    if status == BLOCKED:
        return (
            f"Your account has been blocked.{reason_text} "
            "Please contact HelpGhar support if you think this is a mistake."
        )

    return None


def expire_suspensions() -> None:
    """Restore every account whose suspension has run out."""

    now = _now().isoformat()
    for role, collection in ROLE_COLLECTION.items():
        for user in collection.find(
            {"status": SUSPENDED, "suspendedUntil": {"$ne": None, "$lte": now}}
        ):
            restore_account(role, user, "system:expired")


def migrate_statuses() -> None:
    """
    One-off, idempotent: registration used to store "Active" while the
    admin toggle compared against "active", so the first Suspend click on
    a new account only changed the capitalisation. Normalise everything.
    """

    try:
        for collection in ROLE_COLLECTION.values():
            for value, target in (("Active", ACTIVE), ("Suspended", SUSPENDED), ("Blocked", BLOCKED)):
                collection.update_many({"status": value}, {"$set": {"status": target}})
            collection.update_many({"status": {"$exists": False}}, {"$set": {"status": ACTIVE}})

        # Accounts suspended through the old toggle have no end date --
        # treat them as blocked so they stay off until an admin restores.
        for collection in ROLE_COLLECTION.values():
            collection.update_many(
                {"status": SUSPENDED, "suspendedUntil": {"$in": [None]}},
                {"$set": {"status": BLOCKED}},
            )

        # The old toggle hid those workers' gigs without marking them, so
        # mark them now -- otherwise a restore wouldn't bring them back.
        for worker in worker_collection.find({"status": BLOCKED}, {"workerId": 1}):
            gig_collection.update_many(
                {"workerId": worker.get("workerId"), "status": "Suspended"},
                {"$set": {"suspendedByModeration": True}},
            )
    except Exception as e:
        print("Account status migration failed:", str(e))
