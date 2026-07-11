# test_multilingual_retrieval.py
from rag.retriever import retrieve

queries = [
    "what is helpghar",
    "helpghar kya hai",
    "cancellation policy",
    "cancellation ki policy kya hai",
    "deep cleaning",
    "gehri safai kya hoti hai",
]

for q in queries:
    print(f"\n=== {q} ===")
    for doc in retrieve(q, limit=3):
        print(f"- [{doc.get('filename')}] {doc.get('text')[:100]}...")