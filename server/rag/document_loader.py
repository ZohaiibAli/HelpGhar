import os
from pathlib import Path

# Anchored to this file's location (server/rag/../documents) instead of a
# bare relative Path("documents") -- the old version silently returned zero
# documents (and therefore an empty RAG index) whenever the process's
# working directory wasn't exactly server/, e.g. run via a process manager,
# a different launch script, or `python rag/ingest.py` from elsewhere.
# Override with RAG_DOCUMENTS_DIR if documents live somewhere else.
DOCUMENT_FOLDER = Path(
    os.getenv("RAG_DOCUMENTS_DIR")
    or Path(__file__).resolve().parent.parent / "documents"
)


def load_documents():

    if not DOCUMENT_FOLDER.is_dir():
        raise FileNotFoundError(
            f"RAG documents folder not found: {DOCUMENT_FOLDER}. "
            "Set RAG_DOCUMENTS_DIR or run ingestion from the server/ directory."
        )

    docs = []

    for file in sorted(DOCUMENT_FOLDER.rglob("*.txt")):

        text = file.read_text(encoding="utf-8").strip()

        if not text:
            continue

        docs.append(
            {
                "filename": file.name,
                "category": file.parent.name,
                "text": text,
            }
        )

    return docs
