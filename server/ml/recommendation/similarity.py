"""
HelpGhar Recommendation Engine

Uses Cosine Similarity
"""

from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


class SimilarityEngine:

    def calculate_similarity(
        self,
        customer_vector,
        worker_vector
    ):

        customer = np.array(customer_vector, dtype=float)

        worker = np.array(worker_vector, dtype=float)

        # A zero vector (e.g. a brand new customer with no
        # learned features yet) has no defined direction, so
        # cosine similarity is meaningless -- treat it as "no
        # signal" instead of relying on sklearn's implicit
        # divide-by-zero handling.
        if not np.any(customer) or not np.any(worker):
            return 0.0

        similarity = cosine_similarity(
            customer.reshape(1, -1),
            worker.reshape(1, -1)
        )[0][0]

        return round(float(similarity), 4)


similarity_engine = SimilarityEngine()