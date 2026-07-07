"""
========================================================

HelpGhar AI
Worker Serializer

Purpose
-------
Converts MongoDB worker documents into
LLM-friendly objects.

Database
↓

Readable AI Context

========================================================
"""

from typing import Dict, List


class WorkerSerializer:

    # ======================================================
    # PRICE
    # ======================================================

    def serialize_price(
        self,
        worker: Dict
    ) -> str:

        minimum = worker.get("priceMin", 0)

        maximum = worker.get("priceMax", 0)

        unit = worker.get("priceUnit", "")

        return f"Rs. {minimum:,} - Rs. {maximum:,} / {unit}"

    # ======================================================
    # EXPERIENCE
    # ======================================================

    def serialize_experience(
        self,
        worker: Dict
    ) -> str:

        years = worker.get(
            "experienceYears",
            0
        )

        if years == 1:

            return "1 year"

        return f"{years} years"




    # ======================================================
    # SKILLS
    # ======================================================

    def serialize_skills(
        self,
        worker: Dict
    ) -> str:

        skills = worker.get(
            "skills",
            []
        )

        if not skills:

            return "Not specified"

        return ", ".join(skills)

    # ======================================================
    # BADGES
    # ======================================================

    def serialize_badges(
        self,
        worker: Dict
    ) -> str:

        badges = worker.get(
            "badges",
            []
        )

        if not badges:

            return "None"

        return ", ".join(badges)

    # ======================================================
    # CERTIFICATES
    # ======================================================

    def serialize_certificates(
        self,
        worker: Dict
    ) -> str:

        certificates = worker.get(
            "certificates",
            []
        )

        if not certificates:

            return "None"

        return ", ".join(certificates)

    # ======================================================
    # SINGLE WORKER
    # ======================================================

    def serialize(
        self,
        worker: Dict
    ) -> Dict:

        return {

            "workerId": worker.get("workerId"),

            "name": worker.get("fullName"),

            "category": worker.get("category"),

            "city": worker.get("city"),

            "gender": worker.get("gender"),

            "age": worker.get("age"),

            "experience": self.serialize_experience(
                worker
            ),

            "memberSince": worker.get(
                "memberSince"
            ),

            "price": self.serialize_price(
                worker
            ),

            "rating": worker.get(
                "rating",
                0
            ),

            "reviews": worker.get(
                "reviewsCount",
                0
            ),

           "verified": worker.get(
                "cnicVerified",
                False
            ),

            "available": worker.get(
                "available",
                False
            ),

            "badges": self.serialize_badges(
                worker
            ),

            "skills": self.serialize_skills(
                worker
            ),

            "bio": worker.get(
                "bio",
                "No bio available."
            ),

            "certificates": self.serialize_certificates(
                worker
            ),

            "score": worker.get(
                "score",
                0
            ),

            "avatar": worker.get(
                "avatar"
            )

        }

    # ======================================================
    # MULTIPLE WORKERS
    # ======================================================

    def serialize_many(
        self,
        workers: List[Dict]
    ) -> List[Dict]:

        return [

            self.serialize(worker)

            for worker in workers

        ]


worker_serializer = WorkerSerializer()