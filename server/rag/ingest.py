import time
import uuid

from qdrant_client.models import (
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
)

from rag.chunker import split_text
from rag.document_loader import load_documents
from rag.embeddings import embedding_model
from rag.vector_store import create_collection

from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

BATCH_SIZE = 25
MAX_RETRIES = 3

# Chunks shorter than this are near-empty fragments (stray headings,
# leftover whitespace after splitting) -- not worth embedding or storing.
MIN_CHUNK_LENGTH = 20


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

            # E5 multilingual models expect a "passage: " prefix on
            # indexed documents (and "query: " on search queries, see
            # rag/retriever.py) - this asymmetric prefixing is part of
            # how the model was trained and meaningfully affects
            # retrieval quality if skipped.
            vector = embedding_model.encode(f"passage: {chunk}").tolist()

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
