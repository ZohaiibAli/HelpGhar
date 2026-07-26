import time
import uuid

from qdrant_client.models import (
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
)

from ai.llm import GeminiQuotaExceededError

from rag.chunker import split_text
from rag.document_loader import load_documents
from rag.embeddings import generate_embedding
from rag.vector_store import create_collection

from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

BATCH_SIZE = 25
MAX_RETRIES = 3

# Chunks shorter than this are near-empty fragments (stray headings,
# leftover whitespace after splitting) -- not worth embedding or storing.
MIN_CHUNK_LENGTH = 20


def embed_with_retry(chunk, attempt=1):
    """
    Wraps generate_embedding() with the same retry/backoff shape as
    upsert_with_retry() below, since document ingestion can make many
    embedding calls back-to-back and Gemini's free tier can return a
    transient 429 (GeminiQuotaExceededError) under bursty load.
    """

    try:
        return generate_embedding(chunk, task_type="RETRIEVAL_DOCUMENT")
    except GeminiQuotaExceededError as e:
        if attempt >= MAX_RETRIES:
            raise
        print(f"  Embedding rate-limited ({e}), retrying ({attempt}/{MAX_RETRIES})...")
        time.sleep(2 * attempt)
        return embed_with_retry(chunk, attempt=attempt + 1)


def upsert_with_retry(points, attempt=1):
    try:
        client.upsert(
            collection_name=QDRANT_COLLECTION,
            wait=True,
            points=points,
        )
    except Exception as e:
        if attempt >= MAX_RETRIES:
            raise
        print(f"  Upload failed ({e}), retrying ({attempt}/{MAX_RETRIES})...")
        time.sleep(2 * attempt)
        upsert_with_retry(points, attempt=attempt + 1)


def _clear_existing_chunks(filename: str):
    """
    Deletes every previously-ingested chunk for this file before
    re-inserting fresh ones.

    Without this, re-running ingest() after editing a document (or
    running it more than once at all) just piles up new points with new
    random UUIDs alongside the old ones -- the old, possibly outdated
    chunks never leave the index, so retrieval can keep surfacing a
    stale refund policy, a removed service, etc. next to the current
    version, and there is no way to tell which is authoritative.
    """

    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="filename",
                    match=MatchValue(value=filename),
                )
            ]
        ),
    )


def ingest():

    # Idempotent - creates the collection and the filename payload
    # index only if they don't already exist. Ingestion no longer
    # depends on someone remembering to run this as a separate manual
    # step first.
    create_collection()

    docs = load_documents()

    if not docs:
        print("No documents found - nothing to ingest.")
        return

    total_points = 0

    for doc in docs:

        chunks = [
            chunk.strip()
            for chunk in split_text(doc["text"])
            if len(chunk.strip()) >= MIN_CHUNK_LENGTH
        ]

        if not chunks:
            print(f"  Skipping {doc['filename']} - no usable chunks.")
            continue

        _clear_existing_chunks(doc["filename"])

        points = []

        for index, chunk in enumerate(chunks):

            # RETRIEVAL_DOCUMENT tells Gemini this text is being
            # indexed, not searched-for -- must match the
            # RETRIEVAL_QUERY task_type used at query time (see
            # rag/retriever.py).
            vector = embed_with_retry(chunk)

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk,
                        "filename": doc["filename"],
                        "category": doc["category"],
                        "chunkIndex": index,
                    }
                )
            )

        # Upload in small batches instead of one giant request - avoids
        # the write timeout you hit uploading everything in a single call.
        for i in range(0, len(points), BATCH_SIZE):

            batch = points[i:i + BATCH_SIZE]

            upsert_with_retry(batch)

            print(
                f"  {doc['filename']}: uploaded "
                f"{min(i + BATCH_SIZE, len(points))}/{len(points)} chunks"
            )

        total_points += len(points)

    print(f"{total_points} chunks uploaded from {len(docs)} documents.")
