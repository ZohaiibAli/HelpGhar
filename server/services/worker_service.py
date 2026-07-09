"""
==========================================================
HelpGhar AI - Worker Service

Purpose
-------
This service ONLY communicates with MongoDB.

Responsibilities

✔ Build MongoDB queries
✔ Fetch workers
✔ Normalize workers
✔ Return clean dictionaries

This service NEVER

❌ Calls Gemini
❌ Builds prompts
❌ Ranks workers
❌ Formats chatbot responses

Those responsibilities belong to other services.

==========================================================
"""

from typing import List, Dict, Any, Optional

import re
import logging

from bson import ObjectId

from config.db import gig_collection

from ai.filter_extractor import (
    extract_filters,
    WorkerSearchFilters,
)

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)


class WorkerService:

    """
    MongoDB Worker Search Service
    """

    def __init__(self):

        self.collection = gig_collection

    # ==========================================================
    # PUBLIC SEARCH
    # ==========================================================

    def search(
        self,
        question: str,
        limit: int = 5
    ) -> List[Dict]:
        """
        Main search entry.

        User Question
                ↓
        Extract Filters
                ↓
        Build Mongo Query
                ↓
        Mongo Search
                ↓
        Normalize Results

        IMPORTANT: if no service category could be identified from the
        question, we deliberately return an empty list instead of
        falling back to an unfiltered query. Without this guard, any
        message that vaguely resembles a worker-search intent (but
        names no actual service) would return arbitrary top-ranked
        gigs regardless of relevance - which is what previously caused
        "any worker-related query returns all gigs".
        """

        filters = extract_filters(question)

        logger.info(f"Filters : {filters}")

        if not filters.category:

            logger.info(
                "No category resolved from question - skipping "
                "unfiltered worker search."
            )

            return []

        return self.search_raw(filters, limit=limit)

    # ==========================================================
    # RAW SEARCH
    # ==========================================================

    def search_raw(
        self,
        filters: WorkerSearchFilters,
        limit: int = 20
    ) -> List[Dict]:
        """
        Used internally by Chat/Ranking Service when filters have
        already been resolved.
        """

        query = self.build_query(filters)

        projection = self.get_projection()

        return list(

            self.collection.find(

                query,

                projection

            ).limit(limit)

        )

    # ==========================================================
    # QUERY BUILDER
    # ==========================================================

    def build_query(
        self,
        filters: WorkerSearchFilters
    ) -> Dict[str, Any]:

        query = {

            "status": "Active"

        }

        # -----------------------------
        # Category (case-insensitive exact match)
        # -----------------------------

        if filters.category:

            query["category"] = {

                "$regex": f"^{re.escape(filters.category)}$",

                "$options": "i"

            }

        # -----------------------------
        # City (case-insensitive exact match)
        # -----------------------------

        if filters.city:

            query["city"] = {

                "$regex": f"^{re.escape(filters.city)}$",

                "$options": "i"

            }

        # -----------------------------
        # Gender
        # -----------------------------

        if filters.gender:

            query["gender"] = {

                "$regex": f"^{re.escape(filters.gender)}$",

                "$options": "i"

            }

        # -----------------------------
        # Availability
        # -----------------------------

        if filters.available is not None:

            query["available"] = filters.available

        # -----------------------------
        # Verification
        # -----------------------------

        if filters.verified:

            query["cnicVerified"] = True

        # -----------------------------
        # Experience
        # -----------------------------

        if filters.min_experience:

            query["experienceYears"] = {

                "$gte": filters.min_experience

            }

        # -----------------------------
        # Rating
        # -----------------------------

        if filters.min_rating:

            query["rating"] = {

                "$gte": filters.min_rating

            }

        # -----------------------------
        # Price
        # -----------------------------

        if filters.min_price:

            query["priceMax"] = {

                "$gte": filters.min_price

            }

        if filters.max_price:

            query["priceMin"] = {

                "$lte": filters.max_price

            }

        return query

    # ==========================================================
    # PROJECTION
    # ==========================================================

    def get_projection(self):

        return {

            "_id": 1,

            "workerId": 1,

            "fullName": 1,

            "avatar": 1,

            "category": 1,

            "city": 1,

            "gender": 1,

            "age": 1,

            "experienceYears": 1,

            "memberSince": 1,

            "priceMin": 1,

            "priceMax": 1,

            "priceUnit": 1,

            "rating": 1,

            "reviewsCount": 1,

            "available": 1,

            "cnicVerified": 1,

            "badges": 1,

            "bio": 1,

            "skills": 1,

            "certificates": 1,

            "status": 1
        }

    # ==========================================================
    # GET WORKER BY ID
    # ==========================================================

    def get_worker_by_id(
        self,
        worker_id: str
    ) -> Optional[Dict]:

        worker = self.collection.find_one(

            {
                "_id": ObjectId(worker_id)
            },

            self.get_projection()

        )

        if worker is None:

            return None

        return self.normalize(worker)

    # ==========================================================
    # GET MULTIPLE WORKERS
    # ==========================================================

    def get_workers_by_ids(
        self,
        worker_ids: List[str]
    ) -> List[Dict]:

        object_ids = []

        for wid in worker_ids:

            try:
                object_ids.append(ObjectId(wid))
            except Exception:
                continue

        workers = list(

            self.collection.find(

                {
                    "_id": {
                        "$in": object_ids
                    }
                },

                self.get_projection()

            )

        )

        return [

            self.normalize(worker)

            for worker in workers

        ]

    # ==========================================================
    # NORMALIZE PRICE
    # ==========================================================

    def normalize_price(
        self,
        worker: Dict
    ) -> str:

        minimum = worker.get("priceMin", 0)

        maximum = worker.get("priceMax", 0)

        unit = worker.get("priceUnit", "")

        return f"Rs. {minimum:,} - Rs. {maximum:,} / {unit}"

    # ==========================================================
    # NORMALIZE SKILLS
    # ==========================================================

    def normalize_skills(
        self,
        worker: Dict
    ) -> List[str]:

        skills = worker.get("skills", [])

        if skills is None:
            return []

        return skills

    # ==========================================================
    # NORMALIZE BADGES
    # ==========================================================

    def normalize_badges(
        self,
        worker: Dict
    ) -> List[str]:

        badges = worker.get("badges", [])

        if badges is None:
            return []

        return badges

    # ==========================================================
    # NORMALIZE DOCUMENT
    # ==========================================================

    def normalize(
        self,
        worker: Dict
    ) -> Dict:

        return {

            "id": str(worker.get("_id")),

            "workerId": worker.get("workerId"),

            "fullName": worker.get("fullName"),

            "avatar": worker.get("avatar"),

            "category": worker.get("category"),

            "city": worker.get("city"),

            "gender": worker.get("gender"),

            "age": worker.get("age"),

            "experienceYears": worker.get("experienceYears"),

            "memberSince": worker.get("memberSince"),

            "priceMin": worker.get("priceMin"),

            "priceMax": worker.get("priceMax"),

            "priceUnit": worker.get("priceUnit"),

            "priceDisplay": self.normalize_price(worker),

            "rating": worker.get("rating", 0),

            "reviewsCount": worker.get("reviewsCount", 0),

            "available": worker.get("available", False),

            "cnicVerified": worker.get("cnicVerified", False),

            "badges": self.normalize_badges(worker),

            "skills": self.normalize_skills(worker),

            "bio": worker.get("bio", ""),

            "certificates": worker.get("certificates", []),

            "status": worker.get("status")
        }

    # ==========================================================
    # EXISTS
    # ==========================================================

    def exists(
        self,
        worker_id: str
    ) -> bool:

        try:

            worker = self.collection.find_one(

                {
                    "_id": ObjectId(worker_id)
                }

            )

            return worker is not None

        except Exception:

            return False

    # ==========================================================
    # COUNT ACTIVE GIGS
    # ==========================================================

    def count(self) -> int:

        return self.collection.count_documents(

            {
                "status": "Active"
            }

        )

    # ==========================================================
    # HEALTH CHECK
    # ==========================================================

    def health_check(self) -> Dict:

        try:

            total = self.collection.count_documents({})

            active = self.collection.count_documents(

                {
                    "status": "Active"
                }

            )

            return {

                "healthy": True,

                "collection": "gigs",

                "totalDocuments": total,

                "activeDocuments": active

            }

        except Exception as e:

            logger.exception(e)

            return {

                "healthy": False,

                "error": str(e)

            }


# ==========================================================
# SINGLETON INSTANCE
# ==========================================================

worker_service = WorkerService()