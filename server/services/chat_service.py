from ai.prompt import SYSTEM_PROMPT

from ai.llm import generate

from rag.retriever import retrieve


def ask(question):

    docs = retrieve(question)

    context = "\n\n".join(

        d["text"]

        for d in docs

    )

    prompt = f"""

{SYSTEM_PROMPT}

Context:

{context}

User Question:

{question}

Answer:

"""

    return generate(prompt)