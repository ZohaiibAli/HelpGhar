"""
==========================================================
HelpGhar AI - Worker Service Test
==========================================================

Run:

python test_worker_service.py

Expected Output

✔ Working
✔ MongoDB healthy
✔ Total gigs count
✔ Active gigs count
✔ Matching workers
✔ Formatted priceDisplay
✔ cnicVerified=True/False
✔ skills=[]
✔ badges=[]
==========================================================
"""

from services.worker_service import WorkerService
from config.db import gig_collection


def main():

    print("=" * 70)
    print("HelpGhar AI - Worker Service Test")
    print("=" * 70)

    # --------------------------------------------------
    # MongoDB Health
    # --------------------------------------------------

    try:
        total = gig_collection.count_documents({})
        print("✅ MongoDB healthy")
        print(f"Total gigs count : {total}")

    except Exception as e:
        print("❌ MongoDB connection failed")
        print(e)
        return

    # --------------------------------------------------
    # Active Gigs
    # --------------------------------------------------

    active = gig_collection.count_documents(
        {
            "status": "active"
        }
    )

    print(f"Active gigs count : {active}")

    # --------------------------------------------------
    # Worker Service
    # --------------------------------------------------

    service = WorkerService()

    # Change this question anytime
    question = "Need a verified electrician in Lahore"

    print("\nSearch Query:")
    print(question)

    workers = service.search(
        question=question,
        limit=5
    )

    print(f"\nMatching workers : {len(workers)}")

    print("\n" + "=" * 70)

    if not workers:
        print("No workers found.")
        return

    for index, worker in enumerate(workers, start=1):

        print(f"\nWorker #{index}")
        print("-" * 50)

        print("ID              :", worker.get("id"))
        print("Worker ID       :", worker.get("workerId"))
        print("Name            :", worker.get("fullName"))
        print("Category        :", worker.get("category"))
        print("City            :", worker.get("city"))
        print("Gender          :", worker.get("gender"))
        print("Age             :", worker.get("age"))
        print("Experience      :", worker.get("experienceYears"))
        print("Member Since    :", worker.get("memberSince"))

        print()

        print("Price Min       :", worker.get("priceMin"))
        print("Price Max       :", worker.get("priceMax"))
        print("Price Unit      :", worker.get("priceUnit"))
        print("Price Display   :", worker.get("priceDisplay"))

        print()

        print("Rating          :", worker.get("rating"))
        print("Reviews         :", worker.get("reviewsCount"))
        print("Available       :", worker.get("available"))
        print("Verified        :", worker.get("cnicVerified"))

        print()

        print("Skills          :", worker.get("skills"))
        print("Badges          :", worker.get("badges"))
        print("Certificates    :", worker.get("certificates"))

        print()

        print("Bio             :", worker.get("bio"))
        print("Status          :", worker.get("status"))

        print("=" * 70)

    # --------------------------------------------------
    # Count Function
    # --------------------------------------------------

    print("\nService Count Test")
    print("--------------------------")
    print("Active Workers :", service.count())

    # --------------------------------------------------
    # Health Check
    # --------------------------------------------------

    print("\nHealth Check")
    print("--------------------------")

    health = service.health_check()

    for key, value in health.items():
        print(f"{key} : {value}")

    print("\n" + "=" * 70)
    print("✅ Working")
    print("=" * 70)


if __name__ == "__main__":
    main()