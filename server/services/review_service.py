from datetime import datetime

from config.db import (
    review_collection,
    booking_collection,
    customer_collection,
    worker_collection,
)

from services.customer_preference_service import (
    customer_preference_service
)

from helper.id_helper import generate_review_id

from ml.sentiment.analyzer import analyze_sentiment

from fastapi import HTTPException

from services.review_ranking_service import review_ranking_service


def create_review(review, current_customer):
    """
    Creates a review after validating booking
    and automatically performs sentiment analysis.
    """

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

    # The review UI is worker-scoped, not booking-scoped (a customer
    # picks a worker they've completed a booking with, not a specific
    # booking) -- so the natural uniqueness constraint is one review
    # per customer/worker pair. Without this, a customer with a single
    # completed booking could call this endpoint repeatedly and
    # arbitrarily inflate or deflate a worker's rating/marketplaceScore,
    # since each call triggers a full reputation recompute.
    existing_review = review_collection.find_one({
        "customerId": current_customer["customerId"],
        "workerId": review.workerId,
    })

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this worker."
        )

    customer = customer_collection.find_one({
        "customerId": current_customer["customerId"]
    })

    worker = worker_collection.find_one({
    "workerId": review.workerId
})

    sentiment_result = analyze_sentiment(
        review.comment,
        review.rating
    )

    review_document = {

        "reviewId": generate_review_id(),

        "customerId": customer["customerId"],

        "customerName": customer["fullName"],

        "workerId": worker["workerId"],

        "workerName": worker["fullName"],

        "rating": review.rating,

        "comment": review.comment,

        "sentiment": sentiment_result["sentiment"],

        "sentimentScore": sentiment_result["score"],

        "createdAt": datetime.utcnow()

    }

  

    review_collection.insert_one(review_document)

    review_ranking_service.update_worker_ranking(
        worker["workerId"]
    )

    customer_preference_service.update_preferences(
    customer["customerId"]
)

    return review_document
