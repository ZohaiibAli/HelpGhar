from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

from ml.sentiment.labels import (
    POSITIVE_WORDS,
    NEGATIVE_WORDS,
)

from ml.sentiment.preprocess import clean_text


# Download only once
try:
    nltk.data.find("sentiment/vader_lexicon.zip")
except LookupError:
    nltk.download("vader_lexicon")


sia = SentimentIntensityAnalyzer()


def analyze_sentiment(comment: str, rating: int):
    """
    Analyze customer review using

    1. VADER

    2. Custom HelpGhar keywords

    3. Rating

    Returns:

    {
        sentiment,
        score
    }
    """

    comment = clean_text(comment)

    vader = sia.polarity_scores(comment)

    text_score = vader["compound"]

    words = comment.split()

    custom_score = 0

    for word in words:

        if word in POSITIVE_WORDS:

            custom_score += 0.10

        elif word in NEGATIVE_WORDS:

            custom_score -= 0.10

    custom_score = max(-1, min(1, custom_score))

    rating_score = ((rating - 3) / 2)

    final_score = (

        text_score * 0.60 +

        custom_score * 0.20 +

        rating_score * 0.20

    )

    final_score = round(final_score, 3)

    if final_score >= 0.25:

        sentiment = "positive"

    elif final_score <= -0.25:

        sentiment = "negative"

    else:

        sentiment = "neutral"

    return {

        "sentiment": sentiment,

        "score": final_score

    }