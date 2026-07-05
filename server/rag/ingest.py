import uuid

from qdrant_client.models import PointStruct

from rag.chunker import split_text
from rag.document_loader import load_documents
from rag.embeddings import embedding_model

from config.qdrant import client
from config.qdrant import (
    QDRANT_COLLECTION,
)

def ingest():

    docs = load_documents()

    points = []

    for doc in docs:

        chunks = split_text(doc["text"])

        for chunk in chunks:

            vector = embedding_model.encode(chunk).tolist()

            points.append(

                PointStruct(

                    id=str(uuid.uuid4()),

                    vector=vector,

                    payload={

                        "text": chunk,

                        "filename": doc["filename"],

                        "category": doc["category"]

                    }

                )

            )

    client.upsert(

        collection_name=QDRANT_COLLECTION,

        wait=True,

        points=points,

    )

    print(f"{len(points)} chunks uploaded.")