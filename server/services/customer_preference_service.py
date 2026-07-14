from config.db import (
    booking_collection,
    worker_collection,
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

        categories = {}
        cities = {}

        total_budget = 0

        for booking in bookings:

            worker = worker_collection.find_one(
                {
                    "workerId": booking["workerId"]
                }
            )

            if not worker:
                continue

            category = worker["category"]
            city = worker["city"]

            categories[category] = categories.get(category, 0) + 1
            cities[city] = cities.get(city, 0) + 1

            total_budget += worker.get("priceMax", 0)

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