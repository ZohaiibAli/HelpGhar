import os

from config.qdrant import client
from config.qdrant import QDRANT_COLLECTION

from rag.embeddings import embedding_model

# Below this cosine similarity, a chunk is treated as "not actually
# relevant" instead of being force-fed to Gemini as context. Previously
# there was no threshold at all -- Qdrant's top-N was always returned,
# so the "I couldn't find that in the knowledge base" fallback in
# chat_service.generate_rag_response was effectively dead code (it only
# fired when the collection was completely empty).
#
# Calibrated against the live helpghar_docs collection: on-topic
# queries (English and Roman Urdu) scored 0.79-0.91, off-topic queries
# (weather, jokes, sports, code, gibberish) scored 0.70-0.82. There is
# real overlap in that band -- multilingual-e5-small compresses cosine
# scores into a narrow high range, so this is a conservative floor that
# catches clearly-irrelevant matches, not a precise classifier. The
# "answer ONLY from context, say so if unavailable" prompt instruction
# (see services/prompt_service.py) is the real backstop against
# hallucination on borderline retrievals.
DEFAULT_SCORE_THRESHOLD = float(
    os.getenv("RAG_SCORE_THRESHOLD", 0.75)
)


def retrieve(query, limit=5, score_threshold=DEFAULT_SCORE_THRESHOLD):

    # E5 multilingual models expect a "query: " prefix on search
    # queries (documents were indexed with "passage: ", see
    # rag/ingest.py). Must match what was used at ingestion time or
    # similarity scores become unreliable.
    vector = embedding_model.encode(f"query: {query}").tolist()

    response = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=vector,
        limit=limit,
        score_threshold=score_threshold,
    )

    return [
        {**hit.payload, "score": hit.score}
        for hit in response.points
    ]
