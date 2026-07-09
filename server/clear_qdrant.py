"""
One-off script - run once before re-ingesting to clear stale/test data.

Run with:  python clear_qdrant.py
"""

from config.qdrant import client, QDRANT_COLLECTION

client.delete_collection(collection_name=QDRANT_COLLECTION)

print(f"Deleted collection: {QDRANT_COLLECTION}")
print("Now run:")
print("  python -c \"from rag.vector_store import create_collection; create_collection()\"")
print("  python -c \"from rag.ingest import ingest; ingest()\"")