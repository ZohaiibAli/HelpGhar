from rag.vector_store import *

create_collection()

# insert_test_vector()

results = search_test()

for point in results.points:
    print(point.payload)
    print(point.score)
    print("-" * 40)