from fastapi import APIRouter, Depends, HTTPException
from helper.auth_helper import get_current_customer, get_current_worker

from config.db import (
    review_collection,
    booking_collection,
    customer_collection,
    worker_collection
)

from helper.auth_helper import get_current_customer

from helper.id_helper import generate_review_id

from model.review_model import ReviewCreate

from datetime import datetime
from bson import ObjectId
router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)

@router.get("/workers")
def get_review_workers(
    current_customer=Depends(get_current_customer)
):

    bookings = list(
        booking_collection.find({
            "customerId": current_customer["customerId"],
            "status": "completed"
        })
    )

    workers = []

    seen = set()

    for booking in bookings:

        if booking["workerId"] in seen:
            continue

        seen.add(booking["workerId"])

        workers.append({

            "workerId": booking["workerId"],

            "workerName": booking["workerName"]

        })

    return {

        "success": True,

        "workers": workers

    }

@router.post("/")
def submit_review(
    review: ReviewCreate,
    current_customer=Depends(get_current_customer)
):
    # Check if customer has a completed booking with this worker
    booking = booking_collection.find_one({
        "customerId": current_customer["customerId"],
        "workerId": review.workerId,
        "status": "completed"
    })

    if not booking:
        raise HTTPException(
            status_code=400,
            detail="You cannot review this worker."
        )

    # Fetch customer details
    customer = customer_collection.find_one({
        "customerId": current_customer["customerId"]
    })

    # Fetch worker details

    worker = worker_collection.find_one({
    "_id": ObjectId(review.workerId)
})

    # Insert review
    review_collection.insert_one({
        "reviewId": generate_review_id(),
        "customerId": customer["customerId"],
        "customerName": customer["fullName"],
        "workerId": worker["workerId"],
        "workerName": worker["fullName"],
        "rating": review.rating,
        "comment": review.comment,
        "createdAt": datetime.utcnow()
    })

    return {
        "success": True,
        "message": "Review Submitted"
    }


@router.get("/")
def get_reviews(
    current_customer=Depends(get_current_customer)
):
    # Fetch all reviews submitted by the current customer
    reviews = list(
        review_collection.find({
            "customerId": current_customer["customerId"]
        }).sort("createdAt", -1)
    )

    # Convert ObjectId to string
    for review in reviews:
        review["_id"] = str(review["_id"])

    return {
        "success": True,
        "reviews": reviews
    }

@router.get("/my-reviews")
def get_my_reviews(
    current_worker=Depends(get_current_worker)
):
    # Fetch all reviews left for the logged-in worker
    reviews = list(
        review_collection.find({
            "workerId": current_worker["workerId"]
        }).sort("createdAt", -1)
    )

    # Convert ObjectId to string
    for review in reviews:
        review["_id"] = str(review["_id"])

    return {
        "success": True,
        "reviews": reviews
    }

@router.get("/worker/{worker_id}")
def get_worker_reviews(worker_id: str):

    reviews = list(
        review_collection.find(
            {
                "workerId": worker_id
            }
        ).sort("createdAt", -1)
    )

    for review in reviews:
        review["_id"] = str(review["_id"])

    return {
        "success": True,
        "reviews": reviews
    }