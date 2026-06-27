from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

try:
    client = MongoClient(MONGO_URI)

    client.admin.command("ping")

    db = client[DB_NAME]

    customer_collection = db["customers"]
    worker_collection = db["workers"]
    admin_collection = db["admin"]

    print("MongoDB Connected Successfully")
    print("Database:", DB_NAME)

except Exception as e:
    print("MongoDB Connection Error:", e)