from fastapi import APIRouter, Depends, HTTPException
from helper.auth_helper import get_current_customer, get_current_worker

from config.db import (
    review_collection,
    booking_collection,
    customer_collection,
    worker_collection
)

from helper.auth_helper import get_current_customer
from helper.auth_helper import get_current_admin

from helper.id_helper import generate_review_id

from model.review_model import ReviewCreate

from services.review_service import create_review

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
    try:

        create_review(
            review,
            current_customer
        )

        return {
            "success": True,
            "message": "Review Submitted Successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


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

@router.get("/admin")
def get_all_reviews(
    current_admin=Depends(get_current_admin)
):
    reviews = list(
        review_collection.find().sort("createdAt", -1)
    )

    for review in reviews:
        review["id"] = str(review["_id"])
        del review["_id"]

    return {
        "success": True,
        "reviews": reviews
    }