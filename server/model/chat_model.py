from pydantic import BaseModel


class ChatRequest(BaseModel):

    sessionId: str

    message: str