from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection, customer_collection, gig_collection, payment_collection
from model.booking_model import BookingCreate, BookingReschedule, BookingComplete
from helper.auth_helper import get_current_customer, get_current_worker
from helper.id_helper import generate_booking_id
from datetime import datetime
from pymongo import ReturnDocument
from helper.auth_helper import get_current_admin
from helper.escrow_helper import (
    PIN_MAX_ATTEMPTS,
    ESCROW_BOOKING_STATUSES,
    pin_matches,
    release_escrow,
    refund_escrow,
    strip_private,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

PLATFORM_FEE_RATE = 0.05

# Statuses that occupy a worker's slot / still owe (or already hold)
# money -- used for both the double-booking check and to decide which
# bookings are still cancellable.
ACTIVE_STATUSES = ("pending", "confirmed", "in_progress")


def _price_booking(gig: dict, duration_hours: int):
    """
    Mirrors the estimate shown in client/src/pages/BookingPage.tsx, but
    computed from the worker's actual gig listing in the database
    instead of trusting a client-supplied amount/platformFee/total --
    those were previously taken straight from the request body, which
    let a customer submit any price they wanted.
    """

    price_min = gig.get("priceMin", 0)
    price_max = gig.get("priceMax", 0)
    price_unit = gig.get("priceUnit", "hour")

    average_price = (price_min + price_max) / 2
    hourly_rate = average_price / 30 if price_unit == "month" else average_price

    amount = round(hourly_rate * duration_hours)
    platform_fee = round(amount * PLATFORM_FEE_RATE)
    total = amount + platform_fee

    return amount, platform_fee, total


def _refund_paid_booking(booking_id: str, refunded_by: str = "system"):
    """
    If this booking was paid for, the money is still in escrow ("held")
    -- give it back to the customer. Called from every cancel path
    (customer/worker/admin). No-op if the booking was never paid for.
    """

    refund_escrow(booking_id, refunded_by)


@router.post("/")
def create_booking(
    booking: BookingCreate,
    current_customer: dict = Depends(get_current_customer)
):
    # Price and worker identity are derived from the worker's real,
    # currently-active gig listing -- never trust the client for
    # either. This also rejects bookings for a worker/category that
    # doesn't actually have a live listing (e.g. deleted, suspended,
    # or a typo'd workerId), closing the impersonation gap where a
    # booking could previously be created with an arbitrary
    # workerId/workerName that didn't correspond to any real worker.
    gig = gig_collection.find_one({
        "workerId": booking.workerId,
        "category": booking.category,
        "status": "Active",
    })

    if not gig:
        raise HTTPException(
            status_code=404,
            detail="This worker's listing is no longer available for that service."
        )

    amount, platform_fee, total = _price_booking(gig, booking.durationHours)

    conflict = booking_collection.find_one({
        "workerId": booking.workerId,
        "date": booking.date,
        "timeSlot": booking.timeSlot,
        "status": {"$in": list(ACTIVE_STATUSES)},
    })

    if conflict:
        raise HTTPException(
            status_code=409,
            detail="This worker is already booked for that date and time slot."
        )

    booking_data = booking.dict()
    booking_data["bookingId"] = generate_booking_id()
    booking_data["customerId"] = current_customer["customerId"]
    booking_data["status"] = "pending"
    booking_data["createdAt"] = datetime.utcnow().isoformat()

    booking_data["workerName"] = gig.get("fullName", booking.workerName)
    booking_data["workerAvatar"] = gig.get("avatar", booking.workerAvatar)

    booking_data["amount"] = amount
    booking_data["platformFee"] = platform_fee
    booking_data["total"] = total

    customer_record = customer_collection.find_one({"customerId": current_customer["customerId"]})
    booking_data["customerName"] = customer_record.get("fullName") if customer_record else "Customer"
    booking_data["customerPhone"] = customer_record.get("phone") if customer_record else ""

    booking_collection.insert_one(booking_data)

    return {
        "success": True,
        "message": "Booking created",
        "bookingId": booking_data["bookingId"]
    }


@router.get("/my")
def get_my_bookings(current_customer: dict = Depends(get_current_customer)):
    bookings = list(
        booking_collection.find({"customerId": current_customer["customerId"]})
    )
    for b in bookings:
        del b["_id"]
    return {"success": True, "bookings": bookings}


@router.get("/worker/my")
def get_worker_bookings(current_worker: dict = Depends(get_current_worker)):

    bookings = list(
        booking_collection.find({
            "workerId": current_worker["workerId"]
        })
    )

    for b in bookings:
        del b["_id"]
        # The worker must get the PIN from the customer in person.
        strip_private(b)
        b["pinLocked"] = b.get("pinAttempts", 0) >= PIN_MAX_ATTEMPTS

    return {
        "success": True,
        "bookings": bookings
    }



@router.get("/{booking_id}")
def get_booking(booking_id: str, current_customer: dict = Depends(get_current_customer)):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "customerId": current_customer["customerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    del booking["_id"]
    return {"success": True, "booking": booking}


@router.patch("/{booking_id}/cancel")
def customer_cancel_booking(
    booking_id: str,
    current_customer: dict = Depends(get_current_customer)
):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "customerId": current_customer["customerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=400,
            detail="This booking can no longer be cancelled"
        )

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"status": "cancelled"}}
    )

    _refund_paid_booking(booking_id, "customer")

    return {
        "success": True,
        "message": "Booking cancelled"
    }


@router.patch("/{booking_id}/reschedule")
def customer_reschedule_booking(
    booking_id: str,
    payload: BookingReschedule,
    current_customer: dict = Depends(get_current_customer)
):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "customerId": current_customer["customerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Only confirmed bookings can be rescheduled"
        )

    booking_collection.update_one(
        {"bookingId": booking_id},
        {
            "$set": {
                "date": payload.date,
                "timeSlot": payload.timeSlot
            }
        }
    )

    return {
        "success": True,
        "message": "Booking rescheduled"
    }


@router.patch("/{booking_id}/worker/cancel")
def worker_cancel_booking(
    booking_id: str,
    current_worker: dict = Depends(get_current_worker)
):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "workerId": current_worker["workerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] not in ("pending", "confirmed"):
        raise HTTPException(
            status_code=400,
            detail="This booking can no longer be cancelled"
        )

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"status": "cancelled"}}
    )

    _refund_paid_booking(booking_id, "worker")

    return {
        "success": True,
        "message": "Booking cancelled"
    }


@router.patch("/{booking_id}/worker/reschedule")
def worker_reschedule_booking(
    booking_id: str,
    payload: BookingReschedule,
    current_worker: dict = Depends(get_current_worker)
):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "workerId": current_worker["workerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Only confirmed bookings can be rescheduled"
        )

    booking_collection.update_one(
        {"bookingId": booking_id},
        {
            "$set": {
                "date": payload.date,
                "timeSlot": payload.timeSlot
            }
        }
    )

    return {
        "success": True,
        "message": "Booking rescheduled"
    }

# on worker dashboard, worker clicks on start 
@router.patch("/{booking_id}/start")
def start_booking(booking_id: str, current_worker: dict = Depends(get_current_worker)):
    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "workerId": current_worker["workerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be started")

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"status": "in_progress"}}
    )

    return {"success": True, "message": "Booking started"}

@router.patch("/{booking_id}/complete")
def complete_booking(
    booking_id: str,
    payload: BookingComplete,
    current_worker: dict = Depends(get_current_worker)
):
    """
    The worker can only finish a job with the 4-digit PIN the customer
    hands over once the work is done. A correct PIN completes the
    booking and releases the escrowed payment to the worker.
    """

    booking = booking_collection.find_one({
        "bookingId": booking_id,
        "workerId": current_worker["workerId"]
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ESCROW_BOOKING_STATUSES:
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be marked completed")

    if not booking.get("completionPin"):
        raise HTTPException(
            status_code=400,
            detail="This booking has no completion PIN. Please contact HelpGhar support."
        )

    locked_message = (
        "This booking is locked after too many wrong PIN attempts. "
        "Please ask the customer to contact HelpGhar support, or raise a dispute."
    )

    if booking.get("pinAttempts", 0) >= PIN_MAX_ATTEMPTS:
        raise HTTPException(status_code=423, detail=locked_message)

    if not pin_matches(booking["completionPin"], payload.pin):
        # Count the attempt atomically and only while under the limit,
        # so parallel guesses can't get past the cap.
        updated = booking_collection.find_one_and_update(
            {"bookingId": booking_id, "pinAttempts": {"$not": {"$gte": PIN_MAX_ATTEMPTS}}},
            {"$inc": {"pinAttempts": 1}},
            return_document=ReturnDocument.AFTER,
        )
        attempts = (updated or {}).get("pinAttempts", PIN_MAX_ATTEMPTS)
        remaining = max(PIN_MAX_ATTEMPTS - attempts, 0)

        if remaining == 0:
            raise HTTPException(status_code=423, detail="Wrong PIN. " + locked_message)

        raise HTTPException(
            status_code=400,
            detail=f"Wrong PIN. {remaining} attempt{'s' if remaining != 1 else ''} left."
        )

    result = booking_collection.update_one(
        {"bookingId": booking_id, "status": {"$in": list(ESCROW_BOOKING_STATUSES)}},
        {
            "$set": {
                "status": "completed",
                "completedAt": datetime.utcnow().isoformat(),
                "completedBy": "worker_pin",
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="This booking was already closed.")

    release_escrow(booking_id, "worker_pin")

    return {
        "success": True,
        "message": "Job completed. Payment has been released to your earnings."
    }


@router.get("/admin/all")
def get_all_bookings(current_admin: dict = Depends(get_current_admin)):
    bookings = list(
        booking_collection.find().sort("createdAt", -1)
    )

    payments = {
        p["bookingId"]: p.get("status")
        for p in payment_collection.find({}, {"bookingId": 1, "status": 1})
    }

    for booking in bookings:
        booking["_id"] = str(booking["_id"])
        strip_private(booking)
        booking["paymentStatus"] = payments.get(booking["bookingId"], "unpaid")
        booking["pinLocked"] = booking.get("pinAttempts", 0) >= PIN_MAX_ATTEMPTS

    return {
        "success": True,
        "bookings": bookings
    }

@router.patch("/admin/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    booking = booking_collection.find_one(
        {"bookingId": booking_id}
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    if booking["status"] not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"This booking is already '{booking['status']}' and "
                "can no longer be cancelled"
            )
        )

    booking_collection.update_one(
        {"bookingId": booking_id},
        {
            "$set": {
                "status": "cancelled"
            }
        }
    )

    _refund_paid_booking(booking_id, "admin")

    return {
        "success": True,
        "message": "Booking cancelled"
    }


def _held_booking_or_400(booking_id: str):
    booking = booking_collection.find_one({"bookingId": booking_id})

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["status"] not in ESCROW_BOOKING_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"This booking is '{booking['status']}' -- its payment is not in escrow."
        )

    return booking


@router.patch("/admin/{booking_id}/escrow/release")
def admin_release_escrow(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Dispute override: the work was done but the customer won't (or
    can't) give the PIN. Completes the booking and pays the worker.
    """

    _held_booking_or_400(booking_id)

    booking_collection.update_one(
        {"bookingId": booking_id},
        {
            "$set": {
                "status": "completed",
                "completedAt": datetime.utcnow().isoformat(),
                "completedBy": "admin",
            }
        }
    )

    release_escrow(booking_id, "admin")

    return {"success": True, "message": "Payment released to the worker"}


@router.patch("/admin/{booking_id}/escrow/refund")
def admin_refund_escrow(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Dispute override: the work wasn't done. Cancels the booking and
    returns the escrowed money to the customer.
    """

    _held_booking_or_400(booking_id)

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"status": "cancelled", "cancelledBy": "admin"}}
    )

    refund_escrow(booking_id, "admin")

    return {"success": True, "message": "Payment refunded to the customer"}


@router.patch("/admin/{booking_id}/pin/unlock")
def admin_unlock_pin(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Reset the wrong-PIN counter so the worker can try again."""

    _held_booking_or_400(booking_id)

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"pinAttempts": 0}}
    )

    return {"success": True, "message": "PIN attempts reset"}
