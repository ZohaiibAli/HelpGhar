from qdrant_client.models import Distance
from qdrant_client.models import PayloadSchemaType
from qdrant_client.models import VectorParams
from qdrant_client.models import PointStruct
import uuid

from rag.embeddings import embedding_model

from config.qdrant import (
    client,
    QDRANT_COLLECTION,
    QDRANT_VECTOR_SIZE,
)


def _ensure_filename_index():
    """
    rag/ingest.py filters/deletes points by payload.filename to keep
    re-ingestion idempotent -- Qdrant requires a keyword index on a
    field before it can be used in a filter, so this must exist before
    ingest() runs. Safe to call repeatedly: Qdrant no-ops if the index
    is already there.
    """

    try:
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="filename",
            field_schema=PayloadSchemaType.KEYWORD,
        )
    except Exception as e:
        print(f"  (filename index already present or failed: {e})")


def create_collection():

    collections = client.get_collections().collections

    existing = [c.name for c in collections]

    if QDRANT_COLLECTION in existing:
        print("Collection already exists.")
        _ensure_filename_index()
        return

    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(
            size=QDRANT_VECTOR_SIZE,
            distance=Distance.COSINE,
        ),
    )

    _ensure_filename_index()

    print("Collection created successfully.")


def insert_test_vector():
    """
    Debug helper only - not used by the real ingestion pipeline.
    Kept here in case you want to sanity-check the collection manually.
    """

    text = "HelpGhar provides verified electricians."

    vector = embedding_model.encode(f"passage: {text}").tolist()

    client.upsert(
        collection_name=QDRANT_COLLECTION,
        wait=True,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": text,
                    "filename": "_debug_test_point.txt",
                    "category": "service"
                },
            )
        ],
    )

    print("Vector inserted.")


def search_test():

    query = "electrician"

    vector = embedding_model.encode(f"query: {query}").tolist()

    result = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=5,
    )

    return result