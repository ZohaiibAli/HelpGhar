from qdrant_client.models import Distance
from qdrant_client.models import VectorParams
from qdrant_client.models import PointStruct
import uuid

from rag.embeddings import embedding_model

from config.qdrant import (
    client,
    QDRANT_COLLECTION,
    QDRANT_VECTOR_SIZE,
)


def create_collection():

    collections = client.get_collections().collections

    existing = [c.name for c in collections]

    if QDRANT_COLLECTION in existing:
        print("Collection already exists.")
        return

    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(
            size=QDRANT_VECTOR_SIZE,
            distance=Distance.COSINE,
        ),
    )

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