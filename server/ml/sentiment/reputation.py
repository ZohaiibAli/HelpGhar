def get_reputation_label(score: float) -> str:

    if score >= 95:
        return "Outstanding Professional"

    if score >= 90:
        return "Customer Favorite"

    if score >= 80:
        return "Highly Appreciated"

    if score >= 70:
        return "Reliable Worker"

    if score >= 60:
        return "Trusted Service"

    if score >= 45:
        return "Mixed Customer Feedback"

    return "Needs Improvement"