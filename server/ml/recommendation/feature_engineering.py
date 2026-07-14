"""
Feature Engineering

Converts workers and customers
into ML feature vectors.
"""

from config.db import (
    booking_collection,
    review_collection,
)

from .utils import (
    encode_category,
    encode_city,
    normalize,
)


class FeatureEngineering:

    # ------------------------
    # Worker Feature Vector
    # ------------------------

    def worker_features(
        self,
        worker: dict
    ):

        return [

            encode_category(
                worker.get("category", "")
            ),

            encode_city(
                worker.get("city", "")
            ),

            normalize(
                worker.get("experienceYears", 0),
                30
            ),

            normalize(
                worker.get("marketplaceScore", 0),
                100
            ),

            normalize(
                worker.get("rating", 0),
                5
            ),

            normalize(
                worker.get("reviewsCount", 0),
                200
            ),

            normalize(
                worker.get("priceMin", 0),
                50000
            ),

            normalize(
                worker.get("priceMax", 0),
                50000
            ),

            1 if worker.get("available") else 0,

            1 if worker.get("cnicVerified") else 0

        ]

    # ------------------------
    # Customer Feature Vector
    # ------------------------

    def customer_features(
        self,
        customer_id: str
    ):

        bookings = list(

            booking_collection.find(
                {
                    "customerId": customer_id
                }
            )

        )

        reviews = list(

            review_collection.find(
                {
                    "customerId": customer_id
                }
            )

        )

        # ------------------------

        favourite_category = ""

        favourite_city = ""

        average_budget = 0

        average_rating_given = 0

        if bookings:

            categories = {}

            cities = {}

            total_budget = 0

            for booking in bookings:

                category = booking.get(
                    "category",
                    ""
                )

                city = booking.get(
                    "city",
                    ""
                )

                categories[category] = categories.get(
                    category,
                    0
                ) + 1

                cities[city] = cities.get(
                    city,
                    0
                ) + 1

                total_budget += booking.get(
                    "price",
                    0
                )

            favourite_category = max(
                categories,
                key=categories.get
            )

            favourite_city = max(
                cities,
                key=cities.get
            )

            average_budget = total_budget / len(
                bookings
            )

        if reviews:

            average_rating_given = (

                sum(
                    review["rating"]
                    for review in reviews
                )

                / len(reviews)

            )

        return [

            encode_category(
                favourite_category
            ),

            encode_city(
                favourite_city
            ),

            normalize(
                average_budget,
                50000
            ),

            normalize(
                average_rating_given,
                5
            ),

            normalize(
                len(bookings),
                100
            )

        ]


feature_engineering = FeatureEngineering()