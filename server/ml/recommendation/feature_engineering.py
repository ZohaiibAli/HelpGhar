"""
Feature Engineering

Converts workers and customers
into ML feature vectors.
"""

from config.db import (
    booking_collection,
    worker_collection
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
    #
    # Builds an "ideal worker" vector from the customer's own
    # completed-booking history. Every dimension below mirrors
    # the corresponding dimension in worker_features() -- that
    # alignment is what makes the cosine similarity between the
    # two vectors meaningful.

    def customer_features(
        self,
        customer_id: str
    ):

        bookings = list(
            booking_collection.find(
                {
                    "customerId": customer_id,
                    "status": "completed"
                }
            )
        )

        worker_ids = list({
            booking["workerId"]
            for booking in bookings
        })

        workers_by_id = {}

        if worker_ids:
            for worker in worker_collection.find(
                {"workerId": {"$in": worker_ids}}
            ):
                workers_by_id[worker["workerId"]] = worker

        categories = {}
        cities = {}

        totals = {
            "experienceYears": 0,
            "marketplaceScore": 0,
            "rating": 0,
            "reviewsCount": 0,
            "priceMin": 0,
            "priceMax": 0,
        }

        workers_used = 0

        for booking in bookings:

            worker = workers_by_id.get(booking["workerId"])

            if not worker:
                continue

            category = worker.get("category", "")
            city = worker.get("city", "")

            categories[category] = categories.get(category, 0) + 1
            cities[city] = cities.get(city, 0) + 1

            totals["experienceYears"] += worker.get("experienceYears", 0)
            totals["marketplaceScore"] += worker.get("marketplaceScore", 0)
            totals["rating"] += worker.get("rating", 0)
            totals["reviewsCount"] += worker.get("reviewsCount", 0)
            totals["priceMin"] += worker.get("priceMin", 0)
            totals["priceMax"] += worker.get("priceMax", 0)

            workers_used += 1

        favourite_category = ""

        if categories:
            favourite_category = max(
                categories,
                key=categories.get
            )

        favourite_city = ""

        if cities:
            favourite_city = max(
                cities,
                key=cities.get
            )

        averages = {
            key: (value / workers_used if workers_used else 0)
            for key, value in totals.items()
        }

        return [

            encode_category(favourite_category),

            encode_city(favourite_city),

            normalize(averages["experienceYears"], 30),

            normalize(averages["marketplaceScore"], 100),

            normalize(averages["rating"], 5),

            normalize(averages["reviewsCount"], 200),

            normalize(averages["priceMin"], 50000),

            normalize(averages["priceMax"], 50000),

            # A customer always prefers an available, verified
            # worker -- these two dimensions anchor the vector
            # even for a brand new customer with no history yet.
            1,

            1

        ]


feature_engineering = FeatureEngineering()