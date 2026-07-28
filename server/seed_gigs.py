"""
Bulk-seeds realistic demo worker + gig data into MongoDB.

Run with (from the server/ directory, same as create_admin.py):

    python seed_gigs.py            # seeds 1000 gigs (default)
    python seed_gigs.py 250        # seeds a custom amount instead

What it does
------------
For every gig it also creates a matching worker account (worker_collection)
and a worker_details record, because /worker/gigs pulls rating,
reviewsCount, marketplaceScore and reputationLabel from the WORKER
document, not the gig — a gig with no matching worker would render with
zeros. All seeded workers share one demo login password, printed at the
end, in case you want to log into one from the Worker login page.

Idempotent
----------
Every document this script creates is tagged {"seedSource": "seed_gigs"}.
Re-running it first deletes anything with that tag (from ALL previous
runs, regardless of count) and then inserts a fresh batch — so you can
run it as many times as you like without piling up duplicates or ever
touching a real, hand-registered account.
"""

import random
import sys
from datetime import date, timedelta

from config.db import (
    worker_collection,
    gig_collection,
    worker_details_collection,
)
from helper.password_helper import hash_password
from helper.id_helper import generate_worker_id

SEED_SOURCE = "seed_gigs"
DEMO_PASSWORD = "Worker@123"
CITY = "Karachi"

AREAS = [
    "DHA", "Clifton", "Gulshan-e-Iqbal", "North Nazimabad", "Malir",
    "Korangi", "Nazimabad", "Gulistan-e-Johar", "PECHS", "Saddar",
    "Bahadurabad", "Federal B Area", "Model Colony", "Landhi",
]

# i.pravatar.cc is the same free avatar source already used elsewhere in
# this codebase (HeroSection, WorkerCard, mock testimonials). It only has
# ~70 distinct photos, so at 1000 records each photo is reused ~14x —
# normal for seed/demo data.
AVATAR_POOL = [f"https://i.pravatar.cc/300?img={i}" for i in range(1, 71)]

MALE_FIRST_NAMES = [
    "Ahmed", "Ali", "Hassan", "Usman", "Bilal", "Fahad", "Imran", "Kamran",
    "Waqas", "Shahid", "Adeel", "Faisal", "Zeeshan", "Junaid", "Asad",
    "Rizwan", "Saad", "Tariq", "Naveed", "Yasir", "Salman", "Umer",
    "Arslan", "Haris", "Danish", "Farhan", "Sajid", "Nasir", "Rashid",
    "Aftab", "Shoaib", "Irfan", "Sohail", "Aamir", "Kashif", "Noman",
    "Zubair", "Waseem", "Adnan", "Tahir",
]

FEMALE_FIRST_NAMES = [
    "Ayesha", "Fatima", "Sara", "Mariam", "Zainab", "Hira", "Amina",
    "Rabia", "Sana", "Nida", "Iqra", "Komal", "Sadia", "Rukhsar",
    "Maryam", "Sidra", "Anum", "Bushra", "Farah", "Naila", "Uzma",
    "Shazia", "Saima", "Nazia", "Asma", "Beenish", "Mehwish", "Zara",
    "Noreen", "Samina",
]

LAST_NAMES = [
    "Khan", "Ali", "Ahmed", "Malik", "Sheikh", "Butt", "Raza", "Hussain",
    "Iqbal", "Farooq", "Baig", "Qureshi", "Chaudhry", "Abbasi",
    "Siddiqui", "Ansari", "Rana", "Mirza", "Awan", "Soomro", "Memon",
    "Bhatti", "Gill", "Warraich", "Javed", "Yousaf", "Saeed", "Mehmood",
    "Aslam", "Nawaz",
]

PHONE_PREFIXES = ["0300", "0301", "0302", "0312", "0321", "0333", "0334", "0345"]

# Canonical category names -- must match ai/filter_extractor.py
# CATEGORY_SYNONYMS and client/src/types/index.ts WorkerCategory exactly,
# or search/filtering silently returns 0 results for these workers.
CATEGORY_CONFIG = {
    "House Servants": dict(
        weight=0.225,
        gender_weights={"Female": 0.8, "Male": 0.2},
        age_range=(20, 50), experience_range=(1, 15),
        price=(12000, 28000, "month"),
        skills=["Deep cleaning", "Cooking", "Laundry & ironing", "Dishwashing",
                "Organizing", "Childcare support"],
        certs=["First Aid Trained"],
        bios=[
            "Runs a tight household — cleaning, laundry, and cooking handled daily across {area}. {years} years with the same families.",
            "Reliable full-time house help serving {area} for {years}+ years. References available on request.",
            "Specializes in deep cleaning and meal prep for busy households in {area}.",
        ],
    ),
    "Drivers": dict(
        weight=0.156,
        gender_weights={"Male": 0.97, "Female": 0.03},
        age_range=(22, 55), experience_range=(1, 20),
        price=(20000, 45000, "month"),
        skills=["City driving", "Airport pickup & drop", "Long route driving",
                "Defensive driving", "School run", "Corporate driving"],
        certs=["Valid Driving License", "Defensive Driving Certificate"],
        bios=[
            "Licensed driver with {years} years navigating {area} and beyond. Careful with kids, punctual with schedules.",
            "Full-time personal driver based in {area} — knows the city's shortcuts and traffic patterns cold.",
            "{years} years behind the wheel, zero accidents. Comfortable with sedans, SUVs, and manual transmission.",
        ],
    ),
    "Baby Sitters": dict(
        weight=0.076,
        gender_weights={"Female": 0.95, "Male": 0.05},
        age_range=(20, 45), experience_range=(1, 15),
        price=(15000, 35000, "month"),
        skills=["Infant care", "Homework help", "Meal prep for kids",
                "First aid basics", "Bedtime routines", "Toddler supervision"],
        certs=["First Aid Certified", "CPR Trained"],
        bios=[
            "Caring, patient nanny with {years} years looking after infants and toddlers in {area}.",
            "Trained in first aid and child safety. {years} years of experience with families across {area}.",
            "Helps with homework, meals, and bedtime routines — {years} years working with families in {area}.",
        ],
    ),
    "Cooks": dict(
        weight=0.096,
        gender_weights={"Female": 0.55, "Male": 0.45},
        age_range=(22, 55), experience_range=(1, 20),
        price=(15000, 32000, "month"),
        skills=["Desi cuisine", "Continental dishes", "BBQ & grilling",
                "Baking", "Meal planning", "Diet-specific cooking"],
        certs=["Food Handling Certificate"],
        bios=[
            "Cooks authentic desi and continental meals for households in {area}. {years} years in home kitchens.",
            "Trained cook offering daily meal service across {area} — {years} years of experience, flexible menus.",
            "Specializes in home-style cooking with {years} years of experience serving families in {area}.",
        ],
    ),
    "Home Teachers": dict(
        weight=0.069,
        gender_weights={"Male": 0.5, "Female": 0.5},
        age_range=(21, 50), experience_range=(1, 20),
        price=(8000, 25000, "month"),
        skills=["Mathematics", "Science", "English", "Quran/Nazra",
                "O-Level & A-Level", "Matric & Intermediate"],
        certs=["B.Ed", "M.Ed", "Subject Specialist Certificate"],
        bios=[
            "Home tutor covering Matric to A-Levels, based in {area}. {years} years helping students improve grades.",
            "Focused, patient tutor with {years} years of experience teaching Mathematics and Science in {area}.",
            "Qualified teacher offering one-on-one home tuition across {area} for {years} years.",
        ],
    ),
    "Watchmen": dict(
        weight=0.053,
        gender_weights={"Male": 0.99, "Female": 0.01},
        age_range=(25, 58), experience_range=(1, 25),
        price=(15000, 26000, "month"),
        skills=["Night shift security", "CCTV monitoring", "Access control",
                "Visitor logging", "Perimeter checks"],
        certs=["Security Guard License"],
        bios=[
            "Experienced night watchman serving residential blocks in {area} for {years} years.",
            "Reliable security guard, {years} years on duty across {area} — vigilant and punctual.",
            "Handles gate security, visitor logs, and night patrols in {area}. {years} years of service.",
        ],
    ),
    "Electricians": dict(
        weight=0.111,
        gender_weights={"Male": 0.95, "Female": 0.05},
        age_range=(20, 55), experience_range=(1, 25),
        price=(500, 2500, "hour"),
        skills=["Wiring & rewiring", "Circuit breaker repair", "Appliance installation",
                "Fan & light fitting", "Solar panel setup", "Short circuit troubleshooting"],
        certs=["Certified Electrician (TEVTA)", "Electrical Safety Certificate"],
        bios=[
            "Licensed electrician fixing wiring, MCBs, and short circuits across {area}. {years} years, same-day visits.",
            "Handles everything from fan installation to full rewiring in {area}. {years} years of hands-on experience.",
            "TEVTA-certified electrician serving {area} for {years} years — no shortcuts, no callbacks.",
        ],
    ),
    "Plumbers": dict(
        weight=0.085,
        gender_weights={"Male": 0.97, "Female": 0.03},
        age_range=(20, 55), experience_range=(1, 25),
        price=(500, 2500, "hour"),
        skills=["Leak repair", "Pipe fitting", "Bathroom fitting",
                "Water heater installation", "Drain unclogging", "Water tank repair"],
        certs=["Licensed Plumber"],
        bios=[
            "Fixes leaks, blocked drains, and pipe fittings across {area}. {years} years on the job.",
            "Reliable plumber serving {area} for {years} years — same-day repairs, upfront pricing.",
            "Handles bathroom fittings, water heaters, and emergency leaks in {area}. {years} years of experience.",
        ],
    ),
    "Cleaners": dict(
        weight=0.129,
        gender_weights={"Female": 0.75, "Male": 0.25},
        age_range=(20, 50), experience_range=(1, 15),
        price=(1500, 4000, "day"),
        skills=["Deep cleaning", "Sofa & carpet shampoo", "Window cleaning",
                "Move-in/move-out cleaning", "Kitchen degreasing", "Bathroom sanitizing"],
        certs=[],
        bios=[
            "Deep cleaning specialist covering homes and offices in {area}. {years} years of experience.",
            "Handles move-in/move-out and post-construction cleaning across {area}. {years} years in the trade.",
            "Sofa shampoo, window cleaning, full deep cleans — {years} years serving {area}.",
        ],
    ),
}

BADGE_POOL = ["Top Rated", "Most Trusted", "Rising Star"]


def distribute_counts(total, weights):
    """Largest-remainder rounding so per-category counts sum to exactly `total`."""
    raw = {k: total * w for k, w in weights.items()}
    floors = {k: int(v) for k, v in raw.items()}
    remainder = total - sum(floors.values())
    order = sorted(raw, key=lambda k: raw[k] - floors[k], reverse=True)
    for k in order[:remainder]:
        floors[k] += 1
    return floors


def weighted_choice(weights: dict):
    return random.choices(list(weights.keys()), weights=list(weights.values()))[0]


def random_cnic(index):
    return f"42101-{1000000 + index:07d}-{index % 10}"


def random_phone(index):
    prefix = PHONE_PREFIXES[index % len(PHONE_PREFIXES)]
    return f"{prefix}-{2000000 + index:07d}"


def random_dob(age):
    year = date.today().year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return date(year, month, day).isoformat()


def random_member_since():
    days_back = random.randint(30, 5 * 365)
    return (date.today() - timedelta(days=days_back)).isoformat()


def pick_badges():
    n = random.choices([0, 1, 2], weights=[55, 35, 10])[0]
    return random.sample(BADGE_POOL, n)


def reputation_label(rating, reviews_count):
    if reviews_count < 5:
        return "New Worker"
    if rating >= 4.7:
        return "Customer Favorite"
    if rating >= 4.4:
        return "Highly Appreciated"
    if rating >= 4.0:
        return "Trusted Professional"
    if rating >= 3.6:
        return "Good Reputation"
    return "Needs Improvement"


def review_summary(reviews_count):
    if reviews_count == 0:
        return {"positive": 0, "neutral": 0, "negative": 0, "positivePercentage": 0}
    positive = int(reviews_count * random.uniform(0.7, 0.95))
    negative = int(reviews_count * random.uniform(0, 0.08))
    neutral = max(0, reviews_count - positive - negative)
    return {
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "positivePercentage": round(positive / reviews_count * 100),
    }


def marketplace_score(rating, reviews_count, experience_years):
    score = (rating / 5) * 60 + (min(reviews_count, 200) / 200) * 25 + \
        (min(experience_years, 20) / 20) * 15
    return round(min(score, 100), 1)


def build_records(total):
    category_counts = distribute_counts(total, {k: v["weight"] for k, v in CATEGORY_CONFIG.items()})
    records = []

    for category, cfg in CATEGORY_CONFIG.items():
        for _ in range(category_counts[category]):
            gender = weighted_choice(cfg["gender_weights"])
            first = random.choice(MALE_FIRST_NAMES if gender == "Male" else FEMALE_FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            full_name = f"{first} {last}"

            age = random.randint(*cfg["age_range"])
            experience = random.randint(*cfg["experience_range"])
            experience = max(1, min(experience, age - 16))

            area = random.choice(AREAS)
            price_min, price_max, unit = cfg["price"]
            spread = random.uniform(0.85, 1.2)
            price_min = int(price_min * spread)
            price_max = int(price_max * spread)
            if price_max <= price_min:
                price_max = price_min + max(500, int(price_min * 0.2))

            rating = round(random.uniform(3.6, 5.0), 1)
            reviews_count = min(random.randint(0, 30 + experience * 15), 600)

            bio = random.choice(cfg["bios"]).format(years=experience, area=area)
            skills = random.sample(cfg["skills"], k=min(len(cfg["skills"]), random.randint(3, 5)))
            certs = (
                random.sample(cfg["certs"], k=random.randint(0, min(2, len(cfg["certs"]))))
                if cfg["certs"] else []
            )

            records.append({
                "fullName": full_name,
                "gender": gender,
                "category": category,
                "area": area,
                "age": age,
                "experienceYears": experience,
                "priceMin": price_min,
                "priceMax": price_max,
                "priceUnit": unit,
                "rating": rating,
                "reviewsCount": reviews_count,
                "avatar": random.choice(AVATAR_POOL),
                "bio": bio,
                "skills": skills,
                "certificates": certs,
                "available": random.random() < 0.75,
                "cnicVerified": random.random() < 0.88,
                "badges": pick_badges(),
                "memberSince": random_member_since(),
            })

    random.shuffle(records)
    return records, category_counts


def seed(total):
    print(f"Clearing any previous '{SEED_SOURCE}' batch...")
    worker_collection.delete_many({"seedSource": SEED_SOURCE})
    gig_collection.delete_many({"seedSource": SEED_SOURCE})
    worker_details_collection.delete_many({"seedSource": SEED_SOURCE})

    records, category_counts = build_records(total)

    print(f"Generating {len(records)} workers + gigs...")
    hashed_password = hash_password(DEMO_PASSWORD)  # hashed once — bcrypt is slow, all demo accounts share it

    worker_docs, details_docs, gig_docs = [], [], []

    for i, r in enumerate(records):
        worker_id = generate_worker_id()
        rep_label = reputation_label(r["rating"], r["reviewsCount"])

        worker_docs.append({
            "fullName": r["fullName"],
            "email": f"{r['fullName'].split()[0].lower()}{i:04d}@helpghar-demo.pk",
            "phone": random_phone(i),
            "address": f"House {random.randint(1, 300)}, Street {random.randint(1, 40)}, {r['area']}, {CITY}",
            "password": hashed_password,
            "cnic": random_cnic(i),
            "dob": random_dob(r["age"]),
            "gender": r["gender"],
            "category": r["category"],
            "experience": f"{r['experienceYears']} years",
            "pricing": f"{r['priceMin']}-{r['priceMax']} PKR/{r['priceUnit']}",
            "skills": ", ".join(r["skills"]),
            "workerId": worker_id,
            "status": "Active",
            "rating": r["rating"],
            "reviewsCount": r["reviewsCount"],
            "marketplaceScore": marketplace_score(r["rating"], r["reviewsCount"], r["experienceYears"]),
            "reputationLabel": rep_label,
            "reviewSummary": review_summary(r["reviewsCount"]),
            "seedSource": SEED_SOURCE,
        })

        details_docs.append({
            "workerId": worker_id,
            "workerCode": worker_id,
            "about": r["bio"],
            "skills": ", ".join(r["skills"]),
            "certifications": ", ".join(r["certificates"]),
            "seedSource": SEED_SOURCE,
        })

        gig_docs.append({
            "fullName": r["fullName"],
            "avatar": r["avatar"],
            "category": r["category"],
            "city": CITY,
            "gender": r["gender"],
            "age": r["age"],
            "experienceYears": r["experienceYears"],
            "memberSince": r["memberSince"],
            "priceMin": r["priceMin"],
            "priceMax": r["priceMax"],
            "priceUnit": r["priceUnit"],
            "rating": r["rating"],
            "reviewsCount": r["reviewsCount"],
            "available": r["available"],
            "cnicVerified": r["cnicVerified"],
            "badges": r["badges"],
            "bio": r["bio"],
            "skills": r["skills"],
            "certificates": r["certificates"],
            "workerId": worker_id,
            "status": "Active",
            "seedSource": SEED_SOURCE,
        })

    print("Inserting into MongoDB...")
    worker_collection.insert_many(worker_docs)
    worker_details_collection.insert_many(details_docs)
    gig_collection.insert_many(gig_docs)

    print(f"\nDone. Seeded {len(records)} gigs across {len(CATEGORY_CONFIG)} categories in {CITY}:")
    for category, count in category_counts.items():
        print(f"  {category:<15} {count}")
    print(f"\nDemo login password for every seeded worker: {DEMO_PASSWORD}")
    print("(email format: firstname0000@helpghar-demo.pk, e.g. ahmed0007@helpghar-demo.pk)")


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    seed(count)
