"""
Worker payout details + per-job payouts.

Flow:
    escrow released (PIN / admin)  -> payout created (one per booking)
      worker has payout details    -> paid straight away to that account
      no payout details yet        -> "pending" until the worker adds them,
                                      then every pending payout is paid

Payments are simulated (there is no live bank / wallet API), so "paid"
means HelpGhar has recorded the transfer to the worker's saved account
with an AUTO-... reference. An admin can still mark a leftover pending
payout as paid by hand from the Payouts page. Payout details are validated here and are
shown in full only to admins -- workers see a masked copy.
"""

import re
from datetime import datetime

from pymongo import ReturnDocument

from config.db import booking_collection, counter_collection, db, worker_collection
from helper.price_helper import worker_payout

payout_collection = db["payouts"]

try:
    # One payout per booking, so a release can never pay a job twice.
    payout_collection.create_index("bookingId", unique=True)
    payout_collection.create_index([("status", 1), ("createdAt", -1)])
    payout_collection.create_index("workerId")
except Exception as e:
    print("Could not create payout indexes:", str(e))

METHODS = {"bank": "Bank account", "jazzcash": "JazzCash", "easypaisa": "Easypaisa"}

_IBAN = re.compile(r"^PK\d{2}[A-Z]{4}\d{16}$")
_MOBILE = re.compile(r"^03\d{9}$")


class PayoutError(ValueError):
    pass


def _normalise_mobile(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("92") and len(digits) == 12:
        digits = "0" + digits[2:]
    return digits


def validate_payout(method, account_title, bank_name=None, iban=None, mobile=None) -> dict:
    """Return a clean payout dict, or raise PayoutError with a user-facing message."""

    method = (method or "").strip().lower()
    if method not in METHODS:
        raise PayoutError("Choose a payout method: Bank account, JazzCash or Easypaisa.")

    title = re.sub(r"\s+", " ", (account_title or "")).strip()
    if not 3 <= len(title) <= 100:
        raise PayoutError("Enter the account title exactly as it appears on the account.")

    payout = {"method": method, "accountTitle": title}

    if method == "bank":
        bank = (bank_name or "").strip()
        if not 2 <= len(bank) <= 80:
            raise PayoutError("Enter your bank's name.")
        clean_iban = re.sub(r"\s+", "", iban or "").upper()
        if not _IBAN.match(clean_iban):
            raise PayoutError("Enter a valid Pakistani IBAN: PK + 22 characters, e.g. PK36SCBL0000001123456702.")
        payout.update({"bankName": bank, "iban": clean_iban})
    else:
        number = _normalise_mobile(mobile)
        if not _MOBILE.match(number):
            raise PayoutError(f"Enter your {METHODS[method]} mobile number, e.g. 03001234567.")
        payout["mobileNumber"] = number

    return payout


def title_matches_name(title: str, full_name: str) -> bool:
    """Loose check that the account belongs to the worker. Admins see a
    warning when it doesn't, alongside the CNIC they are verifying."""

    def words(s):
        return {w for w in re.sub(r"[^a-z\s]", " ", (s or "").lower()).split() if len(w) > 1}

    name_words, title_words = words(full_name), words(title)
    return bool(name_words) and len(name_words & title_words) >= min(2, len(name_words))


def masked(payout: dict | None) -> dict | None:
    if not payout:
        return None

    if payout.get("method") == "bank":
        iban = payout.get("iban", "")
        account = f"{iban[:2]}** **** **** **** {iban[-4:]}" if iban else ""
    else:
        number = payout.get("mobileNumber", "")
        account = f"{number[:4]}*****{number[-2:]}" if number else ""

    return {
        "method": payout.get("method"),
        "methodLabel": METHODS.get(payout.get("method"), payout.get("method")),
        "accountTitle": payout.get("accountTitle"),
        "bankName": payout.get("bankName"),
        "account": account,
        "updatedAt": payout.get("updatedAt"),
    }


def full_view(payout: dict | None) -> dict | None:
    """Admin view: everything needed to make the transfer."""
    if not payout:
        return None
    view = dict(payout)
    view["methodLabel"] = METHODS.get(payout.get("method"), payout.get("method"))
    view["account"] = payout.get("iban") or payout.get("mobileNumber")
    return view


def _next_payout_id() -> str:
    counter = counter_collection.find_one_and_update(
        {"_id": "payout"},
        {"$inc": {"sequence": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"PO-{counter['sequence']:04d}"


def auto_pay(payout: dict, worker: dict) -> dict | None:
    """Send a pending payout to the worker's saved account. Returns the
    updated payout, or None if it can't be paid (no details / already paid)."""

    details = worker.get("payout")
    if not details or payout.get("status") != "pending":
        return None

    return payout_collection.find_one_and_update(
        {"payoutId": payout["payoutId"], "status": "pending"},
        {"$set": {
            "status": "paid",
            "paidAt": datetime.utcnow().isoformat(),
            "paidBy": "auto",
            "reference": f"AUTO-{payout['payoutId']}",
            # Snapshot: later edits to the worker's details mustn't
            # rewrite where an old payment actually went.
            "paidTo": details,
        }},
        return_document=ReturnDocument.AFTER,
    )


def pay_pending_payouts(worker: dict) -> list:
    """Pay every pending payout of this worker (e.g. right after they add
    payout details). Returns the payouts that were paid."""
    paid = []
    for payout in payout_collection.find({"workerId": worker.get("workerId"), "status": "pending"}):
        done = auto_pay(payout, worker)
        if done:
            paid.append(done)
    return paid


def create_payout_for_booking(booking_id: str) -> None:
    """Called whenever escrow is released. Idempotent per booking. Pays the
    worker immediately when they have payout details saved."""

    booking = booking_collection.find_one({"bookingId": booking_id})
    if not booking or payout_collection.find_one({"bookingId": booking_id}):
        return

    worker = worker_collection.find_one({"workerId": booking.get("workerId")}) or {}

    payout = None
    try:
        payout = {
            "payoutId": _next_payout_id(),
            "bookingId": booking_id,
            "workerId": booking.get("workerId"),
            "workerName": worker.get("fullName") or booking.get("workerName", ""),
            "category": booking.get("category", ""),
            # The worker gets `amount` minus their 5% fee; both 5% cuts
            # (customer's platformFee + workerFee) stay with HelpGhar.
            "amount": worker_payout(booking),
            "jobAmount": booking.get("amount", 0),
            "workerFee": booking.get("workerFee", 0),
            "status": "pending",
            "createdAt": datetime.utcnow().isoformat(),
        }
        payout_collection.insert_one(payout)
    except Exception as e:
        # Duplicate key = a concurrent release already created it.
        if "duplicate key" not in str(e).lower():
            print("Could not create payout:", str(e))
        return

    auto_pay(payout, worker)


def serialize_payout(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc
