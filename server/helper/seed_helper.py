from config.db import payment_card_collection

DEFAULT_CARD = {
    "cardId": "CARD-DEFAULT",
    "cardHolder": "Help Ghar",
    "cardNumber": "1111 2222 3333 4444",
    "expiry": "12/32",
    "cvv": "123",
}

def seed_default_card():
    existing = payment_card_collection.find_one({"cardId": "CARD-DEFAULT"})
    if not existing:
        payment_card_collection.insert_one(DEFAULT_CARD)
        print("Default payment card seeded")