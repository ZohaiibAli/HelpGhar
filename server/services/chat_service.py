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

from ai.filter_extractor import extract_filters, CATEGORY_SYNONYMS

from services.prompt_service import prompt_service

from ai.llm import generate, GeminiQuotaExceededError

from ai.context_builder import context_builder

from services.worker_service import worker_service

from services.ranking_service import ranking_service

from model.chat_response import ChatResponse

from services.conversation_service import conversation_service


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
        session_id,
        history,
        question,
        instruction,
        limit=5
    ):
        """
        Generic helper for all RAG-based responses.
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

            # If Qdrant has nothing relevant at all, don't let Gemini
            # improvise - give a clear, professional fallback instead.
            if not context.strip():

                answer = (
                    "I couldn't find specific information about that in "
                    "HelpGhar's knowledge base right now. You're welcome "
                    "to rephrase your question, or reach out to HelpGhar "
                    "support directly through your account dashboard for "
                    "further assistance."
                )

            else:

                prompt = prompt_service.build_rag_prompt(
                    question=question,
                    context=f"""
Conversation History

{history}

--------------------------------

Knowledge Base

{context}
""",
                    instruction=instruction
                )

                answer = generate(prompt)

            conversation_service.add_message(
                session_id,
                "assistant",
                answer
            )

            conversation_service.trim_messages(session_id)

            return ChatResponse(
                success=True,
                intent="knowledge",
                message=answer,
                workers_found=0,
                workers=[],
                sources=[
                    document.get("filename")
                    for document in documents
                    if document.get("filename")
                ]
            )

        except GeminiQuotaExceededError as e:

            logger.warning(f"Gemini quota exceeded: {e}")

            return ChatResponse(
                success=False,
                intent="error",
                message=(
                    "HelpGhar's AI assistant has reached its usage limit "
                    "for right now. Please try again shortly, or browse "
                    "services directly from the site in the meantime."
                ),
                workers_found=0,
                workers=[],
                sources=[]
            )

        except Exception as e:

            logger.exception(e)

            return ChatResponse(
                success=False,
                intent="error",
                message=(
                    "I'm sorry, something went wrong while retrieving "
                    "that information. Please try again in a moment."
                ),
                workers_found=0,
                workers=[],
                sources=[]
            )

    # =======================================================
    # PUBLIC
    # =======================================================

    def chat(
        self,
        session_id: str,
        question: str
    ):
        """
        Entry point. Called from FastAPI route.
        """

        logger.info(f"Session : {session_id}")
        logger.info(f"Question : {question}")

        conversation_service.add_message(
            session_id=session_id,
            role="user",
            content=question
        )

        history = conversation_service.build_history(session_id)

        logger.info(f"Conversation History:\n{history}")

        intent = classify(question)

        logger.info(f"Intent : {intent}")

        if intent == Intent.GREETING:

            response = self.handle_greeting()

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=response.message
            )

            return response

        elif intent == Intent.WORKER_SEARCH:

            return self.handle_worker_search(
                session_id,
                question,
                history
            )

        elif intent == Intent.POLICY:

            return self.handle_policy(
                session_id,
                question,
                history
            )

        elif intent == Intent.BOOKING:

            return self.handle_booking(
                session_id,
                question,
                history
            )

        elif intent == Intent.AUTH:

            response = self.handle_auth()

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=response.message
            )

            return response

        else:

            return self.handle_general(
                session_id,
                question,
                history
            )

    # =======================================================
    # WORKER SEARCH (RAG + structured filters)
    # =======================================================

    def handle_worker_search(
        self,
        session_id: str,
        question: str,
        history: str
    ):
        """
        Complete worker-matching pipeline.

        Key fix: we resolve filters BEFORE touching the database. If no
        service category can be identified from the question, we never
        run an unfiltered Mongo query (which previously returned
        arbitrary gigs regardless of relevance) - we ask a clarifying
        question instead.
        """

        logger.info("Starting Worker Search Pipeline")

        filters = extract_filters(question)

        # -------------------------------------------
        # No identifiable category -> ask, don't guess
        # -------------------------------------------

        if not filters.category:

            categories = ", ".join(sorted(CATEGORY_SYNONYMS.keys()))

            answer = (
                "I'd be happy to help you find a worker. Could you let me "
                "know what type of service you're looking for? For "
                f"example: {categories}."
            )

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=answer
            )

            return ChatResponse(
                success=True,
                intent="worker_search",
                message=answer,
                workers_found=0,
                workers=[],
                sources=[]
            )

        # -------------------------------------------
        # STEP 1 — Search MongoDB with resolved filters
        # -------------------------------------------

        workers = worker_service.search_raw(filters, limit=20)

        logger.info(f"Workers Found : {len(workers)}")

        # -------------------------------------------
        # STEP 2 — Rank workers
        # -------------------------------------------

        ranked_workers = ranking_service.rank_workers(workers)

        ranked_workers = ranking_service.filter_low_scores(ranked_workers)

        top_workers = ranking_service.top_workers(ranked_workers, limit=5)

        logger.info(f"Top Workers : {len(top_workers)}")

        # -------------------------------------------
        # STEP 3 — No matches: professional, specific response
        # -------------------------------------------

        if not top_workers:

            details = [f"category '{filters.category}'"]

            if filters.city:
                details.append(f"city '{filters.city}'")
            if filters.min_experience:
                details.append(f"at least {filters.min_experience} years experience")
            if filters.min_rating:
                details.append(f"rating above {filters.min_rating}")
            if filters.max_price:
                details.append(f"budget under Rs. {filters.max_price}")
            if filters.verified:
                details.append("verified status")

            criteria = ", ".join(details)

            answer = (
                f"I couldn't find any verified {filters.category} matching "
                f"your criteria ({criteria}) at the moment. You could try "
                "widening your search — for example, a different city, a "
                "higher budget, or removing the experience/rating filter — "
                "and I'll check again."
            )

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=answer
            )

            return ChatResponse(
                success=True,
                intent="worker_search",
                message=answer,
                workers_found=0,
                workers=[],
                sources=[]
            )

        # -------------------------------------------
        # STEP 4 — Build context + prompt
        # -------------------------------------------

        context = context_builder.build_rag_context(top_workers)

        prompt = prompt_service.worker_search_prompt(
            question=question,
            context=f"""
Conversation History

{history}

--------------------------------

Current Search Context

{context}
"""
        )

        logger.info("Prompt Created")

        # -------------------------------------------
        # STEP 5 — Gemini
        # -------------------------------------------

        try:

            answer = generate(prompt)

            serialized_workers = [
                {
                    "id": str(worker.get("_id")),
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

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=answer,
                metadata={"workers": serialized_workers}
            )

            conversation_service.trim_messages(
                session_id=session_id,
                keep_last=20
            )

            return ChatResponse(
                success=True,
                intent="worker_search",
                message=answer,
                workers_found=len(serialized_workers),
                workers=serialized_workers,
                sources=[]
            )

        except GeminiQuotaExceededError as e:

            logger.warning(f"Gemini quota exceeded: {e}")

            answer = (
                "HelpGhar's AI assistant has reached its usage limit for "
                "right now. Please try again shortly, or browse workers "
                "directly from the site in the meantime."
            )

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=answer
            )

            return ChatResponse(
                success=False,
                intent="error",
                message=answer,
                workers_found=0,
                workers=[],
                sources=[]
            )

        except Exception as e:

            logger.exception(e)

            answer = (
                "I'm sorry, I'm currently unable to process your request. "
                "Please try again in a few moments."
            )

            conversation_service.add_message(
                session_id=session_id,
                role="assistant",
                content=answer
            )

            return ChatResponse(
                success=False,
                intent="error",
                message=answer,
                workers_found=0,
                workers=[],
                sources=[]
            )

    # =======================================================
    # GREETING
    # =======================================================

    def handle_greeting(self):

        return ChatResponse(
            success=True,
            intent="greeting",
            message=prompt_service.greeting_prompt()
        )

    # =======================================================
    # POLICY
    # =======================================================

    def handle_policy(
        self,
        session_id: str,
        question: str,
        history: str
    ):

        return self.generate_rag_response(
            session_id=session_id,
            history=history,
            question=question,
            instruction="""
Answer ONLY using HelpGhar policy information.

Do not invent policies.
""",
            limit=5
        )

    # =======================================================
    # BOOKING
    # =======================================================

    def handle_booking(
        self,
        session_id: str,
        question: str,
        history: str
    ):

        return self.generate_rag_response(
            session_id=session_id,
            history=history,
            question=question,
            instruction="""
Answer ONLY using HelpGhar booking information.

Never invent booking rules.
""",
            limit=5
        )

    # =======================================================
    # AUTH
    # =======================================================

    def handle_auth(self):

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

    def handle_general(
        self,
        session_id: str,
        question: str,
        history: str
    ):

        return self.generate_rag_response(
            session_id=session_id,
            history=history,
            question=question,
            instruction="""
Answer ONLY using the HelpGhar knowledge base.
""",
            limit=5
        )


# =======================================================
# Singleton Instance
# =======================================================

chat_service = ChatService()