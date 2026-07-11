from sentence_transformers import SentenceTransformer

# Switched from BAAI/bge-small-en-v1.5 (English-only) to a multilingual
# E5 model so retrieval works properly for Urdu / Roman Urdu queries,
# not just English ones. Same 384-dim output, so QDRANT_VECTOR_SIZE in
# your .env does NOT need to change.
#
# IMPORTANT: E5 models expect an instruction prefix on the text before
# encoding - "query: " for search queries, "passage: " for the
# documents being indexed. This is why rag/ingest.py and
# rag/retriever.py each prepend the appropriate prefix before calling
# embedding_model.encode(). Don't call .encode() elsewhere without a
# prefix or retrieval quality will silently degrade.

embedding_model = SentenceTransformer(
    "intfloat/multilingual-e5-small"
)

EMBEDDING_DIMENSION = 384