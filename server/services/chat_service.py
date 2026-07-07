"""
=========================================================

HelpGhar AI

Chat Service

Main Orchestrator

Flow

Question
↓

Intent

↓

Worker Search

↓

Ranking

↓

Context

↓

Prompt

↓

Gemini

↓

Response

=========================================================
"""

import logging

from ai.intent import classify, Intent

from services.prompt_service import prompt_service

from ai.llm import generate

from ai.context_builder import context_builder

from services.worker_service import worker_service

from services.ranking_service import ranking_service

from model.chat_response import ChatResponse


logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO)


class ChatService:

    """
    Main AI Pipeline
    """

    def __init__(self):

        pass

        # =======================================================
    # GENERIC RAG RESPONSE
    # =======================================================

    def generate_rag_response(
        self,
        question: str,
        instruction: str,
        limit: int = 5
    ) -> str:
        """
        Generic helper for all RAG-based responses.

        Flow

        Question
            ↓
        Qdrant Retrieval
            ↓
        Prompt Creation
            ↓
        Gemini
            ↓
        Response
        """

        from rag.retriever import retrieve

        try:

            documents = retrieve(
                question,
                limit=limit
            )

            context = "\n\n".join(

                document.get("text", "")

                for document in documents

            )

            prompt = prompt_service.build_rag_prompt(

    question=question,

    context=context

)

            answer = generate(prompt)

            return ChatResponse(

                success=True,

                intent="knowledge",

                message=answer,

                workers_found=0,

                workers=[],

                sources=[
                    document.get("filename")

                    for document in documents
                ]

            )

        except Exception as e:

            logger.exception(e)

            return (
                "I'm sorry, something went wrong while "
                "retrieving the requested information."
            )
        
    # =======================================================
    # PUBLIC
    # =======================================================

    def chat(
        self,
        question: str
    ) -> str:

        """
        Entry point.

        Called from FastAPI route.
        """

        logger.info(
            f"Question : {question}"
        )

        intent = classify(question)

        logger.info(
            f"Intent : {intent}"
        )

        if intent == Intent.GREETING:

            return self.handle_greeting()

        elif intent == Intent.WORKER_SEARCH:

            return self.handle_worker_search(
                question
            )

        elif intent == Intent.POLICY:

            return self.handle_policy(
                question
            )

        elif intent == Intent.BOOKING:

            return self.handle_booking(
                question
            )

        elif intent == Intent.AUTH:

            return self.handle_auth()

        else:

            return self.handle_general(
                question
            )


    # =======================================================
    # WORKER SEARCH (RAG)
    # =======================================================

    def handle_worker_search(
        self,
        question: str
    ) -> str:
        """
        Complete RAG pipeline for worker search.
        """

        logger.info("Starting Worker Search Pipeline")

        # -------------------------------------------
        # STEP 1
        # Search MongoDB
        # -------------------------------------------

        workers = worker_service.search(
            question=question,
            limit=20
        )

        logger.info(
            f"Workers Found : {len(workers)}"
        )

        # -------------------------------------------
        # STEP 2
        # Rank Workers
        # -------------------------------------------

        ranked_workers = ranking_service.rank_workers(
            workers
        )

        ranked_workers = ranking_service.filter_low_scores(
            ranked_workers
        )

        top_workers = ranking_service.top_workers(
            ranked_workers,
            limit=5
        )

        logger.info(
            f"Top Workers : {len(top_workers)}"
        )

        # -------------------------------------------
        # STEP 3
        # Build Context
        # -------------------------------------------

        context = context_builder.build_rag_context(
            top_workers
        )

        # -------------------------------------------
        # STEP 4
        # Prompt
        # -------------------------------------------

        prompt = prompt_service.worker_search_prompt(

    question=question,

    context=context

)

        logger.info("Prompt Created")

        # -------------------------------------------
        # STEP 5
        # Gemini
        # -------------------------------------------

        try:

            answer = generate(prompt)

            serialized_workers = [

                {

                    "workerId": worker.get("workerId"),

                    "name": worker.get("fullName"),

                    "avatar": worker.get("avatar"),

                    "category": worker.get("category"),

                    "city": worker.get("city"),

                    "rating": worker.get("rating"),

                    "experience": worker.get("experienceYears"),

                    "priceMin": worker.get("priceMin"),

                    "priceMax": worker.get("priceMax"),

                    "priceUnit": worker.get("priceUnit"),

                    "available": worker.get("available"),

                    "verified": worker.get("cnicVerified")

                }

                for worker in top_workers

            ]

            return ChatResponse(

                success=True,

                intent="worker_search",

                message=answer,

                workers_found=len(serialized_workers),

                workers=serialized_workers,

                sources=[]

            )

        except Exception as e:

            logger.exception(e)

            return (
                "I'm sorry, I'm currently unable to process your request. "
                "Please try again in a few moments."
            )


    # =======================================================
    # GREETING
    # =======================================================

    def handle_greeting(self) -> str:
        """
        Handle greetings without calling Gemini.
        """

        return ChatResponse(

    success=True,

    intent="greeting",

    message=prompt_service.greeting_prompt()

)

    # =======================================================
    # POLICY
    # =======================================================

        # =======================================================
    # POLICY
    # =======================================================

    def handle_policy(
        self,
        question: str
    ) -> str:

        return self.generate_rag_response(

            question=question,

            instruction="""
Answer ONLY using HelpGhar policy information.

Do not invent policies.
"""

        )

    # =======================================================
    # BOOKING
    # =======================================================

        # =======================================================
    # BOOKING
    # =======================================================

    def handle_booking(
        self,
        question: str
    ) -> str:

        return self.generate_rag_response(

            question=question,

            instruction="""
Answer ONLY using HelpGhar booking information.

Never invent booking rules.
"""

        )


    # =======================================================
    # AUTH
    # =======================================================

    def handle_auth(self) -> str:
        """
        Authentication questions.
        """

        return ChatResponse(

    success=True,

    intent="authentication",

    message=(
        "You can register as a Customer or Worker "
        "using the HelpGhar website."
    )

)

    # =======================================================
    # GENERAL
    # =======================================================

        # =======================================================
    # GENERAL
    # =======================================================

    def handle_general(
        self,
        question: str
    ) -> str:

        return self.generate_rag_response(

            question=question,

            instruction="""
Answer ONLY using the HelpGhar knowledge base.
"""

        )

# =======================================================
# Singleton Instance
# =======================================================

chat_service = ChatService()

