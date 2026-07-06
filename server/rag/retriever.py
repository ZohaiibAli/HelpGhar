from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

from rag.embeddings import embedding_model


def retrieve(query, limit=5):

    vector = embedding_model.encode(query).tolist()

    response = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=limit,
    )

    return [
        hit.payload
        for hit in response.points
    ]