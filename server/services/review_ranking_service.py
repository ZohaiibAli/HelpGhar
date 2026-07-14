from math import log10

from config.db import (
    review_collection,
    worker_collection,
    gig_collection,
)

from ml.sentiment.reputation import get_reputation_label


class ReviewRankingService:

    """
    Updates worker reputation after every review.
    """

    # =====================================================
    # Public Method
    # =====================================================

    def update_worker_ranking(
        self,
        worker_id: str
    ):

        stats = self.calculate_worker_statistics(worker_id)

        if stats is None:
            return

        worker = worker_collection.find_one(
            {
                "workerId": worker_id
            }
        )

        if not worker:
            return

        reputation_score = self.calculate_reputation_score(
            stats,
            worker
        )

        marketplace_score = self.calculate_marketplace_score(
            reputation_score,
            worker
        )

        label = get_reputation_label(
            marketplace_score
        )

        self.update_worker_document(

            worker,

            stats,

            marketplace_score,

            label

        )

        self.update_gig_document(

            worker,

            stats,

            marketplace_score,

            label

        )

    # =====================================================
    # Worker Statistics
    # =====================================================

    def calculate_worker_statistics(
        self,
        worker_id: str
    ):

        reviews = list(

            review_collection.find(
                {
                    "workerId": worker_id
                }
            )

        )

        if len(reviews) == 0:
            return None

        total = len(reviews)

        avg_rating = round(

            sum(
                r["rating"]
                for r in reviews
            ) / total,

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

        avg_sentiment = round(

            sum(
                r.get(
                    "sentimentScore",
                    0
                )
                for r in reviews
            ) / total,

            3

        )

        positive_percentage = round(

            (positive / total) * 100,

            2

        )

        return {

            "averageRating": avg_rating,

            "reviewsCount": total,

            "positive": positive,

            "neutral": neutral,

            "negative": negative,

            "positivePercentage": positive_percentage,

            "averageSentiment": avg_sentiment

        }

    # =====================================================
    # Reputation Score
    # =====================================================

    def calculate_reputation_score(

        self,

        stats,

        worker

    ):

        rating_score = (

            stats["averageRating"] / 5

        ) * 100

        positive_score = stats[
            "positivePercentage"
        ]

        review_confidence = min(

            100,

            log10(
                stats["reviewsCount"] + 1
            ) * 50

        )

        experience_score = min(

            worker.get(
                "experienceYears",
                0
            ) * 10,

            100

        )

        verification = (

            100

            if worker.get(
                "cnicVerified"
            )

            else 0

        )

        availability = (

            100

            if worker.get(
                "available"
            )

            else 0

        )

        reputation = (

            rating_score * 0.40 +

            positive_score * 0.25 +

            review_confidence * 0.15 +

            experience_score * 0.10 +

            verification * 0.05 +

            availability * 0.05

        )

        return round(

            reputation,

            2

        )

    # =====================================================
    # Marketplace Score
    # =====================================================

    def calculate_marketplace_score(

        self,

        reputation_score,

        worker

    ):

        badge_bonus = len(

            worker.get(
                "badges",
                []
            )

        ) * 2

        score = reputation_score + badge_bonus

        return round(

            min(score, 100),

            2

        )

    # =====================================================
    # Update Worker
    # =====================================================

    def update_worker_document(

        self,

        worker,

        stats,

        marketplace_score,

        label

    ):

        worker_collection.update_one(

            {

                "workerId": worker["workerId"]

            },

            {

                "$set": {

                    "rating":
                    stats[
                        "averageRating"
                    ],

                    "reviewsCount":
                    stats[
                        "reviewsCount"
                    ],

                    "marketplaceScore":
                    marketplace_score,

                    "reputationLabel":
                    label,

                    "reviewSummary": {

                        "positive":
                        stats["positive"],

                        "neutral":
                        stats["neutral"],

                        "negative":
                        stats["negative"],

                        "positivePercentage":
                        stats[
                            "positivePercentage"
                        ],

                        "averageSentimentScore":
                        stats[
                            "averageSentiment"
                        ]

                    },

                    "badges": [

                        label

                    ]

                }

            }

        )

    # =====================================================
    # Update Gig
    # =====================================================

    def update_gig_document(

        self,

        worker,

        stats,

        marketplace_score,

        label

    ):

        gig_collection.update_many(

            {

                "workerId":
                worker["workerId"]

            },

            {

                "$set": {

                    "rating":
                    stats[
                        "averageRating"
                    ],

                    "reviewsCount":
                    stats[
                        "reviewsCount"
                    ],

                    "marketplaceScore":
                    marketplace_score,

                    "reputationLabel":
                    label,

                    "positivePercentage":
                    stats[
                        "positivePercentage"
                    ]

                }

            }

        )


review_ranking_service = ReviewRankingService()