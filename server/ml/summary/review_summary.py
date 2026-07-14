from collections import Counter

from ml.summary.keywords import (
    POSITIVE_KEYWORDS,
    NEGATIVE_KEYWORDS
)

from config.db import review_collection


class ReviewSummaryGenerator:

    def generate(self, worker_id: str):

        reviews = list(
            review_collection.find(
                {
                    "workerId": worker_id
                }
            )
        )

        if not reviews:

            return {

                "headline": "New Worker",

                "summary": "No customer reviews yet.",

                "strengths": [],

                "improvements": []

            }

        positive_counter = Counter()

        negative_counter = Counter()

        for review in reviews:

            text = review.get(
                "comment",
                ""
            ).lower()

            for word, label in POSITIVE_KEYWORDS.items():

                if word in text:

                    positive_counter[label] += 1

            for word, label in NEGATIVE_KEYWORDS.items():

                if word in text:

                    negative_counter[label] += 1

        strengths = [

            item

            for item, _ in positive_counter.most_common(3)

        ]

        improvements = [

            item

            for item, _ in negative_counter.most_common(3)

        ]

        if strengths:

            summary = (

                "Customers consistently appreciate "

                + ", ".join(strengths[:-1])

                + (" and " if len(strengths) > 1 else "")

                + strengths[-1]

                + "."

            )

        else:

            summary = (

                "Customers have shared mixed feedback."

            )

        headline = "Customer Favorite"

        if improvements and len(improvements) > len(strengths):

            headline = "Needs Improvement"

        elif strengths:

            headline = "Highly Appreciated"

        return {

            "headline": headline,

            "summary": summary,

            "strengths": strengths,

            "improvements": improvements

        }


review_summary_generator = ReviewSummaryGenerator()