"""
============================================================

HelpGhar AI
Ranking Service

Author:
HelpGhar AI

Purpose
-------
Ranks workers returned by MongoDB.

This service NEVER

❌ Queries MongoDB
❌ Calls Gemini
❌ Creates prompts

It ONLY calculates search relevance.

============================================================
"""

from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)


class RankingService:

    """
    Calculates worker relevance score.
    """

    def __init__(self):

        # -------------------------------
        # Ranking Weights
        # -------------------------------

        self.RATING_WEIGHT = 12

        self.EXPERIENCE_WEIGHT = 4

        self.REVIEW_WEIGHT = 0.30

        self.BADGE_WEIGHT = 6

        self.VERIFIED_BONUS = 25

        self.AVAILABLE_BONUS = 15

    # ======================================================
    # MAIN SCORE
    # ======================================================

    def calculate_score(
        self,
        worker: Dict
    ) -> float:

        """
        Overall ranking score.

        Formula

        Rating
        + Experience
        + Reviews
        + Badges
        + Verified
        + Available
        """

        score = 0

        score += self.rating_score(worker)

        score += self.experience_score(worker)

        score += self.review_score(worker)

        score += self.badge_score(worker)

        score += self.verification_score(worker)

        score += self.availability_score(worker)

        return round(score, 2)

    # ======================================================
    # RATING
    # ======================================================

    def rating_score(
        self,
        worker: Dict
    ) -> float:

        rating = worker.get(
            "rating",
            0
        )

        return rating * self.RATING_WEIGHT

    # ======================================================
    # EXPERIENCE
    # ======================================================

    def experience_score(
        self,
        worker: Dict
    ) -> float:

        experience = worker.get(
            "experienceYears",
            0
        )

        return experience * self.EXPERIENCE_WEIGHT

    # ======================================================
    # REVIEWS
    # ======================================================

    def review_score(
        self,
        worker: Dict
    ) -> float:

        reviews = worker.get(
            "reviewsCount",
            0
        )

        return reviews * self.REVIEW_WEIGHT

    # ======================================================
    # BADGES
    # ======================================================

    def badge_score(
        self,
        worker: Dict
    ) -> float:

        badges = worker.get(
            "badges",
            []
        )

        return len(badges) * self.BADGE_WEIGHT

    # ======================================================
    # VERIFIED
    # ======================================================

    def verification_score(
        self,
        worker: Dict
    ) -> float:

        if worker.get("cnicVerified"):

            return self.VERIFIED_BONUS

        return 0

    # ======================================================
    # AVAILABLE
    # ======================================================

    def availability_score(
        self,
        worker: Dict
    ) -> float:

        if worker.get("available"):

            return self.AVAILABLE_BONUS

        return 0

    # ======================================================
    # PRICE SCORE
    # ======================================================

    def price_score(
        self,
        worker: Dict
    ) -> float:
        """
        Reserved for future.

        Example:
        Cheaper workers can receive
        slightly higher ranking.

        Currently disabled.
        """

        return 0

    # ======================================================
    # BONUS SCORE
    # ======================================================

    def bonus_score(
        self,
        worker: Dict
    ) -> float:
        """
        Reserved for future.

        Examples

        Featured Worker
        Premium Worker
        AI Recommended

        """

        return 0

    # ======================================================
    # RANK WORKERS
    # ======================================================

    def rank_workers(
        self,
        workers: List[Dict]
    ) -> List[Dict]:

        """
        Add a ranking score to every worker
        and return workers sorted by score.
        """

        ranked_workers = []

        for worker in workers:

            worker_copy = worker.copy()

            worker_copy["score"] = self.calculate_score(
                worker_copy
            )

            ranked_workers.append(worker_copy)

        ranked_workers.sort(

            key=lambda worker: worker["score"],

            reverse=True

        )

        logger.info(
            f"Ranked {len(ranked_workers)} workers."
        )

        return ranked_workers

    # ======================================================
    # TOP N WORKERS
    # ======================================================

    def top_workers(
        self,
        workers: List[Dict],
        limit: int = 5
    ) -> List[Dict]:

        """
        Return only the best workers.
        """

        ranked = self.rank_workers(workers)

        return ranked[:limit]

    # ======================================================
    # SORT ONLY
    # ======================================================

    def sort_workers(
        self,
        workers: List[Dict]
    ) -> List[Dict]:

        """
        Sort workers that already contain
        a score field.
        """

        return sorted(

            workers,

            key=lambda worker: worker.get(
                "score",
                0
            ),

            reverse=True

        )

    # ======================================================
    # PRINT SCORES (DEBUG)
    # ======================================================

    def print_scores(
        self,
        workers: List[Dict]
    ) -> None:

        """
        Debug helper.
        """

        logger.info(
            "========== Worker Scores =========="
        )

        for worker in workers:

            logger.info(

                "%s | Score: %.2f",

                worker.get(
                    "fullName",
                    "Unknown"
                ),

                worker.get(
                    "score",
                    0
                )

            )

    # ======================================================
    # FILTER LOW SCORES
    # ======================================================

    def filter_low_scores(
        self,
        workers: List[Dict],
        minimum_score: float = 25
    ) -> List[Dict]:

        """
        Remove weak matches.
        """

        return [

            worker

            for worker in workers

            if worker.get(
                "score",
                0
            ) >= minimum_score

        ]

    # ======================================================
    # HEALTH CHECK
    # ======================================================

    def health_check(self):

        return {

            "healthy": True,

            "weights": {

                "rating": self.RATING_WEIGHT,

                "experience": self.EXPERIENCE_WEIGHT,

                "reviews": self.REVIEW_WEIGHT,

                "badges": self.BADGE_WEIGHT,

                "verified": self.VERIFIED_BONUS,

                "available": self.AVAILABLE_BONUS

            }

        }


ranking_service = RankingService()