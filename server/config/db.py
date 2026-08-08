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

    # Customer <-> worker direct messaging. Deliberately NOT the
    # "conversations" collection above -- that one belongs to the Gemini
    # support bot (services/chat_service.py) and has an unrelated shape.
    message_thread_collection = db["message_threads"]
    message_collection = db["messages"]

    # Customer-posted job requests, and the worker proposals against them --
    # the reverse of a gig listing. A worker's application becomes a real
    # booking (see routes/job_routes.py) once the customer accepts it, so
    # these two collections only need to model the request/proposal phase.
    job_post_collection = db["job_posts"]
    job_application_collection = db["job_applications"]

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

    # Messaging indexes.
    #
    # There is exactly one thread per (customer, worker) pair -- the same
    # model Upwork/Fiverr use, where a thread outlives any individual
    # order. The unique index makes that a database guarantee, so two
    # simultaneous "Message" clicks can't create two threads.
    #
    # The inbox always reads "my threads, newest activity first", and the
    # thread view always reads "this thread, newest first" -- both are
    # covered below so neither degrades into a collection scan.
    #
    # clientId is the client-generated idempotency key for a send. It is
    # partial (not merely sparse) so that a null clientId never collides,
    # while a retried send with the same key is rejected instead of
    # duplicating the message.
    try:
        message_thread_collection.create_index(
            [("customerId", 1), ("workerId", 1)],
            unique=True
        )
        message_thread_collection.create_index([("customerId", 1), ("lastMessageAt", -1)])
        message_thread_collection.create_index([("workerId", 1), ("lastMessageAt", -1)])

        message_collection.create_index([("threadId", 1), ("createdAt", -1)])
        message_collection.create_index(
            [("threadId", 1), ("clientId", 1)],
            unique=True,
            partialFilterExpression={"clientId": {"$type": "string"}}
        )
    except Exception as e:
        print("Could not create messaging indexes:", str(e))

    # Job post / application indexes.
    #
    # A worker can apply to a given job post at most once -- the unique
    # index makes that a database guarantee (mirrors the one-thread-per-pair
    # index above) instead of relying solely on the application route's own
    # pre-check, which can't stop two concurrent "Apply" clicks.
    try:
        job_post_collection.create_index([("customerId", 1), ("createdAt", -1)])
        job_post_collection.create_index([("status", 1), ("category", 1)])

        job_application_collection.create_index(
            [("jobId", 1), ("workerId", 1)],
            unique=True
        )
        job_application_collection.create_index([("jobId", 1), ("createdAt", -1)])
        job_application_collection.create_index([("workerId", 1), ("createdAt", -1)])
    except Exception as e:
        print("Could not create job indexes:", str(e))

    print("MongoDB Connected Successfully")
    print(f"Database: {DB_NAME}")

except Exception as e:
    print("MongoDB Connection Error:", str(e))