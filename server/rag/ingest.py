import time
import uuid

from qdrant_client.models import PointStruct

from rag.chunker import split_text
from rag.document_loader import load_documents
from rag.embeddings import embedding_model

from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

BATCH_SIZE = 25
MAX_RETRIES = 3


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


def ingest():

    docs = load_documents()

    points = []

    for doc in docs:

        chunks = split_text(doc["text"])

        for chunk in chunks:

            vector = embedding_model.encode(chunk).tolist()

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk,
                        "filename": doc["filename"],
                        "category": doc["category"]
                    }
                )
            )

    print(f"Prepared {len(points)} chunks from {len(docs)} documents.")

    # Upload in small batches instead of one giant request - avoids the
    # write timeout you hit uploading everything in a single call.
    for i in range(0, len(points), BATCH_SIZE):

        batch = points[i:i + BATCH_SIZE]

        upsert_with_retry(batch)

        print(f"  Uploaded {min(i + BATCH_SIZE, len(points))}/{len(points)} chunks")

    print(f"{len(points)} chunks uploaded.")