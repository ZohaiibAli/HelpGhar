"""
Preference Learning

Scores how well a worker matches a customer's explicit learned
preferences (favourite categories/cities/budget, built up over
time by services.customer_preference_service from completed
bookings).

A customer with one lucky booking shouldn't get the same
preference weight as one with a long, consistent history, so the
bonus is scaled by a confidence value that grows with the number
of completed bookings behind the stored preferences.
"""

from .constants import (
    BUDGET_TOLERANCE,
    PREFERENCE_CONFIDENCE_BOOKINGS,
    PREFERRED_BUDGET_BONUS,
    PREFERRED_CATEGORY_BONUS,
    PREFERRED_CITY_BONUS,
)


class PreferenceLearning:

    def confidence(self, preferences: dict | None) -> float:
        """
        0..1 score for how much a customer's stored preferences
        should be trusted, based on how many completed bookings
        they were learned from.
        """

        if not preferences:
            return 0.0

        completed = preferences.get("completedBookings", 0)

        return round(
            min(completed / PREFERENCE_CONFIDENCE_BOOKINGS, 1.0),
            3
        )

    # ------------------------------------

    def bonus(self, worker: dict, preferences: dict | None) -> float:

        if not preferences:
            return 0.0

        raw_bonus = 0

        if worker.get("category") in preferences.get("preferredCategories", []):
            raw_bonus += PREFERRED_CATEGORY_BONUS

        if worker.get("city") in preferences.get("preferredCities", []):
            raw_bonus += PREFERRED_CITY_BONUS

        budget = preferences.get("averageBudget", 0)
        worker_budget = worker.get("priceMax", 0)

        if budget and abs(worker_budget - budget) <= BUDGET_TOLERANCE:
            raw_bonus += PREFERRED_BUDGET_BONUS

        if raw_bonus == 0:
            return 0.0

        confidence = self.confidence(preferences)

        # A low-confidence customer still gets half credit -- new
        # preferences shouldn't be ignored entirely, just trusted
        # less than a well-established pattern.
        return round(raw_bonus * (0.5 + 0.5 * confidence), 2)


preference_learning = PreferenceLearning()
