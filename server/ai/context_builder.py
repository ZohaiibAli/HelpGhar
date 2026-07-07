"""
=========================================================

HelpGhar AI
Context Builder

Purpose
-------

Creates clean context for Gemini.

Input

Ranked Workers

↓

Readable Context

↓

Prompt

↓

Gemini

=========================================================
"""

from typing import Dict, List

from ai.worker_serializer import worker_serializer


class ContextBuilder:

    """
    Builds context for Gemini.
    """

    def __init__(self):

        self.separator = "\n" + "-" * 60 + "\n"

    # =====================================================
    # SINGLE WORKER
    # =====================================================

    def build_worker_context(
        self,
        worker: Dict,
        index: int
    ) -> str:

        worker = worker_serializer.serialize(worker)

        context = f"""
Worker {index}

Worker ID: {worker['workerId']}

Name: {worker['name']}

Category: {worker['category']}

City: {worker['city']}

Gender: {worker['gender']}

Age: {worker['age']}

Experience: {worker['experience']}

Member Since: {worker['memberSince']}

Price: {worker['price']}

Rating: {worker['rating']}

Reviews: {worker['reviews']}

Verified: {worker['verified']}

Available: {worker['available']}

Skills:
{worker['skills']}

Badges:
{worker['badges']}

Certificates:
{worker['certificates']}

Bio:
{worker['bio']}

Search Score:
{worker['score']}
"""

        return context.strip()

    # =====================================================
    # MULTIPLE WORKERS
    # =====================================================

    def build_workers_context(
        self,
        workers: List[Dict]
    ) -> str:
        """
        Build context for multiple ranked workers.
        """

        if not workers:
            return self.build_empty_context()

        sections = []

        for index, worker in enumerate(workers, start=1):

            sections.append(
                self.build_worker_context(
                    worker,
                    index
                )
            )

        return self.separator.join(sections)

    # =====================================================
    # EMPTY CONTEXT
    # =====================================================

    def build_empty_context(self) -> str:
        """
        Returned when no worker matches.
        """

        return """
No matching workers were found in the HelpGhar database.

Do not invent workers.

Politely tell the user that no matching service providers
are currently available.

Suggest changing filters such as:

• City
• Budget
• Experience
• Category

Never create fake workers.
""".strip()

    # =====================================================
    # GENERAL CONTEXT
    # =====================================================

    def build_general_context(self) -> str:
        """
        General HelpGhar knowledge.
        """

        return """
HelpGhar is an online platform that connects customers with verified workers.

Workers can offer services such as:

• House Servants
• Electricians
• Plumbers
• Carpenters
• AC Technicians
• Mechanics
• Tutors
• Painters
• Drivers

Customers can search workers using:

• Category
• City
• Budget
• Experience
• Availability

Always recommend verified workers whenever possible.

Never create workers that are not present in the provided context.
""".strip()

    # =====================================================
    # COMPLETE RAG CONTEXT
    # =====================================================

    def build_rag_context(
        self,
        workers: List[Dict]
    ) -> str:
        """
        Final context sent to Gemini.

        General HelpGhar Info

        +

        Matching Workers
        """

        general = self.build_general_context()

        worker_context = self.build_workers_context(
            workers
        )

        return f"""
================ HELP GHAR =================

{general}

================ MATCHING WORKERS =================

{worker_context}

=============================================
""".strip()


context_builder = ContextBuilder()