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

        customer = np.array(customer_vector).reshape(1, -1)

        worker = np.array(worker_vector).reshape(1, -1)

        similarity = cosine_similarity(
            customer,
            worker
        )[0][0]

        return round(float(similarity), 4)


similarity_engine = SimilarityEngine()