from pathlib import Path

DOCUMENT_FOLDER = Path("documents")


def load_documents():

    docs = []

    for file in DOCUMENT_FOLDER.rglob("*.txt"):

        with open(file, "r", encoding="utf-8") as f:

            docs.append(
                {
                    "filename": file.name,
                    "category": file.parent.name,
                    "text": f.read(),
                }
            )

    return docs