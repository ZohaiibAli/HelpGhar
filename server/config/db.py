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
    
    
    print("MongoDB Connected Successfully")
    print("Database:", DB_NAME)

except Exception as e:
    print("MongoDB Connection Error:", e)