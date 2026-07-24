class RecommendationReasonService:

    def build(
        self,
        worker,
        preferences=None
    ):

        reasons = []

        if preferences:

            if worker.get("category") in preferences.get("preferredCategories", []):
                reasons.append("Matches your preferred category")

            budget = preferences.get("averageBudget", 0)

            if budget and abs(worker.get("priceMax", 0) - budget) < 5000:
                reasons.append("Within your usual budget")

            if worker.get("city") in preferences.get("preferredCities", []):
                reasons.append("Near your location")

        # positivePercentage lives nested under reviewSummary on
        # the worker document, and flat on gig documents.
        review_summary = worker.get("reviewSummary") or {}

        positive_percentage = review_summary.get(
            "positivePercentage",
            worker.get("positivePercentage", 0)
        )

        if positive_percentage >= 90:
            reasons.append("Loved by Customers")

        if worker.get("rating", 0) >= 4.8:
            reasons.append("Highly Rated")

        if worker.get("experienceYears", 0) >= 5:
            reasons.append("Experienced Professional")

        if worker.get("available"):
            reasons.append("Available Today")

        if worker.get("cnicVerified"):
            reasons.append("Verified Worker")

        return reasons


recommendation_reason_service = RecommendationReasonService()