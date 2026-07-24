"""
HelpGhar ML Recommendation Engine

A hybrid recommender for ranking workers/gigs shown to a
customer, combining:

- Content-based filtering: cosine similarity between a
  customer's "ideal worker" feature vector and each candidate
  worker's feature vector (feature_engineering, similarity).
- Preference learning: bonus for matching a customer's learned
  favourite categories/cities/budget (preference_learning).
- Collaborative filtering: workers booked by customers with
  similar booking history (collaborative).

See services.recommendation_service for how these are blended
into the final ranking.
"""

from .collaborative import collaborative_filtering
from .feature_engineering import feature_engineering
from .preference_learning import preference_learning
from .similarity import similarity_engine

__all__ = [
    "collaborative_filtering",
    "feature_engineering",
    "preference_learning",
    "similarity_engine",
]
