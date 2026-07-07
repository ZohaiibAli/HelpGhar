from fastapi import APIRouter, HTTPException

from model.chat_model import ChatRequest

from services.chat_service import chat_service

import logging


router = APIRouter(

    prefix="/api/chat",

    tags=["AI Chatbot"]

)


@router.post("/")
def chat(request: ChatRequest):

    try:

        response = chat_service.chat(

            session_id=request.sessionId,

            question=request.message

        )

        return response

    except Exception as e:

        logging.exception(e)

        raise HTTPException(

            status_code=500,

            detail="AI Chat Service Error"

        )