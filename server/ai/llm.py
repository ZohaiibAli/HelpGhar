"""
HelpGhar AI - Gemini LLM Wrapper

Uses the current `google-genai` SDK (the officially supported successor
to the deprecated `google-generativeai` package). Install with:

    pip install google-genai
"""

import os
import logging

from google import genai
from google.genai.errors import APIError

from config.gemini import MODEL_NAME

logger = logging.getLogger(__name__)


class GeminiQuotaExceededError(Exception):
    """Raised when Gemini returns 429 RESOURCE_EXHAUSTED."""
    pass


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Check your .env file and make sure "
        "load_dotenv() runs before this module is imported."
    )

client = genai.Client(api_key=GEMINI_API_KEY)


def generate(prompt: str) -> str:
    """
    Calls Gemini and returns plain text.
    """

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        if not getattr(response, "text", None):
            logger.warning(f"Gemini returned no text. Raw response: {response}")
            raise ValueError("Gemini returned an empty response.")

        return response.text

    except APIError as e:

        code = getattr(e, "code", None)

        logger.exception(f"Gemini API error (code={code}): {e}")

        if code == 429:
            raise GeminiQuotaExceededError(str(e)) from e

        raise

    except Exception as e:

        logger.exception(f"Gemini generation failed: {e}")
        raise