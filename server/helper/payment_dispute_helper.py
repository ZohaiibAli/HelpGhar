"""
Payment disputes + "payment released" notifications.

Normal path:
    customer gives the PIN -> worker marks done -> escrow released ->
    payout created and (if the worker has payout details) sent straight
    to their account -> worker emailed.

Dispute path (customer won't give the PIN):
    worker opens a payment dispute on the held booking -> money stays in
    escrow, the booking can't be cancelled / rescheduled meanwhile ->
    an admin reviews and either RELEASES it to the worker (same payout
    path as above) or REFUNDS the customer -> both sides are emailed.
"""

from datetime import datetime

from fastapi import BackgroundTasks, HTTPException

from config.db import booking_collection, customer_collection, dispute_collection, worker_collection
from helper.email_helper import (
    payment_dispute_customer_outcome_email,
    payment_dispute_refunded_worker_email,
    payment_released_email,
    send_plain_email,
)
from helper.escrow_helper import ESCROW_BOOKING_STATUSES, refund_escrow, release_escrow
from helper.payout_helper import masked, payout_collection
from helper.price_helper import worker_payout

PAYMENT_DISPUTE = "payment"


def queue_payment_released_email(background_tasks: BackgroundTasks, booking_id: str,
                                 after_dispute: str | None = None) -> None:
    """Tell the worker their earnings were released -- and where they went."""

    booking = booking_collection.find_one({"bookingId": booking_id}) or {}
    worker = worker_collection.find_one({"workerId": booking.get("workerId")}) or {}
    if not worker.get("email"):
        return

    payout = payout_collection.find_one({"bookingId": booking_id}) or {}
    paid = payout.get("status") == "paid"

    background_tasks.add_task(
        send_plain_email,
        worker["email"],
        *payment_released_email(
            worker.get("fullName"),
            booking_id,
            booking.get("category"),
            payout.get("amount", worker_payout(booking)),
            masked(payout.get("paidTo")) if paid else None,
            payout.get("reference") if paid else None,
            after_dispute,
        ),
    )


def open_payment_dispute(booking: dict):
    """The still-open payment dispute on this booking, if any."""
    if not booking.get("paymentDisputeId"):
        return None
    return dispute_collection.find_one({
        "disputeId": booking["paymentDisputeId"],
        "type": PAYMENT_DISPUTE,
        "status": {"$ne": "Resolved"},
    })


def ensure_no_open_payment_dispute(booking: dict, action: str = "change") -> None:
    """Block cancel / reschedule while the admin is deciding where the money goes."""
    if open_payment_dispute(booking):
        raise HTTPException(
            status_code=409,
            detail=(
                f"You can't {action} this booking while payment dispute "
                f"{booking['paymentDisputeId']} is being reviewed by HelpGhar."
            ),
        )


def close_payment_dispute(booking: dict, outcome: str, by: str, note: str | None = None) -> None:
    """Mark the booking's open payment dispute as resolved (no emails)."""
    dispute = open_payment_dispute(booking)
    if not dispute:
        return

    now = datetime.utcnow().isoformat()
    dispute_collection.update_one(
        {"disputeId": dispute["disputeId"]},
        {"$set": {
            "status": "Resolved",
            "resolvedAt": now,
            "resolution": {"decision": outcome, "note": note, "by": by, "at": now},
        }},
    )
    booking_collection.update_one(
        {"bookingId": booking["bookingId"]},
        {"$set": {"paymentDisputeOutcome": outcome}},
    )


def decide_payment_dispute(dispute: dict, decision: str, admin_id: str, note: str | None,
                           background_tasks: BackgroundTasks) -> str:
    """Admin decision: 'release' pays the worker, 'refund' returns the money
    to the customer. Returns a message for the admin."""

    if dispute.get("type") != PAYMENT_DISPUTE:
        raise HTTPException(status_code=400, detail="This is not a payment dispute")
    if dispute.get("status") == "Resolved":
        raise HTTPException(status_code=400, detail="This payment dispute has already been decided")

    booking = booking_collection.find_one({"bookingId": dispute.get("bookingId")})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get("status") not in ESCROW_BOOKING_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"This booking is already '{booking.get('status')}', so there is no held payment to decide on.",
        )

    by = f"admin:{admin_id}"
    now = datetime.utcnow().isoformat()

    if decision == "release":
        result = booking_collection.update_one(
            {"bookingId": booking["bookingId"], "status": {"$in": list(ESCROW_BOOKING_STATUSES)}},
            {"$set": {"status": "completed", "completedAt": now, "completedBy": "admin_dispute"}},
        )
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="This booking was just closed. Refresh and try again.")
        released = release_escrow(booking["bookingId"], by)
        outcome = "released"
    else:
        result = booking_collection.update_one(
            {"bookingId": booking["bookingId"], "status": {"$in": list(ESCROW_BOOKING_STATUSES)}},
            {"$set": {"status": "cancelled", "cancelledBy": "admin_dispute"}},
        )
        if not result.modified_count:
            raise HTTPException(status_code=409, detail="This booking was just closed. Refresh and try again.")
        released = refund_escrow(booking["bookingId"], by)
        outcome = "refunded"

    close_payment_dispute(booking, outcome, by, note)

    # ---- emails
    worker = worker_collection.find_one({"workerId": booking.get("workerId")}) or {}
    customer = customer_collection.find_one({"customerId": booking.get("customerId")}) or {}
    amount = worker_payout(booking)

    if outcome == "released":
        if released:
            queue_payment_released_email(background_tasks, booking["bookingId"], dispute["disputeId"])
    elif worker.get("email"):
        background_tasks.add_task(
            send_plain_email,
            worker["email"],
            *payment_dispute_refunded_worker_email(
                worker.get("fullName"), dispute["disputeId"], booking["bookingId"], amount, note
            ),
        )

    if customer.get("email"):
        background_tasks.add_task(
            send_plain_email,
            customer["email"],
            *payment_dispute_customer_outcome_email(
                customer.get("fullName"),
                dispute["disputeId"],
                booking["bookingId"],
                booking.get("workerName") or worker.get("fullName") or "the worker",
                outcome == "refunded",
                booking.get("total", amount),
                note,
            ),
        )

    if outcome == "released":
        payout = payout_collection.find_one({"bookingId": booking["bookingId"]}) or {}
        sent = " and sent to the worker's account" if payout.get("status") == "paid" else \
            " (the worker has no payout details yet; it's sent as soon as they add them)"
        return f"Payment released{sent}. Both sides have been emailed."
    return "Payment refunded to the customer. Both sides have been emailed."
