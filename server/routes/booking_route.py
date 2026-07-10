from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection, customer_collection
from model.booking_model import BookingCreate, BookingReschedule
from helper.auth_helper import get_current_customer, get_current_worker
from helper.id_helper import generate_booking_id
from datetime import datetime
from helper.auth_helper import get_current_admin

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/")
def create_booking(
    booking: BookingCreate,
    current_customer: dict = Depends(get_current_customer)
):
    booking_data = booking.dict()
    booking_data["bookingId"] = generate_booking_id()
    booking_data["customerId"] = current_customer["customerId"]
    booking_data["status"] = "pending"
    booking_data["createdAt"] = datetime.utcnow().isoformat()

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
        booking_collection.find({"workerId": current_worker["id"]})  # was ["workerId"]
    )
    for b in bookings:
        del b["_id"]
    return {"success": True, "bookings": bookings}



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
def worker_cancel_booking(booking_id: str, current_worker: dict = Depends(get_current_worker)):
    booking = booking_collection.find_one({
        "id": booking_id,
        "workerId": current_worker["id"]   # was ["workerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="This booking can no longer be cancelled")

    booking_collection.update_one({"bookingId": booking_id}, {"$set": {"status": "cancelled"}})
    return {"success": True, "message": "Booking cancelled"}


@router.patch("/{booking_id}/reschedule")
def worker_reschedule_booking(
    booking_id: str,
    payload: BookingReschedule,
    current_worker: dict = Depends(get_current_worker)
):
    booking = booking_collection.find_one({
        "id": booking_id,
        "workerId": current_worker["id"]   # was ["workerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be rescheduled")

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"date": payload.date, "timeSlot": payload.timeSlot}}
    )
    return {"success": True, "message": "Booking rescheduled"}


@router.patch("/{booking_id}/worker/cancel")
def complete_booking(booking_id: str, current_worker: dict = Depends(get_current_worker)):
    booking = booking_collection.find_one({
        "id": booking_id,
        "workerId": current_worker["id"]   # was ["workerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="This booking can no longer be cancelled")

    booking_collection.update_one({"bookingId": booking_id}, {"$set": {"status": "cancelled"}})
    return {"success": True, "message": "Booking cancelled"}


@router.patch("/{booking_id}/worker/reschedule")
def worker_reschedule_booking(
    booking_id: str,
    payload: BookingReschedule,
    current_worker: dict = Depends(get_current_worker)
):
    booking = booking_collection.find_one({
        "id": booking_id,
        "workerId": current_worker["id"]   # was ["workerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be rescheduled")

    booking_collection.update_one(
        {"bookingId": booking_id},
        {"$set": {"date": payload.date, "timeSlot": payload.timeSlot}}
    )
    return {"success": True, "message": "Booking rescheduled"}


@router.patch("/{booking_id}/complete")
def complete_booking(booking_id: str, current_worker: dict = Depends(get_current_worker)):
    booking = booking_collection.find_one({
        "id": booking_id,
        "workerId": current_worker["workerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] not in ("confirmed", "in_progress"):
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be marked completed")

    booking_collection.update_one({"bookingId": booking_id}, {"$set": {"status": "completed"}})
    return {"success": True, "message": "Booking marked as completed"}
@router.get("/admin/all")
def get_all_bookings(current_admin: dict = Depends(get_current_admin)):
    bookings = list(
        booking_collection.find().sort("createdAt", -1)
    )

    for booking in bookings:
        booking["_id"] = str(booking["_id"])

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

    booking_collection.update_one(
        {"bookingId": booking_id},
        {
            "$set": {
                "status": "cancelled"
            }
        }
    )

    return {
        "success": True,
        "message": "Booking cancelled"
    }
