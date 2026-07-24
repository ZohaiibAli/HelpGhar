"""
HelpGhar AI Recommendation Engine

Hybrid ranking combining:

✓ Content-based similarity (customer/worker feature vectors)
✓ Learned preference bonus (favourite category/city/budget)
✓ Marketplace score, reputation, reviews, rating, experience
✓ Collaborative filtering ("similar customers also booked")

Returns ranked workers with an explainable score breakdown.
"""

from config.db import customer_preference_collection

from ml.recommendation.collaborative import (
    collaborative_filtering
)

from ml.recommendation.constants import (
    AVAILABLE_WEIGHT,
    COLLABORATIVE_BLEND_WEIGHT,
    COLLABORATIVE_SATURATION_RATE,
    CONTENT_BLEND_WEIGHT,
    EXPERIENCE_WEIGHT,
    MARKETPLACE_WEIGHT,
    MAX_EXPERIENCE_YEARS,
    POSITIVE_REVIEW_WEIGHT,
    RATING_WEIGHT,
    SIMILARITY_WEIGHT,
    VERIFIED_WEIGHT,
)

from ml.recommendation.feature_engineering import (
    feature_engineering
)

from ml.recommendation.preference_learning import (
    preference_learning
)

from ml.recommendation.similarity import (
    similarity_engine
)

from ml.recommendation.utils import clamp, saturate

from services.recommendation_reason_service import (
    recommendation_reason_service
)


def _positive_percentage(worker: dict) -> float:
    """
    The positive-review percentage is stored nested under
    reviewSummary.positivePercentage on the worker document, and
    mirrored as a flat positivePercentage field on gig documents
    (see services.review_ranking_service). Read whichever is
    present.
    """

    review_summary = worker.get("reviewSummary") or {}

    return review_summary.get(
        "positivePercentage",
        worker.get("positivePercentage", 0)
    )


class RecommendationService:

    # -----------------------------
    # Content-based Score
    # -----------------------------

    def recommendation_score(
        self,
        customer_vector,
        worker,
        preferences
    ):

        worker_vector = feature_engineering.worker_features(
            worker
        )

        similarity = similarity_engine.calculate_similarity(
            customer_vector,
            worker_vector
        )

        score = 0

        score += similarity * SIMILARITY_WEIGHT

        score += (
            worker.get("marketplaceScore", 0) / 100
        ) * MARKETPLACE_WEIGHT

        score += (
            worker.get("rating", 0) / 5
        ) * RATING_WEIGHT

        score += min(
            worker.get("experienceYears", 0),
            MAX_EXPERIENCE_YEARS
        ) / MAX_EXPERIENCE_YEARS * EXPERIENCE_WEIGHT

        score += (
            _positive_percentage(worker) / 100
        ) * POSITIVE_REVIEW_WEIGHT

        if worker.get("cnicVerified"):
            score += VERIFIED_WEIGHT

        if worker.get("available"):
            score += AVAILABLE_WEIGHT

        score += preference_learning.bonus(
            worker,
            preferences
        )

        # Every weight above already sums to 100, but clamp
        # anyway -- this score is rendered to customers as a
        # "% Match" badge and must never exceed 100.
        return clamp(round(score, 2))

    # -----------------------------------------
    # Hybrid Ranking
    # -----------------------------------------

    def recommend_workers(
        self,
        customer_id,
        workers
    ):

        customer_vector = feature_engineering.customer_features(
            customer_id
        )

        preferences = customer_preference_collection.find_one(
            {
                "customerId": customer_id
            }
        )

        history = collaborative_filtering.customer_history()

        # A brand new customer has no booking history to find
        # similar customers from -- collaborative filtering has
        # nothing to contribute, so fall back to pure
        # content-based ranking instead of silently deflating
        # every score by the 40% collaborative weight.
        customer_has_history = bool(history.get(customer_id))

        collaborative_scores = (
            collaborative_filtering.worker_scores(customer_id)
            if customer_has_history
            else {}
        )

        ranked = []

        for worker in workers:

            worker = worker.copy()

            content_score = self.recommendation_score(
                customer_vector,
                worker,
                preferences
            )

            raw_collab_score = collaborative_scores.get(
                worker.get("workerId"),
                0
            )

            # Raw collaborative score is an unbounded sum of
            # neighbor similarities -- saturate it into a 0-100
            # range so it blends safely with the content score.
            collab_score = round(
                saturate(raw_collab_score, COLLABORATIVE_SATURATION_RATE),
                2
            )

            if customer_has_history:
                recommendation_score = clamp(round(
                    content_score * CONTENT_BLEND_WEIGHT +
                    collab_score * COLLABORATIVE_BLEND_WEIGHT,
                    2
                ))
            else:
                recommendation_score = content_score

            worker["contentScore"] = content_score

            worker["collaborativeScore"] = collab_score

            worker["recommendationScore"] = recommendation_score

            worker["recommendationReasons"] = (
                recommendation_reason_service.build(
                    worker,
                    preferences
                )
            )

            # ----------------------------
            # Convert Mongo ObjectId
            # ----------------------------

            if "_id" in worker:

                worker["id"] = str(worker["_id"])

                del worker["_id"]

            ranked.append(worker)

        ranked.sort(
            key=lambda x: x["recommendationScore"],
            reverse=True
        )

        return ranked


recommendation_service = RecommendationService()
