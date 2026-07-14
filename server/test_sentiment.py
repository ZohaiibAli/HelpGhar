from ml.sentiment.analyzer import analyze_sentiment


reviews = [

    ("Amazing worker. Very professional and punctual.", 5),

    ("Good work.", 5),

    ("Okay service.", 3),

    ("Worker came late.", 2),

    ("Worst experience ever. Very rude.", 1),

    ("Excellent and trustworthy.", 5),

    ("Bad service.", 1),

    ("Professional but slightly late.", 4)

]


for review, rating in reviews:

    print("-" * 60)

    print(review)

    print(analyze_sentiment(review, rating))