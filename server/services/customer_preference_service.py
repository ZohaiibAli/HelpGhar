from config.db import (
    booking_collection,
    gig_collection,
    review_collection,
    customer_preference_collection,
)

from datetime import datetime


class CustomerPreferenceService:

    def update_preferences(
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

        if not bookings:
            return

        # category/city/priceMax live on the gig document, not
        # worker_collection (which only has account/profile fields --
        # see server/model/worker_model.py). Looking these up on
        # worker_collection crashed with KeyError on "city" for every
        # single call, which made every review submission appear to
        # fail to the customer even though the review itself had
        # already been saved a few lines earlier in review_service.py.
        worker_ids = list({
            booking["workerId"]
            for booking in bookings
        })

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

        total_budget = 0

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

            total_budget += gig.get("priceMax", 0)

        reviews = list(
            review_collection.find(
                {
                    "customerId": customer_id
                }
            )
        )

        avg_rating = 0

        if reviews:

            avg_rating = sum(
                r["rating"] for r in reviews
            ) / len(reviews)

        customer_preference_collection.update_one(

            {
                "customerId": customer_id
            },

            {
                "$set": {

                    "preferredCategories":

                    sorted(

                        categories,

                        key=categories.get,

                        reverse=True

                    ),

                    "preferredCities":

                    sorted(

                        cities,

                        key=cities.get,

                        reverse=True

                    ),

                    "averageBudget":

                    total_budget / max(
                        len(bookings),
                        1
                    ),

                    "averageRatingGiven":

                    round(avg_rating,2),

                    "completedBookings":

                    len(bookings),

                    "lastUpdated":

                    datetime.utcnow()

                }

            },

            upsert=True

        )


customer_preference_service = CustomerPreferenceService()