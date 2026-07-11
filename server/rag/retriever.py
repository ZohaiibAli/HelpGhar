from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

from rag.embeddings import embedding_model


def retrieve(query, limit=5):

    # E5 multilingual models expect a "query: " prefix on search
    # queries (documents were indexed with "passage: ", see
    # rag/ingest.py). Must match what was used at ingestion time or
    # similarity scores become unreliable.
    vector = embedding_model.encode(f"query: {query}").tolist()

    response = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=limit,
    )

    return [
        hit.payload
        for hit in response.points
    ]