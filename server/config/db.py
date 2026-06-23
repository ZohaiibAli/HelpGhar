from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

try:
    # MongoDB Atlas connection
    client = MongoClient(MONGO_URI)

    # Test connection
    client.admin.command("ping")

    # Select database
    db = client[DB_NAME]

    print("MongoDB Connected Successfully")
    print("Database:", DB_NAME)

except Exception as e:
    print("MongoDB Connection Error:", e)