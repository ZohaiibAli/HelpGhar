"""
Intent Classifier
-----------------

Determines what type of request the user is making.

This module should NEVER call Gemini.

It only classifies the question.
"""

import re
from enum import Enum

from ai.filter_extractor import extract_category


class Intent(str, Enum):

    WORKER_SEARCH = "worker_search"
    BOOKING = "booking"
    POLICY = "policy"
    REVIEW = "review"
    PAYMENT = "payment"
    PROFILE = "profile"
    AUTH = "auth"
    GREETING = "greeting"
    GENERAL = "general"
    UNKNOWN = "unknown"


# -------------------------------
# Keywords
# -------------------------------

WORKER_KEYWORDS = {
    "worker", "workers", "hire", "find a", "recommend", "best",
}

BOOKING_KEYWORDS = {
    "book", "booking", "cancel", "reschedule", "schedule",
    "appointment", "availability", "slot",
}

POLICY_KEYWORDS = {
    "policy", "refund", "verification", "cnic", "certificate",
    "privacy", "terms", "condition",
}

PAYMENT_KEYWORDS = {
    "payment", "pay", "wallet", "receipt", "invoice", "transaction",
    "commission",
}

REVIEW_KEYWORDS = {
    "review", "rating", "feedback", "stars",
}

PROFILE_KEYWORDS = {
    "profile", "account", "dashboard", "edit profile",
}

AUTH_KEYWORDS = {
    "login", "register", "signup", "sign up", "forgot password",
    "reset password",
}

GREETING_KEYWORDS = {
    "hi", "hello", "hey", "good morning", "good evening",
}


def normalize(text: str) -> str:
    """
    Lowercase + remove punctuation.
    """

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return text


def contains_keyword(text: str, keywords: set) -> bool:

    for word in keywords:
        if word in text:
            return True
    return False


def classify(question: str) -> Intent:
    """
    Main classifier.

    IMPORTANT: a recognisable service category (Electricians, Home
    Teachers, Cooks, etc.) is checked FIRST, right after greetings.
    Previously, generic keyword overlap (e.g. "verified" belonging to
    POLICY_KEYWORDS) could hijack an obvious worker-search question
    like "find a verified electrician near me" into the wrong intent.
    Naming a real category is the strongest signal there is that the
    person wants to find a worker - even a bare "home teachers" with
    no verb at all should route here.
    """

    normalized = normalize(question)

    if len(normalized.strip()) == 0:
        return Intent.UNKNOWN

    if contains_keyword(normalized, GREETING_KEYWORDS):
        return Intent.GREETING

    if extract_category(normalized) is not None:
        return Intent.WORKER_SEARCH

    if contains_keyword(normalized, AUTH_KEYWORDS):
        return Intent.AUTH

    if contains_keyword(normalized, PROFILE_KEYWORDS):
        return Intent.PROFILE

    if contains_keyword(normalized, PAYMENT_KEYWORDS):
        return Intent.PAYMENT

    if contains_keyword(normalized, REVIEW_KEYWORDS):
        return Intent.REVIEW

    if contains_keyword(normalized, BOOKING_KEYWORDS):
        return Intent.BOOKING

    if contains_keyword(normalized, POLICY_KEYWORDS):
        return Intent.POLICY

    if contains_keyword(normalized, WORKER_KEYWORDS):
        return Intent.WORKER_SEARCH

    return Intent.GENERAL