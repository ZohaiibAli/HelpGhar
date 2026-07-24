from fastapi import APIRouter, Depends

from helper.auth_helper import get_current_customer
from config.db import (
    booking_collection,
    payment_collection,
    review_collection,
)
from helper.auth_helper import get_current_customer, get_current_worker

    

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

    # Refunded payments no longer represent real spend -- exclude
    # them so a cancelled-after-paying booking doesn't keep inflating
    # this total forever.
    total_spent = sum(
        payment.get("total", 0)
        for payment in payments
        if payment.get("status") == "successful"
    )

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

@router.get("/worker")
def worker_dashboard(current_worker=Depends(get_current_worker)):
    worker_id = current_worker["workerId"]  # human-readable code, e.g. "WRK-0001"

    # All bookings for this worker
    all_bookings = list(
        booking_collection.find({"workerId": worker_id})
    )

    total_jobs = len(all_bookings)

    completed_bookings = [b for b in all_bookings if b.get("status") == "completed"]
    completed_jobs = len(completed_bookings)

    completion_rate = (
        round((completed_jobs / total_jobs) * 100, 1) if total_jobs else 0
    )

    # Total earnings from completed bookings only
    total_earnings = sum(b.get("total", 0) for b in completed_bookings)

    # Active jobs: pending / confirmed / in_progress
    active_jobs = [
        {
            "bookingId": b["bookingId"],
            "category": b.get("category"),
            "address": b.get("address"),
            "date": b.get("date"),
            "timeSlot": b.get("timeSlot"),
            "durationHours": b.get("durationHours"),
            "customerName": b.get("customerName"),
            "status": b.get("status"),
        }
        for b in all_bookings
        if b.get("status") in ("pending", "confirmed", "in_progress")
    ]

    # Reviews / rating
    reviews = list(review_collection.find({"workerId": worker_id}))
    reviews_count = len(reviews)
    avg_rating = (
        round(sum(r.get("rating", 0) for r in reviews) / reviews_count, 1)
        if reviews_count
        else 0
    )

    return {
        "success": True,
        "stats": {
            "totalJobs": total_jobs,
            "completedJobs": completed_jobs,
            "completionRate": completion_rate,
            "avgRating": avg_rating,
            "reviewsCount": reviews_count,
            "totalEarnings": total_earnings,
        },
        "activeJobs": active_jobs,
    }
