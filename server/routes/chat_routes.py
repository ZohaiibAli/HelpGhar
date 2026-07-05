from fastapi import APIRouter

from pydantic import BaseModel

from services.chat_service import ask

router = APIRouter()


class ChatRequest(BaseModel):

    question: str


@router.post("/chat")

def chat(request: ChatRequest):

    answer = ask(

        request.question

    )

    return {

        "answer": answer

    }