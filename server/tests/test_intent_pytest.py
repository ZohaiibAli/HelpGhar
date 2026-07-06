from ai.intent import classify, Intent


def test_worker():
    assert classify("Find an electrician") == Intent.WORKER_SEARCH


def test_booking():
    assert classify("Cancel my booking") == Intent.BOOKING


def test_policy():
    assert classify("Refund policy") == Intent.POLICY


def test_review():
    assert classify("Worker reviews") == Intent.REVIEW


def test_payment():
    assert classify("Payment failed") == Intent.PAYMENT


def test_auth():
    assert classify("Reset password") == Intent.AUTH


def test_greeting():
    assert classify("Hello") == Intent.GREETING