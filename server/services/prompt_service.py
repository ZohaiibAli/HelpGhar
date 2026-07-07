"""
==========================================================

HelpGhar AI

Prompt Service

Purpose

Creates all prompts sent to Gemini.

ChatService should NEVER manually build prompts.

==========================================================
"""

from ai.prompt import SYSTEM_PROMPT


class PromptService:

    """
    Responsible for creating prompts.
    """

    def __init__(self):

        self.system_prompt = SYSTEM_PROMPT


    # =====================================================
    # GENERIC PROMPT
    # =====================================================

    def build_prompt(
        self,
        question: str,
        context: str,
        instructions: str
    ) -> str:

        """
        Generic prompt creator.
        """

        return f"""
{self.system_prompt}

Question:

{question}

Context:

{context}

Instructions:

{instructions}
"""


    # =====================================================
    # WORKER SEARCH
    # =====================================================

    def worker_search_prompt(
        self,
        question: str,
        context: str
    ) -> str:

        instructions = """
Answer ONLY using the workers provided.

Never invent workers.

For each worker mention:

• Name

• Category

• City

• Experience

• Price

• Rating

If no worker exists,

politely inform the user.

Keep your answer concise.

Recommend the highest ranked workers first.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )


    # =====================================================
    # BOOKING
    # =====================================================

    def booking_prompt(
        self,
        question: str,
        context: str
    ) -> str:

        instructions = """
Answer ONLY using HelpGhar booking information.

Never invent booking rules.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )


    # =====================================================
    # POLICY
    # =====================================================

    def policy_prompt(
        self,
        question: str,
        context: str
    ) -> str:

        instructions = """
Answer ONLY using HelpGhar policy information.

Never invent policies.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )

    # =====================================================
    # GENERAL
    # =====================================================

    def general_prompt(
        self,
        question: str,
        context: str
    ) -> str:

        instructions = """
Answer ONLY using the HelpGhar knowledge base.

If the answer is unavailable,
politely tell the user.

Do not invent information.

Keep the response concise.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    def authentication_prompt(
        self,
        question: str,
        context: str
    ) -> str:

        instructions = """
Answer ONLY using authentication information.

Explain registration,
login,
password reset,
and account creation.

Never invent features.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )


    # =====================================================
    # GREETING
    # =====================================================

    def greeting_prompt(self) -> str:

        return (
            "Hello! 👋 Welcome to HelpGhar.\n\n"
            "I'm your AI assistant.\n\n"
            "I can help you:\n\n"
            "• Find workers\n"
            "• Compare services\n"
            "• Explain booking\n"
            "• Explain policies\n"
            "• Answer HelpGhar questions\n\n"
            "How can I help you today?"
        )


    # =====================================================
    # UNIVERSAL RAG PROMPT
    # =====================================================

    def build_rag_prompt(
        self,
        question: str,
        context: str,
        topic: str = "HelpGhar"
    ) -> str:

        instructions = f"""
Answer ONLY using the provided {topic} context.

If the answer does not exist,

say you couldn't find the information.

Never hallucinate.

Never invent workers.

Never invent policies.

Keep answers concise.

Use bullet points whenever appropriate.
"""

        return self.build_prompt(

            question,

            context,

            instructions

        )


prompt_service = PromptService()