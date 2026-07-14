from datetime import datetime
from bson import ObjectId

from config.db import (
    review_collection,
    booking_collection,
    customer_collection,
    worker_collection,
)

from helper.id_helper import generate_review_id

from ml.sentiment.analyzer import analyze_sentiment

from fastapi import HTTPException


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

    return review_document