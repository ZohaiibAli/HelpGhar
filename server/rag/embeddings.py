"""
HelpGhar RAG - Embeddings

Uses Gemini's embedding API (google-genai, same client pattern already
used in ai/llm.py) instead of a locally-loaded sentence-transformers
model. No ML model is ever loaded into process memory here -- each
call is a lightweight HTTPS request to Gemini.

gemini-embedding-001 natively outputs 3072-dim vectors. We truncate to
768 dims via output_dimensionality (Matryoshka Representation
Learning) to keep vectors small -- 768 is one of Google's officially
validated MRL breakpoints (3072/1536/768), unlike arbitrary smaller
sizes. QDRANT_VECTOR_SIZE must match this (see config/qdrant.py).

Gemini has no "query: "/"passage: " prefix convention -- instead you
tell it what the text is for via task_type: "RETRIEVAL_DOCUMENT" when
indexing (rag/ingest.py), "RETRIEVAL_QUERY" when searching
(rag/retriever.py).
"""

import os
import logging

from google import genai
from google.genai import types
from google.genai.errors import APIError

from ai.llm import GeminiQuotaExceededError

logger = logging.getLogger(__name__)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Check your .env file and make sure "
        "load_dotenv() runs before this module is imported."
    )

client = genai.Client(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768


def generate_embedding(text: str, task_type: str) -> list:
    """
    Returns a 768-dim embedding vector for `text`.

    task_type must be "RETRIEVAL_DOCUMENT" (indexing) or
    "RETRIEVAL_QUERY" (search).
    """

    try:

        response = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIMENSION,
            ),
        )

        return response.embeddings[0].values

    except APIError as e:

        code = getattr(e, "code", None)

        logger.exception(f"Gemini embedding API error (code={code}): {e}")

        if code == 429:
            raise GeminiQuotaExceededError(str(e)) from e

        raise

    except Exception as e:

        logger.exception(f"Gemini embedding generation failed: {e}")
        raise
