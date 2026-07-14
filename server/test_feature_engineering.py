from ml.recommendation.feature_engineering import feature_engineering
from config.db import worker_collection

worker = worker_collection.find_one()

print(
    feature_engineering.worker_features(worker)
)