"""
Intent Classifier
-----------------

Determines what type of request the user is making.

This module should NEVER call Gemini.

It only classifies the question.

Author:
HelpGhar AI Backend
"""

import re
from enum import Enum


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

    "worker",

    "electrician",

    "plumber",

    "cleaner",

    "maid",

    "tutor",

    "carpenter",

    "mechanic",

    "technician",

    "service",

    "hire",

    "find",

    "near",

    "nearby",

    "recommend",

    "best"

}

BOOKING_KEYWORDS = {

    "book",

    "booking",

    "cancel",

    "reschedule",

    "schedule",

    "appointment",

    "availability",

    "slot"

}

POLICY_KEYWORDS = {

    "policy",

    "refund",

    "verification",

    "verified",

    "cnic",

    "certificate",

    "privacy",

    "terms",

    "condition"

}

PAYMENT_KEYWORDS = {

    "payment",

    "pay",

    "wallet",

    "receipt",

    "invoice",

    "transaction",

    "commission"

}

REVIEW_KEYWORDS = {

    "review",

    "rating",

    "feedback",

    "stars"

}

PROFILE_KEYWORDS = {

    "profile",

    "account",

    "dashboard",

    "edit profile"

}

AUTH_KEYWORDS = {

    "login",

    "register",

    "signup",

    "sign up",

    "forgot password",

    "reset password"

}

GREETING_KEYWORDS = {

    "hi",

    "hello",

    "hey",

    "good morning",

    "good evening"

}


# ---------------------------------

def normalize(text: str) -> str:
    """
    Lowercase + remove punctuation.
    """

    text = text.lower()

    text = re.sub(

        r"[^a-z0-9\s]",

        " ",

        text

    )

    return text


# ---------------------------------

def contains_keyword(text: str, keywords: set) -> bool:

    for word in keywords:

        if word in text:

            return True

    return False


# ---------------------------------

def classify(question: str) -> Intent:
    """
    Main classifier.
    """

    question = normalize(question)

    if contains_keyword(question, GREETING_KEYWORDS):

        return Intent.GREETING

    if contains_keyword(question, AUTH_KEYWORDS):

        return Intent.AUTH

    if contains_keyword(question, PROFILE_KEYWORDS):

        return Intent.PROFILE

    if contains_keyword(question, PAYMENT_KEYWORDS):

        return Intent.PAYMENT

    if contains_keyword(question, REVIEW_KEYWORDS):

        return Intent.REVIEW

    if contains_keyword(question, BOOKING_KEYWORDS):

        return Intent.BOOKING

    if contains_keyword(question, POLICY_KEYWORDS):

        return Intent.POLICY

    if contains_keyword(question, WORKER_KEYWORDS):

        return Intent.WORKER_SEARCH

    if len(question.strip()) == 0:

        return Intent.UNKNOWN

    return Intent.GENERAL