"""
Bulk-seeds realistic demo job posts into MongoDB, replacing whatever test
job posts are currently on the board with a professional set spanning every
service category.

Run with (from the server/ directory, same as create_admin.py):

    python seed_jobs.py            # seeds 3 jobs per category (27 total)
    python seed_jobs.py 5          # seeds a custom count per category instead

What it does
------------
For every job post it also creates a matching demo customer account
(customer_collection), because job_routes.create_job_post stamps each post
with the posting customer's real fullName/phone at creation time -- a job
post with no matching customer would show a placeholder name. Demo
customers are reused across several job posts each, the same way
seed_gigs.py reuses its avatar pool.

Idempotent
----------
Every document this script creates is tagged {"seedSource": "seed_jobs"}.
Re-running it first deletes anything with that tag (from ALL previous runs,
regardless of count) and then inserts a fresh batch.

Also clears the board
----------------------
Unlike seed_gigs.py, this script also deletes every job post NOT tagged
with seedSource -- i.e. whatever was on the board before (test posts made
by hand) -- because the point of this script is to replace the current
job board entirely with a professional one, not add alongside it. It does
NOT touch customer accounts that aren't its own demo ones, so a real
customer's login is untouched even though their old job post is gone.
"""

import random
import sys
from datetime import date, timedelta

from config.db import (
    customer_collection,
    job_post_collection,
)
from helper.password_helper import hash_password
from helper.id_helper import generate_customer_id, generate_job_id

SEED_SOURCE = "seed_jobs"
DEMO_PASSWORD = "Customer@123"
CITY = "Karachi"

AREAS = [
    "DHA", "Clifton", "Gulshan-e-Iqbal", "North Nazimabad", "Malir",
    "Korangi", "Nazimabad", "Gulistan-e-Johar", "PECHS", "Saddar",
    "Bahadurabad", "Federal B Area", "Model Colony", "Landhi",
]

TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Flexible"]

DEMO_CUSTOMERS = [
    "Hassan Raza", "Ayesha Malik", "Bilal Farooq", "Sana Javed",
    "Omar Siddiqui", "Mahnoor Qureshi", "Tariq Mehmood", "Rabia Shah",
    "Fahad Iqbal", "Hina Yousuf", "Imran Baig", "Sidra Anwar",
]

PHONE_PREFIXES = ["0300", "0301", "0302", "0312", "0321", "0333", "0334", "0345"]

# Canonical category names -- must match client/src/types/index.ts
# WorkerCategory exactly, or the /services?category=... filter and the
# worker-side "browse jobs" filter silently return 0 results.
CATEGORY_JOBS = {
    "House Servants": dict(
        price=(12000, 28000, "month"),
        posts=[
            ("Full-time house help needed for a family home in {area}",
             "Looking for a reliable full-time house help to manage daily cleaning, laundry and light cooking for a family of four in {area}. Must be punctual, tidy and have prior experience with similar households."),
            ("Part-time domestic help wanted in {area}",
             "Need a trustworthy domestic helper for daily cleaning and organizing at a household in {area}. Flexible morning hours, with the possibility of extending to full-time for the right person."),
            ("Experienced house help required for elderly care support in {area}",
             "Seeking a patient, experienced house help to assist with housekeeping and light support for an elderly resident in {area}. Previous experience with similar arrangements preferred."),
        ],
    ),
    "Drivers": dict(
        price=(20000, 45000, "month"),
        posts=[
            ("Personal driver required for daily office commute in {area}",
             "Looking for an experienced, licensed driver for daily office pickup and drop in {area}. Familiarity with city routes and a clean driving record are required."),
            ("Family driver needed, {area} based",
             "Seeking a careful, courteous driver for school runs and family errands around {area}. Valid driving license and a safe track record required."),
            ("Full-time driver wanted for corporate vehicle in {area}",
             "Need a disciplined, well-presented driver for a company vehicle based in {area}. Daily logging of mileage and basic vehicle upkeep expected."),
        ],
    ),
    "Baby Sitters": dict(
        price=(15000, 35000, "month"),
        posts=[
            ("Caring babysitter needed for two kids in {area}",
             "Looking for a patient, experienced babysitter to look after two children after school hours in {area}. Basic first aid knowledge preferred."),
            ("Live-in nanny required in {area}",
             "Family in {area} seeking a live-in nanny for infant care, feeding and daily routines. References from previous families required."),
            ("Weekend babysitter wanted in {area}",
             "Need a reliable babysitter for weekend coverage for a toddler in {area}. Experience with young children and a calm temperament essential."),
        ],
    ),
    "Cooks": dict(
        price=(15000, 32000, "month"),
        posts=[
            ("Home cook wanted for daily meals in {area}",
             "Looking for a skilled cook to prepare daily desi meals for a family of five in {area}. Must be clean, punctual and experienced with home-style cooking."),
            ("Part-time cook needed for dinner service in {area}",
             "Seeking an experienced cook for evening meal preparation in {area}, five days a week. Continental and desi cuisine experience is a plus."),
            ("Cook required for small office kitchen in {area}",
             "Need a reliable cook to prepare lunch for a small office team in {area} on weekdays. Experience with bulk cooking preferred."),
        ],
    ),
    "Home Teachers": dict(
        price=(8000, 25000, "month"),
        posts=[
            ("Home tutor needed for Matric student in {area}",
             "Looking for a qualified home tutor to teach Mathematics and Science to a Matric-level student in {area}, three days a week."),
            ("English & Quran tutor required in {area}",
             "Seeking a patient tutor for English language and Quran Nazra lessons for two children in {area}, evenings preferred."),
            ("O-Level tutor wanted for Physics and Chemistry in {area}",
             "Need an experienced tutor for O-Level Physics and Chemistry, twice a week, for a student based in {area}."),
        ],
    ),
    "Watchmen": dict(
        price=(15000, 26000, "month"),
        posts=[
            ("Night watchman needed for residential building in {area}",
             "Looking for a reliable, experienced night watchman to secure a residential building in {area}. CCTV monitoring experience preferred."),
            ("Security guard required for house in {area}",
             "Seeking a vigilant security guard for day and night shifts at a private residence in {area}. Prior security experience required."),
            ("Gate security required for small housing block in {area}",
             "Need a dependable watchman to manage gate security and visitor logging for a housing block in {area}."),
        ],
    ),
    "Electricians": dict(
        price=(500, 2500, "hour"),
        posts=[
            ("Electrician needed for home wiring repair in {area}",
             "Looking for a certified electrician to fix faulty wiring and replace a circuit breaker at a home in {area}. Same-day service preferred."),
            ("Electrician required for fan and light installation in {area}",
             "Need an experienced electrician to install ceiling fans and light fixtures across three rooms in {area}."),
            ("Electrician wanted for solar panel setup inspection in {area}",
             "Seeking a licensed electrician to inspect and troubleshoot an existing solar panel setup at a property in {area}."),
        ],
    ),
    "Plumbers": dict(
        price=(500, 2500, "hour"),
        posts=[
            ("Plumber needed for bathroom leak repair in {area}",
             "Looking for a licensed plumber to fix a persistent leak and reseal fittings in a bathroom in {area}."),
            ("Plumber required for water heater installation in {area}",
             "Seeking an experienced plumber to install a new water heater and check pipe connections at a home in {area}."),
            ("Plumber wanted for kitchen pipe fitting in {area}",
             "Need a reliable plumber for new kitchen sink pipe fitting and drain unclogging in {area}."),
        ],
    ),
    "Cleaners": dict(
        price=(1500, 4000, "day"),
        posts=[
            ("Deep cleaning service needed for apartment in {area}",
             "Looking for a professional cleaner for a full deep clean of a 2-bedroom apartment in {area}, including kitchen and bathrooms."),
            ("Move-out cleaning required in {area}",
             "Need a thorough move-out cleaning service for a house in {area} before handover, including carpets and windows."),
            ("Weekly cleaning service wanted for office in {area}",
             "Seeking a reliable cleaner for a weekly deep clean of a small office space in {area}."),
        ],
    ),
}


def random_phone(index):
    prefix = PHONE_PREFIXES[index % len(PHONE_PREFIXES)]
    return f"{prefix}-{3000000 + index:07d}"


def random_future_date():
    days_ahead = random.randint(1, 21)
    return (date.today() + timedelta(days=days_ahead)).isoformat()


def seed(per_category):
    print(f"Clearing any previous '{SEED_SOURCE}' batch...")
    customer_collection.delete_many({"seedSource": SEED_SOURCE})
    job_post_collection.delete_many({"seedSource": SEED_SOURCE})

    print("Clearing the current job board (replacing it entirely)...")
    job_post_collection.delete_many({})

    hashed_password = hash_password(DEMO_PASSWORD)

    print(f"Creating {len(DEMO_CUSTOMERS)} demo customers...")
    customer_docs = []
    customer_ids = []
    for i, name in enumerate(DEMO_CUSTOMERS):
        customer_id = generate_customer_id()
        customer_ids.append((customer_id, name, random_phone(i)))
        customer_docs.append({
            "fullName": name,
            "email": f"{name.split()[0].lower()}{i:03d}@helpghar-demo.pk",
            "phone": random_phone(i),
            "address": f"House {random.randint(1, 300)}, Street {random.randint(1, 40)}, {random.choice(AREAS)}, {CITY}",
            "password": hashed_password,
            "customerId": customer_id,
            "status": "Active",
            "seedSource": SEED_SOURCE,
        })
    customer_collection.insert_many(customer_docs)

    print(f"Generating {per_category} job posts per category across {len(CATEGORY_JOBS)} categories...")
    job_docs = []
    for category, cfg in CATEGORY_JOBS.items():
        price_min, price_max, unit = cfg["price"]
        for i in range(per_category):
            title_tpl, desc_tpl = cfg["posts"][i % len(cfg["posts"])]
            area = random.choice(AREAS)
            customer_id, customer_name, customer_phone = random.choice(customer_ids)

            spread = random.uniform(0.9, 1.15)
            budget_min = int(price_min * spread)
            budget_max = int(price_max * spread)
            if budget_max <= budget_min:
                budget_max = budget_min + max(500, int(budget_min * 0.2))

            job_docs.append({
                "jobId": generate_job_id(),
                "category": category,
                "title": title_tpl.format(area=area),
                "description": desc_tpl.format(area=area),
                "budgetMin": budget_min,
                "budgetMax": budget_max,
                "budgetUnit": unit,
                "address": f"{area}, {CITY}",
                "preferredDate": random_future_date(),
                "preferredTime": random.choice(TIME_SLOTS),
                "customerId": customer_id,
                "customerName": customer_name,
                "customerPhone": customer_phone,
                "status": "open",
                "createdAt": date.today().isoformat() + "T09:00:00.000000",
                "seedSource": SEED_SOURCE,
            })

    job_post_collection.insert_many(job_docs)

    print(f"\nDone. Seeded {len(job_docs)} professional job posts across {len(CATEGORY_JOBS)} categories in {CITY}:")
    for category in CATEGORY_JOBS:
        print(f"  {category:<15} {per_category}")
    print(f"\nDemo login password for every seeded customer: {DEMO_PASSWORD}")
    print("(email format: firstname000@helpghar-demo.pk, e.g. hassan000@helpghar-demo.pk)")


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    seed(count)
