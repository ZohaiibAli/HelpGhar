from collections import defaultdict

from config.db import booking_collection


class CollaborativeFiltering:

    def customer_history(self):

        history = defaultdict(set)

        bookings = booking_collection.find(
            {
                "status": "completed"
            }
        )

        for booking in bookings:

            history[
                booking["customerId"]
            ].add(
                booking["workerId"]
            )

        return history

    # ------------------------------------

    def similar_customers(
        self,
        customer_id
    ):

        history = self.customer_history()

        target = history.get(
            customer_id,
            set()
        )

        similarity = {}

        for other_customer, workers in history.items():

            if other_customer == customer_id:
                continue

            intersection = len(
                target.intersection(workers)
            )

            union = len(
                target.union(workers)
            )

            if union == 0:
                continue

            similarity[
                other_customer
            ] = intersection / union

        return similarity

    # ------------------------------------

    def worker_scores(
        self,
        customer_id
    ):

        history = self.customer_history()

        similarities = self.similar_customers(
            customer_id
        )

        scores = defaultdict(float)

        for customer, similarity in similarities.items():

            for worker in history[customer]:

                scores[worker] += similarity

        return scores


collaborative_filtering = CollaborativeFiltering()