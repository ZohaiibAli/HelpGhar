from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection
from model.booking_model import BookingCreate
from helper.auth_helper import get_current_customer
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
        b["id"] = str(b["_id"])
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

    booking["id"] = str(booking["_id"])
    del booking["_id"]
    return {"success": True, "booking": booking}

@router.get("/admin/all")
def get_all_bookings(current_admin: dict = Depends(get_current_admin)):
    bookings = list(
        booking_collection.find().sort("createdAt", -1)
    )

    for booking in bookings:
        booking["id"] = str(booking["_id"])
        del booking["_id"]

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