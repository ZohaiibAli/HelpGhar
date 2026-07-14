import re


def clean_text(text: str) -> str:
    """
    Clean review text before sentiment analysis.
    """

    if not text:
        return ""

    text = text.lower()

    text = re.sub(r"http\S+", "", text)

    text = re.sub(r"[^a-zA-Z0-9\s]", "", text)

    text = re.sub(r"\s+", " ", text)

    return text.strip()