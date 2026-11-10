from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from config.db import (
    customer_review_collection,
    booking_collection,
    customer_collection,
    worker_collection,
)
from helper.auth_helper import get_current_worker
from helper.id_helper import generate_customer_review_id

# Workers rating customers -- the reverse of routes/review_routes.py.
#
# Kept in its own collection on purpose: worker reviews feed sentiment
# analysis, marketplace ranking and recommendations, none of which apply
# to customers. Here the only consumer is a worker deciding whether to
# apply to a customer's job post.
router = APIRouter(prefix="/customer-reviews", tags=["Customer Reviews"])


class CustomerReviewCreate(BaseModel):
    bookingId: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


def _serialize(review: dict) -> dict:
    review.pop("_id", None)
    created = review.get("createdAt")
    if hasattr(created, "isoformat"):
        review["createdAt"] = created.isoformat()
    return review


def _recompute_customer_rating(customer_id: str) -> None:
    rows = list(customer_review_collection.aggregate([
        {"$match": {"customerId": customer_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]))
    avg = round(rows[0]["avg"], 1) if rows else 0
    count = rows[0]["count"] if rows else 0

    customer_collection.update_one(
        {"customerId": customer_id},
        {"$set": {"customerRating": avg, "customerReviewsCount": count}},
    )


@router.post("/")
def submit_customer_review(
    review: CustomerReviewCreate,
    current_worker: dict = Depends(get_current_worker),
):
    # Booking-scoped: only a job this worker actually completed for this
    # customer can be reviewed, and only once.
    booking = booking_collection.find_one({
        "bookingId": review.bookingId,
        "workerId": current_worker["workerId"],
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="You can only review a customer after the job is completed.")

    worker = worker_collection.find_one({"workerId": current_worker["workerId"]}) or {}
    customer = customer_collection.find_one({"customerId": booking["customerId"]}) or {}

    document = {
        "reviewId": generate_customer_review_id(),
        "bookingId": booking["bookingId"],
        "category": booking.get("category", ""),
        "workerId": current_worker["workerId"],
        "workerName": worker.get("fullName", booking.get("workerName", "")),
        "workerAvatar": worker.get("profileImage"),
        "customerId": booking["customerId"],
        "customerName": customer.get("fullName", booking.get("customerName", "")),
        "rating": review.rating,
        "comment": review.comment.strip(),
        "createdAt": datetime.utcnow(),
    }

    try:
        # The unique bookingId index (config/db.py) is what actually stops
        # a double submit from two quick clicks.
        customer_review_collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="You have already reviewed this customer for this booking.")

    _recompute_customer_rating(booking["customerId"])

    return {
        "success": True,
        "message": "Thanks! Your review has been submitted.",
        "review": _serialize(document),
    }


@router.get("/given")
def get_reviews_given(current_worker: dict = Depends(get_current_worker)):
    """Reviews this worker has written -- lets the bookings page know which
    completed bookings are already rated."""
    reviews = list(
        customer_review_collection.find({"workerId": current_worker["workerId"]}).sort("createdAt", -1)
    )
    return {"success": True, "reviews": [_serialize(r) for r in reviews]}


@router.get("/customer/{customer_id}")
def get_customer_reviews(customer_id: str, current_worker: dict = Depends(get_current_worker)):
    """What other workers said about this customer. Worker-only: the job
    board shows the star summary to everyone, but the written reviews are
    for workers deciding whether to take the job."""
    customer = customer_collection.find_one({"customerId": customer_id})

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    reviews = list(
        customer_review_collection.find(
            {"customerId": customer_id},
            # Workers see who left the review, never which booking/address.
            {"bookingId": 0},
        ).sort("createdAt", -1)
    )

    return {
        "success": True,
        "customer": {
            "customerId": customer_id,
            "fullName": customer.get("fullName", ""),
            "rating": customer.get("customerRating", 0),
            "reviewsCount": customer.get("customerReviewsCount", 0),
        },
        "reviews": [_serialize(r) for r in reviews],
    }
