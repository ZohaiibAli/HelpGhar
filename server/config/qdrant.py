import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "helpghar_docs")
QDRANT_VECTOR_SIZE = int(os.getenv("QDRANT_VECTOR_SIZE", 384))

if not QDRANT_URL:
    # Fail fast and clearly at import time instead of letting every RAG
    # request crash later with an opaque connection error once someone
    # actually asks the chatbot a question.
    raise RuntimeError(
        "QDRANT_URL is not set. Add it to server/.env before starting "
        "the app -- the RAG knowledge base cannot connect without it."
    )

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60,  # was using the default (~5s), which times out on
                 # larger batch uploads over a slow/high-latency
                 # connection to a remote Qdrant Cloud cluster.
)