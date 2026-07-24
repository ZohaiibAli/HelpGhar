from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000
    )

    client.admin.command("ping")

    db = client[DB_NAME]

    customer_collection = db["customers"]
    worker_collection = db["workers"]
    admin_collection = db["admin"]
    gig_collection = db["gigs"]
    booking_collection = db["bookings"]
    review_collection = db["reviews"]
    payment_collection = db["payments"]
    payment_card_collection = db["payment_cards"]
    dispute_collection = db["disputes"]
    website_theme_collection = db["website_themes"]
    counter_collection = db["counters"]
    worker_details_collection = db["worker_details"]
    conversation_collection = db["conversations"]
    customer_preference_collection = db["customer_preferences"]

    # Registration only checked "does this email already exist?" with a
    # find_one before insert_one -- two concurrent requests for the same
    # email can both pass that check before either insert completes,
    # creating duplicate accounts. A unique index makes the database
    # itself the source of truth and rejects the second insert outright.
    # create_index is idempotent (no-op if it already exists) and safe
    # to run on every startup.
    try:
        customer_collection.create_index("email", unique=True)
        worker_collection.create_index("email", unique=True)
    except Exception as e:
        print("Could not create unique email index:", str(e))

    print("MongoDB Connected Successfully")
    print(f"Database: {DB_NAME}")

except Exception as e:
    print("MongoDB Connection Error:", str(e))