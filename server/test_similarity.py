from config.db import worker_collection
from ml.recommendation.feature_engineering import feature_engineering
from ml.recommendation.similarity import similarity_engine

worker = worker_collection.find_one()

customer_vector = feature_engineering.customer_features("HGC-001")

worker_vector = feature_engineering.worker_features(worker)

score = similarity_engine.calculate_similarity(
    customer_vector,
    worker_vector
)

print(customer_vector)
print(worker_vector)
print(score)