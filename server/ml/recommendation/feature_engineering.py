"""
Feature Engineering

Converts workers and customers
into ML feature vectors.
"""

from config.db import (
    booking_collection,
    gig_collection,
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

        # experienceYears/marketplaceScore/rating/reviewsCount/price*/
        # city all live on the gig document, not the worker document
        # (worker_collection only has account/profile fields) -- see
        # server/model/worker_model.py: GigCreate carries the
        # structured listing data, WorkerRegister doesn't. Looking
        # these up on worker_collection would silently return 0/""
        # for every field here.
        gigs_by_worker_and_category = {}
        gigs_by_worker = {}

        if worker_ids:
            for gig in gig_collection.find(
                {"workerId": {"$in": worker_ids}}
            ):
                gigs_by_worker_and_category[
                    (gig["workerId"], gig.get("category"))
                ] = gig
                gigs_by_worker.setdefault(gig["workerId"], gig)

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

            worker_id = booking["workerId"]

            gig = (
                gigs_by_worker_and_category.get(
                    (worker_id, booking.get("category"))
                )
                or gigs_by_worker.get(worker_id)
            )

            if not gig:
                continue

            category = gig.get("category", "")
            city = gig.get("city", "")

            categories[category] = categories.get(category, 0) + 1
            cities[city] = cities.get(city, 0) + 1

            totals["experienceYears"] += gig.get("experienceYears", 0)
            totals["marketplaceScore"] += gig.get("marketplaceScore", 0)
            totals["rating"] += gig.get("rating", 0)
            totals["reviewsCount"] += gig.get("reviewsCount", 0)
            totals["priceMin"] += gig.get("priceMin", 0)
            totals["priceMax"] += gig.get("priceMax", 0)

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