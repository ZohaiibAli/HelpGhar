from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

# Kept in sync with the composer's maxLength on the client. Long enough
# for a real message, short enough that a single document can't be used
# to push megabytes into the thread.
MAX_MESSAGE_LENGTH = 4000


class ThreadStart(BaseModel):
    """
    Opening (or re-opening) a thread with the other party. The caller
    only names the counterparty -- their own identity comes from the
    JWT, never from the body.
    """

    # Exactly one of these is supplied, depending on who is calling:
    # a customer names a worker, a worker names a customer.
    workerId: Optional[str] = None
    customerId: Optional[str] = None

    # Optional context: "I'm messaging you about booking BKG-0012".
    bookingId: Optional[str] = None

    # Optional first message, so "Message worker" can open the thread and
    # send in a single round trip.
    text: Optional[str] = Field(default=None, max_length=MAX_MESSAGE_LENGTH)


class MessageSend(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)

    # Client-generated UUID. Lets the UI render the message optimistically
    # and lets a retry after a dropped response be recognised as the same
    # message instead of posting it twice.
    clientId: Optional[str] = Field(default=None, max_length=64)

    bookingId: Optional[str] = None

    @field_validator("text")
    @classmethod
    def not_blank(cls, value: str) -> str:
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Message cannot be empty")

        return cleaned


class MessagesRead(BaseModel):
    # Optional explicit list; when omitted every unread message from the
    # other party in the thread is marked read.
    messageIds: Optional[List[str]] = None
