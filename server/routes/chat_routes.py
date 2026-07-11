from fastapi import APIRouter, HTTPException

from model.chat_model import ChatRequest

from services.chat_service import chat_service

from services.conversation_service import conversation_service

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


@router.get("/history/{session_id}")
def get_history(session_id: str):
    """
    Returns the stored conversation for a session, formatted for the
    frontend. Used on page load / refresh / navigation so the chat
    widget can restore where the user left off instead of starting
    blank every time.

    Note: worker cards attached to a specific past bot reply are not
    re-derived here (only role/content/timestamp are persisted per
    message) - only the text of each turn is restored.
    """

    try:

        messages = conversation_service.get_messages(session_id)

        formatted = []

        for index, message in enumerate(messages):

            metadata = message.get("metadata") or {}

            entry = {
                "id": f"{session_id}-{index}",
                "role": "user" if message.get("role") == "user" else "bot",
                "text": message.get("content", ""),
                "timestamp": message.get("timestamp").timestamp() * 1000
                if message.get("timestamp") else None,
            }

            if metadata.get("workers"):
                entry["workers"] = metadata["workers"]

            formatted.append(entry)

        return {"sessionId": session_id, "messages": formatted}

    except Exception as e:

        logging.exception(e)

        raise HTTPException(

            status_code=500,

            detail="Could not load conversation history"

        )


@router.delete("/history/{session_id}")
def delete_history(session_id: str):
    """
    Deletes a stored conversation entirely - used when the frontend's
    "New chat" / delete-session action is triggered.
    """

    try:

        deleted = conversation_service.clear_conversation(session_id)

        return {"sessionId": session_id, "deleted": deleted}

    except Exception as e:

        logging.exception(e)

        raise HTTPException(

            status_code=500,

            detail="Could not delete conversation"

        )