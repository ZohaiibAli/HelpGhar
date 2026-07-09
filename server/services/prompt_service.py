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
Answer ONLY using the workers provided in the context below.

Never invent workers that are not listed.

The workers listed below are the actual, currently available matches
for this search - do not say you couldn't find any worker if the
context lists one or more workers.

For each worker mention:

- Name
- Category
- City
- Experience
- Price
- Rating
- Whether they are CNIC-verified (state this factually either way,
  don't hide unverified workers)

Keep your answer concise.

Recommend the highest ranked workers first.
"""

        return self.build_prompt(question, context, instructions)

    # =====================================================
    # BOOKING
    # =====================================================

    def booking_prompt(self, question: str, context: str) -> str:

        instructions = """
Answer ONLY using HelpGhar booking information.

Never invent booking rules.
"""
        return self.build_prompt(question, context, instructions)

    # =====================================================
    # POLICY
    # =====================================================

    def policy_prompt(self, question: str, context: str) -> str:

        instructions = """
Answer ONLY using HelpGhar policy information.

Never invent policies.

If multiple policy documents are relevant, summarise all of them, not
just the first one found.
"""
        return self.build_prompt(question, context, instructions)

    # =====================================================
    # GENERAL
    # =====================================================

    def general_prompt(self, question: str, context: str) -> str:

        instructions = """
Answer ONLY using the HelpGhar knowledge base.

If the answer is unavailable,
politely tell the user.

Do not invent information.

Keep the response concise.
"""
        return self.build_prompt(question, context, instructions)

    # =====================================================
    # AUTHENTICATION
    # =====================================================

    def authentication_prompt(self, question: str, context: str) -> str:

        instructions = """
Answer ONLY using authentication information.

Explain registration,
login,
password reset,
and account creation.

Never invent features.
"""
        return self.build_prompt(question, context, instructions)

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
        instruction: str = None
    ) -> str:

        if instruction is None:

            instruction = """
Answer ONLY using the provided context.

If multiple relevant pieces of context are given, synthesise all of
them into one coherent answer instead of only using the first one.

If the answer is not available,
say you couldn't find the information.

Never hallucinate.

Keep answers concise.
"""

        return self.build_prompt(
            question=question,
            context=context,
            instructions=instruction
        )


prompt_service = PromptService()