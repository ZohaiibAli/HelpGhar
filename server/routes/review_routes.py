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

@router.get("/featured")
def get_featured_reviews(limit: int = 3):
    """
    Public: the strongest recent reviews, for the landing page.

    That section used to render three invented testimonials from
    data/mock.ts ("Sara Malik", "Bilal Ahmed", "Zara Hussain") under a
    "Real jobs, real people" heading. These are actual reviews written by
    actual customers about actual completed bookings -- and when there
    are none yet, the endpoint returns an empty list so the section can
    hide itself rather than fall back to fiction.
    """

    limit = max(1, min(limit, 12))

    reviews = list(
        review_collection.find(
            {
                "rating": {"$gte": 4},
                # A one-word "good" carries no weight on a landing page.
                "comment": {"$exists": True, "$ne": ""},
            },
            {
                "_id": 0,
                "reviewId": 1,
                "customerName": 1,
                "workerName": 1,
                "workerId": 1,
                "rating": 1,
                "comment": 1,
                "createdAt": 1,
            },
        )
        .sort("createdAt", -1)
        .limit(limit * 4)
    )

    # Longer quotes read better in the featured slot, so rank by length
    # among the recent pool rather than showing whatever came last.
    reviews.sort(key=lambda review: len(review.get("comment", "")), reverse=True)

    selected = reviews[:limit]

    worker_ids = [r["workerId"] for r in selected if r.get("workerId")]

    categories = {
        worker["workerId"]: worker.get("category", "")
        for worker in worker_collection.find(
            {"workerId": {"$in": worker_ids}},
            {"workerId": 1, "category": 1},
        )
    }

    for review in selected:
        review["workerCategory"] = categories.get(review.get("workerId"), "")

        created = review.get("createdAt")
        review["createdAt"] = (
            created.isoformat() if hasattr(created, "isoformat") else created
        )

    return {
        "success": True,
        "reviews": selected,
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