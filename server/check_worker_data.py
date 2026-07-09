"""
One-off diagnostic script.

Run with:  python check_worker_data.py

Prints the distinct values actually stored in your `gigs` collection for
the fields the chatbot filters on. Compare these against
CATEGORY_SYNONYMS in ai/filter_extractor.py and the "status": "Active"
literal in worker_service.build_query() - any mismatch there is why
worker search returns 0 results.
"""

from config.db import gig_collection

print("\n--- Distinct 'category' values in gigs collection ---")
for value in gig_collection.distinct("category"):
    print(repr(value))

print("\n--- Distinct 'status' values in gigs collection ---")
for value in gig_collection.distinct("status"):
    print(repr(value))

print("\n--- Distinct 'city' values in gigs collection ---")
for value in gig_collection.distinct("city"):
    print(repr(value))

print("\n--- Total documents in gigs collection ---")
print(gig_collection.count_documents({}))

print("\n--- Sample document (first match) ---")
sample = gig_collection.find_one({})
print(sample)