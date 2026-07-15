"""
HelpGhar AI Recommendation Engine

Combines:

✓ Customer similarity
✓ Marketplace score
✓ Reputation
✓ Reviews
✓ Rating
✓ Experience
✓ Availability

Returns ranked workers.
"""

from config.db import (
    worker_collection,
)

from config.db import customer_preference_collection

from ml.recommendation.feature_engineering import (
    feature_engineering
)

from pprint import pprint

from ml.recommendation.similarity import (
    similarity_engine
)


class RecommendationService:

    # -----------------------------
    # Weights
    # -----------------------------

    SIMILARITY_WEIGHT = 40

    MARKETPLACE_WEIGHT = 25

    RATING_WEIGHT = 15

    EXPERIENCE_WEIGHT = 5

    POSITIVE_WEIGHT = 10

    VERIFIED_WEIGHT = 3

    AVAILABLE_WEIGHT = 2

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

        score += similarity * self.SIMILARITY_WEIGHT

        score += (
            worker.get(
                "marketplaceScore",
                0
            ) / 100
        ) * self.MARKETPLACE_WEIGHT

        score += (
            worker.get(
                "rating",
                0
            ) / 5
        ) * self.RATING_WEIGHT

        score += min(

            worker.get(
                "experienceYears",
                0
            ),

            15

        ) / 15 * self.EXPERIENCE_WEIGHT

        score += (

            worker.get(
                "positiveReviewPercentage",
                0
            ) / 100

        ) * self.POSITIVE_WEIGHT

        if worker.get("cnicVerified"):

            score += self.VERIFIED_WEIGHT

        if worker.get("available"):

            score += self.AVAILABLE_WEIGHT

        score += self.preference_bonus(
            worker,
            preferences
        )

        return round(score, 2)

    def preference_bonus(
        self,
        worker,
        preferences
    ):

        if not preferences:
            return 0

        bonus = 0

        if worker.get("category") in preferences.get("preferredCategories", []):
            bonus += 8

        if worker.get("city") in preferences.get("preferredCities", []):
            bonus += 6

        budget = preferences.get("averageBudget", 0)
        worker_budget = worker.get("priceMax", 0)

        if abs(worker_budget - budget) < 5000:
            bonus += 6

        return bonus

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

        ranked = []

        for worker in workers:

            worker = worker.copy()

            worker["recommendationScore"] = self.recommendation_score(
                customer_vector,
                worker,
                preferences
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
       

        for worker in ranked:
            pprint(worker)

        return ranked


recommendation_service = RecommendationService()