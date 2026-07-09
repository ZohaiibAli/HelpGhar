from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection
from model.booking_model import BookingCreate
from helper.auth_helper import get_current_customer
from helper.id_helper import generate_booking_id
from datetime import datetime

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/")
def create_booking(
    booking: BookingCreate,
    current_customer: dict = Depends(get_current_customer)
):
    booking_data = booking.dict()
    booking_data["id"] = generate_booking_id()
    booking_data["customerId"] = current_customer["customerId"]
    booking_data["status"] = "pending"
    booking_data["createdAt"] = datetime.utcnow().isoformat()

    booking_collection.insert_one(booking_data)

    return {
        "success": True,
        "message": "Booking created",
        "id": booking_data["id"]
    }


@router.get("/my")
def get_my_bookings(current_customer: dict = Depends(get_current_customer)):
    bookings = list(
        booking_collection.find({"customerId": current_customer["customerId"]})
    )
    for b in bookings:
        del b["_id"]

    return {"success": True, "bookings": bookings}


@router.get("/{booking_id}")
def get_booking(booking_id: str, current_customer: dict = Depends(get_current_customer)):
    booking = booking_collection.find_one({
        "id": booking_id,
        "customerId": current_customer["customerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    del booking["_id"]
    return {"success": True, "booking": booking}