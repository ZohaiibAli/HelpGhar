from pydantic import BaseModel
from typing import List
from datetime import datetime


class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime


class Conversation(BaseModel):
    sessionId: str
    messages: List[Message]