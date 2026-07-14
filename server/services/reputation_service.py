from config.db import (
    review_collection,
    worker_collection,
)

from ml.sentiment.reputation import get_reputation_label


def update_worker_reputation(worker_id: str):

    reviews = list(
        review_collection.find({
            "workerId": worker_id
        })
    )

    if not reviews:
        return

    total_reviews = len(reviews)

    average_rating = round(
        sum(r["rating"] for r in reviews) / total_reviews,
        2
    )

    positive = sum(
        1
        for r in reviews
        if r.get("sentiment") == "positive"
    )

    neutral = sum(
        1
        for r in reviews
        if r.get("sentiment") == "neutral"
    )

    negative = sum(
        1
        for r in reviews
        if r.get("sentiment") == "negative"
    )

    positive_percentage = round(
        (positive / total_reviews) * 100,
        2
    )

    average_sentiment = round(
        sum(r.get("sentimentScore", 0) for r in reviews)
        / total_reviews,
        3
    )

    sentiment_normalized = (
        (average_sentiment + 1) / 2
    ) * 100

    reputation_score = round(

        (average_rating / 5) * 50 +

        positive_percentage * 0.30 +

        sentiment_normalized * 0.20,

        2
    )

    label = get_reputation_label(
        reputation_score
    )

    worker_collection.update_one(

        {
            "workerId": worker_id
        },

        {
            "$set": {

                "rating": average_rating,

                "reviewsCount": total_reviews,

                "reviewSummary": {

                    "positive": positive,

                    "neutral": neutral,

                    "negative": negative,

                    "positivePercentage": positive_percentage,

                    "averageSentimentScore": average_sentiment,

                    "reputationScore": reputation_score,

                    "label": label

                },

                "badges": [
                    label
                ]

            }
        }

    )