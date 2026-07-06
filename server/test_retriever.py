from rag.retriever import retrieve

results = retrieve("How can I cancel a booking?")

for r in results:
    print(r)
    print("-" * 50)