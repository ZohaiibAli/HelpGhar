"""
Collaborative Filtering

Finds customers with overlapping completed-booking history
(Jaccard similarity on the set of workers they booked) and uses
them to score workers a customer hasn't booked yet -- "customers
similar to you also booked these workers".
"""

import time
from collections import defaultdict

from config.db import booking_collection

from .constants import MAX_COLLABORATIVE_NEIGHBORS

# Full booking-collection scans are expensive to repeat on every
# request, and history barely changes second to second, so it's
# cached in-process for a short window.
HISTORY_CACHE_TTL_SECONDS = 60


class CollaborativeFiltering:

    def __init__(self):
        self._history_cache = None
        self._history_cached_at = 0.0

    # ------------------------------------

    def customer_history(self):

        now = time.time()

        if (
            self._history_cache is not None
            and now - self._history_cached_at < HISTORY_CACHE_TTL_SECONDS
        ):
            return self._history_cache

        history = defaultdict(set)

        bookings = booking_collection.find(
            {
                "status": "completed"
            },
            {
                "customerId": 1,
                "workerId": 1,
            }
        )

        for booking in bookings:

            history[
                booking["customerId"]
            ].add(
                booking["workerId"]
            )

        self._history_cache = history
        self._history_cached_at = now

        return history

    # ------------------------------------

    def similar_customers(
        self,
        customer_id,
        history=None
    ):

        history = (
            history
            if history is not None
            else self.customer_history()
        )

        target = history.get(
            customer_id,
            set()
        )

        if not target:
            return {}

        similarity = {}

        for other_customer, workers in history.items():

            if other_customer == customer_id:
                continue

            intersection = len(
                target.intersection(workers)
            )

            if intersection == 0:
                continue

            union = len(
                target.union(workers)
            )

            similarity[
                other_customer
            ] = intersection / union

        # Keep only the strongest neighbors. This bounds the
        # cost of worker_scores() below and stops a long tail of
        # weakly-overlapping customers from inflating scores for
        # widely-booked workers.
        strongest = sorted(
            similarity.items(),
            key=lambda item: item[1],
            reverse=True
        )[:MAX_COLLABORATIVE_NEIGHBORS]

        return dict(strongest)

    # ------------------------------------

    def worker_scores(
        self,
        customer_id
    ):

        history = self.customer_history()

        similarities = self.similar_customers(
            customer_id,
            history
        )

        scores = defaultdict(float)

        for customer, similarity in similarities.items():

            for worker in history[customer]:

                scores[worker] += similarity

        return scores


collaborative_filtering = CollaborativeFiltering()
