from fastapi import APIRouter, Depends

from helper.auth_helper import get_current_customer
from config.db import (
    booking_collection,
    payment_collection,
    review_collection,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/customer")
def customer_dashboard(current_customer=Depends(get_current_customer)):
    # Active bookings
    active_bookings = booking_collection.count_documents(
        {
            "customerId": current_customer["customerId"],
            "status": {
                "$in": [
                    "pending",
                    "confirmed",
                    "in_progress",
                ]
            },
        }
    )

    # Total spent
    payments = list(
        payment_collection.find(
            {
                "customerId": current_customer["customerId"]
            }
        )
    )

    total_spent = 0

    for payment in payments:
        total_spent += payment["total"]

    # Favourite workers (unique workers booked)
    worker_ids = booking_collection.distinct(
        "workerId",
        {
            "customerId": current_customer["customerId"]
        },
    )

    favorite_workers = len(worker_ids)

    # Reviews left
    reviews_left = review_collection.count_documents(
        {
            "customerId": current_customer["customerId"]
        }
    )

    return {
        "success": True,
        "stats": {
            "activeBookings": active_bookings,
            "totalSpent": total_spent,
            "favoriteWorkers": favorite_workers,
            "reviewsLeft": reviews_left,
        },
    }