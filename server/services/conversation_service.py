"""
=========================================================

HelpGhar AI

Conversation Service

Stores persistent chat history in MongoDB.

=========================================================
"""

from datetime import datetime
from typing import List, Dict

from config.db import conversation_collection


class ConversationService:

    def __init__(self):
        pass


    # =====================================================
    # SAVE MESSAGE
    # =====================================================

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        message_type: str = "text",
        metadata: Dict = None
    ):

        conversation_collection.update_one(

            {

                "sessionId": session_id

            },

            {

                "$push": {

                    "messages": {

                        "role": role,

                        "type": message_type,

                        "content": content,

                        "timestamp": datetime.utcnow(),

                        "metadata": metadata or {}

                    }

                }

            },

            upsert=True

        )

        # Trimming here (rather than leaving it to each caller in
        # chat_service.py) guarantees every session gets capped
        # regardless of which reply path was taken -- several paths
        # (greeting, auth, "no category found", "no matches found")
        # previously never called trim_messages at all, so a session
        # that only ever hit those could grow unbounded.
        self.trim_messages(session_id)


    # =====================================================
    # GET CONVERSATION
    # =====================================================

    def get_conversation(
        self,
        session_id: str
    ) -> Dict:

        conversation = conversation_collection.find_one(

            {

                "sessionId": session_id

            }

        )

        if conversation is None:

            return {

                "sessionId": session_id,

                "messages": []

            }

        conversation.pop("_id", None)

        return conversation


    # =====================================================
    # GET MESSAGES
    # =====================================================

    def get_messages(
        self,
        session_id: str
    ) -> List[Dict]:

        conversation = self.get_conversation(

            session_id

        )

        return conversation.get(

            "messages",

            []

        )


    # =====================================================
    # BUILD HISTORY
    # =====================================================

    def build_history(
        self,
        session_id: str,
        max_messages: int = 10
    ) -> str:
        """
        Convert previous conversation into
        a format suitable for Gemini.
        """

        messages = self.get_messages(session_id)

        if not messages:
            return ""

        messages = messages[-max_messages:]

        history = []

        for message in messages:

            role = message.get("role", "user")

            if role == "assistant":
                prefix = "Assistant"
            else:
                prefix = "User"

            history.append(
                f"{prefix}: {message.get('content', '')}"
            )

        return "\n".join(history)


    # =====================================================
    # CLEAR CONVERSATION
    # =====================================================

    def clear_conversation(
        self,
        session_id: str
    ) -> bool:
        """
        Delete a complete conversation.
        """

        result = conversation_collection.delete_one(
            {
                "sessionId": session_id
            }
        )

        return result.deleted_count > 0


    # =====================================================
    # TRIM CONVERSATION
    # =====================================================

    def trim_messages(
        self,
        session_id: str,
        keep_last: int = 20
    ):
        """
        Keep only the latest messages.
        """

        conversation = self.get_conversation(
            session_id
        )

        messages = conversation.get(
            "messages",
            []
        )

        if len(messages) <= keep_last:
            return

        messages = messages[-keep_last:]

        conversation_collection.update_one(

            {
                "sessionId": session_id
            },

            {
                "$set": {
                    "messages": messages
                }
            }

        )


    # =====================================================
    # LAST USER MESSAGE
    # =====================================================

    def get_last_user_message(
        self,
        session_id: str
    ):

        messages = self.get_messages(session_id)

        for message in reversed(messages):

            if message.get("role") == "user":

                return message

        return None

    # =====================================================
    # LAST ASSISTANT MESSAGE
    # =====================================================

    def get_last_assistant_message(
        self,
        session_id: str
    ):

        messages = self.get_messages(session_id)

        for message in reversed(messages):

            if message.get("role") == "assistant":

                return message

        return None


    # =====================================================
    # EXISTS
    # =====================================================

    def conversation_exists(
        self,
        session_id: str
    ) -> bool:

        conversation = conversation_collection.find_one(

            {
                "sessionId": session_id
            },

            {
                "_id": 1
            }

        )

        return conversation is not None


    # =====================================================
    # TOTAL MESSAGES
    # =====================================================

    def total_messages(
        self,
        session_id: str
    ) -> int:

        return len(

            self.get_messages(
                session_id
            )

        )


    # =====================================================
    # HEALTH CHECK
    # =====================================================

    def health_check(self):

        return {

            "database": "MongoDB",

            "collection": "conversations",

            "status": "healthy"

        }

conversation_service = ConversationService()