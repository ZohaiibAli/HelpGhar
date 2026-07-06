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

def insert_test_vector():

    text = "HelpGhar provides verified electricians."

    vector = embedding_model.encode(text).tolist()

    client.upsert(
        collection_name=QDRANT_COLLECTION,
        wait=True,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "text": text,
                    "category": "service"
                },
            )
        ],
    )


    print("Vector inserted.")

    print("Collection created successfully.")

def search_test():

    query = "electrician"

    vector = embedding_model.encode(query).tolist()

    result = client.query_points(
    collection_name=QDRANT_COLLECTION,
    query=vector,
    limit=5,
)

    return result

