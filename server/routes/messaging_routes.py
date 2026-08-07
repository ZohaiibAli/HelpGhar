"""
Transport layer for customer <-> worker messaging.

Two channels, split the way production chat systems split them:

* **HTTP** owns anything that must be durable or acknowledged -- sending,
  history, marking read, deleting, blocking. A send returns only after
  the message is in the database, so the sender gets a real success or a
  real error, and a retry is safe (see `clientId` in the service layer).

* **WebSocket** owns delivery and ephemera -- inbound messages, typing
  indicators, read receipts, presence. Nothing that arrives only over the
  socket is authoritative; if the socket is down the client falls back to
  polling the same HTTP endpoints and loses nothing but immediacy.

Sending over HTTP rather than over the socket is the important choice
here. It means a flaky connection degrades to "slower" instead of
"messages silently vanish", and it keeps every write behind the same
`Depends` auth the rest of the API uses.
"""

import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.concurrency import run_in_threadpool
from jose import JWTError, jwt

import os
from dotenv import load_dotenv

from helper.auth_helper import verify_token
from helper.cloudinary_helper import upload_chat_attachment
from helper.ws_manager import manager
from model.message_model import MessageSend, ThreadStart
from services import messaging_service as svc

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["Messaging"])

# Most attachments are one photo; a small cap keeps a single request from
# turning into a dozen sequential Cloudinary round trips.
MAX_ATTACHMENTS_PER_MESSAGE = 5


# ---------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------

def _actor(payload: dict = Depends(verify_token)):
    """(role, id) for the authenticated customer or worker."""
    return svc.actor_from_payload(payload)


def _participant_keys(thread: dict) -> List[str]:
    return [
        svc.connection_key(svc.ROLE_CUSTOMER, thread["customerId"]),
        svc.connection_key(svc.ROLE_WORKER, thread["workerId"]),
    ]


def _other_key(thread: dict, role: str) -> str:
    other_role = svc.OTHER_ROLE[role]

    return svc.connection_key(other_role, thread[svc.ID_FIELD[other_role]])


async def _thread_payload(thread: dict, viewer_role: str) -> dict:
    """Serialised thread, with the counterparty's live presence attached."""

    other_role = svc.OTHER_ROLE[viewer_role]
    other_id = thread[svc.ID_FIELD[other_role]]

    counterparty = await run_in_threadpool(svc.resolve_participant, other_role, other_id)

    payload = svc.serialize_thread(thread, viewer_role, counterparty)

    payload["participant"]["online"] = manager.is_online(
        svc.connection_key(other_role, other_id)
    )

    return payload


async def _push_unread_badge(role: str, user_id: str):
    """Keeps the navbar badge in step without the client having to poll."""

    total = await run_in_threadpool(svc.unread_total, role, user_id)

    await manager.send_to_keys(
        [svc.connection_key(role, user_id)],
        {"type": "unread", "total": total},
    )


# ---------------------------------------------------------------------
# Threads
# ---------------------------------------------------------------------

@router.post("/threads")
async def start_thread(
    payload: ThreadStart,
    actor: tuple = Depends(_actor),
):
    """
    Opens the conversation with the named counterparty (or returns the
    existing one) and optionally posts a first message.
    """

    role, user_id = actor

    if role == svc.ROLE_CUSTOMER:
        if not payload.workerId:
            raise HTTPException(status_code=400, detail="workerId is required")

        customer_id, worker_id = user_id, payload.workerId
    else:
        if not payload.customerId:
            raise HTTPException(status_code=400, detail="customerId is required")

        customer_id, worker_id = payload.customerId, user_id

    thread = await run_in_threadpool(
        svc.get_or_create_thread, customer_id, worker_id, payload.bookingId
    )

    message = None

    if payload.text and payload.text.strip():
        message = await run_in_threadpool(
            svc.send_message,
            thread,
            role,
            user_id,
            payload.text.strip(),
            None,
            None,
            payload.bookingId,
        )

        await _broadcast_new_message(thread, role, user_id, message)

    return {
        "success": True,
        "thread": await _thread_payload(thread, role),
        "message": message,
    }


@router.get("/threads")
async def list_threads(
    search: Optional[str] = Query(default=None, max_length=100),
    actor: tuple = Depends(_actor),
):
    role, user_id = actor

    threads = await run_in_threadpool(svc.list_threads, role, user_id, search)

    for thread in threads:
        participant = thread["participant"]

        participant["online"] = manager.is_online(
            svc.connection_key(participant["role"], participant["id"])
        )

    return {"success": True, "threads": threads}


@router.get("/unread-count")
async def unread_count(actor: tuple = Depends(_actor)):
    role, user_id = actor

    total = await run_in_threadpool(svc.unread_total, role, user_id)

    return {"success": True, "total": total}


@router.get("/contacts")
async def contacts(actor: tuple = Depends(_actor)):
    role, user_id = actor

    people = await run_in_threadpool(svc.list_contacts, role, user_id)

    for person in people:
        person["online"] = manager.is_online(
            svc.connection_key(person["role"], person["id"])
        )

    return {"success": True, "contacts": people}


@router.get("/threads/{thread_id}")
async def get_thread(thread_id: str, actor: tuple = Depends(_actor)):
    role, user_id = actor

    thread = await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    return {"success": True, "thread": await _thread_payload(thread, role)}


@router.delete("/threads/{thread_id}")
async def clear_thread(thread_id: str, actor: tuple = Depends(_actor)):
    """Removes the conversation from *your* inbox only."""

    role, user_id = actor

    await run_in_threadpool(svc.hide_thread, thread_id, role, user_id)
    await _push_unread_badge(role, user_id)

    return {"success": True, "message": "Conversation removed"}


@router.post("/threads/{thread_id}/block")
async def block_thread(thread_id: str, actor: tuple = Depends(_actor)):
    role, user_id = actor

    thread = await run_in_threadpool(svc.set_blocked, thread_id, role, user_id, True)

    await manager.send_to_keys(
        [_other_key(thread, role)],
        {"type": "thread:updated", "threadId": thread_id},
    )

    return {"success": True, "thread": await _thread_payload(thread, role)}


@router.post("/threads/{thread_id}/unblock")
async def unblock_thread(thread_id: str, actor: tuple = Depends(_actor)):
    role, user_id = actor

    thread = await run_in_threadpool(svc.set_blocked, thread_id, role, user_id, False)

    await manager.send_to_keys(
        [_other_key(thread, role)],
        {"type": "thread:updated", "threadId": thread_id},
    )

    return {"success": True, "thread": await _thread_payload(thread, role)}


# ---------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------

@router.get("/threads/{thread_id}/messages")
async def get_messages(
    thread_id: str,
    before: Optional[str] = Query(default=None),
    limit: int = Query(default=svc.DEFAULT_PAGE_SIZE, ge=1, le=svc.MAX_PAGE_SIZE),
    actor: tuple = Depends(_actor),
):
    role, user_id = actor

    await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    page = await run_in_threadpool(svc.list_messages, thread_id, before, limit)

    return {"success": True, **page}


async def _broadcast_new_message(thread: dict, sender_role: str, sender_id: str, message: dict):
    """
    Pushes a freshly stored message to both sides.

    The sender's own sockets are included on purpose: it is how their
    other open tabs/devices stay in sync, and how the tab that sent it
    reconciles its optimistic bubble (matched on `clientId`).
    """

    recipient_role = svc.OTHER_ROLE[sender_role]
    recipient_id = thread[svc.ID_FIELD[recipient_role]]

    sender_key = svc.connection_key(sender_role, sender_id)
    recipient_key = svc.connection_key(recipient_role, recipient_id)

    await manager.send_to_keys(
        [sender_key, recipient_key],
        {"type": "message:new", "threadId": thread["threadId"], "message": message},
    )

    await _push_unread_badge(recipient_role, recipient_id)


@router.post("/threads/{thread_id}/messages")
async def send_message(
    thread_id: str,
    payload: MessageSend,
    actor: tuple = Depends(_actor),
):
    role, user_id = actor

    thread = await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    message = await run_in_threadpool(
        svc.send_message,
        thread,
        role,
        user_id,
        payload.text,
        None,
        payload.clientId,
        payload.bookingId,
    )

    await _broadcast_new_message(thread, role, user_id, message)

    return {"success": True, "message": message}


@router.post("/threads/{thread_id}/attachments")
async def send_attachment(
    thread_id: str,
    files: List[UploadFile] = File(...),
    # Declared as Form fields, not bare defaults: in a multipart request
    # FastAPI would otherwise read them from the query string, and the
    # caption typed alongside a photo would silently never arrive.
    text: str = Form(default=""),
    clientId: Optional[str] = Form(default=None),
    actor: tuple = Depends(_actor),
):
    role, user_id = actor

    thread = await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    if not files:
        raise HTTPException(status_code=400, detail="No file was attached")

    if len(files) > MAX_ATTACHMENTS_PER_MESSAGE:
        raise HTTPException(
            status_code=400,
            detail=f"You can attach at most {MAX_ATTACHMENTS_PER_MESSAGE} files at once."
        )

    attachments = []

    for upload in files:
        attachments.append(await run_in_threadpool(upload_chat_attachment, upload))

    message_type = "image" if all(a["type"] == "image" for a in attachments) else "file"

    message = await run_in_threadpool(
        svc.send_message,
        thread,
        role,
        user_id,
        text.strip(),
        attachments,
        clientId,
        None,
        message_type,
    )

    await _broadcast_new_message(thread, role, user_id, message)

    return {"success": True, "message": message}


@router.post("/threads/{thread_id}/read")
async def mark_read(thread_id: str, actor: tuple = Depends(_actor)):
    role, user_id = actor

    thread = await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    message_ids = await run_in_threadpool(svc.mark_thread_read, thread_id, role, user_id)

    if message_ids:
        # Only the other party cares -- these are *their* messages
        # turning into double blue ticks.
        await manager.send_to_keys(
            [_other_key(thread, role)],
            {
                "type": "message:read",
                "threadId": thread_id,
                "messageIds": message_ids,
                "byRole": role,
            },
        )

    await _push_unread_badge(role, user_id)

    return {"success": True, "readCount": len(message_ids)}


@router.delete("/threads/{thread_id}/messages/{message_id}")
async def delete_message(
    thread_id: str,
    message_id: str,
    actor: tuple = Depends(_actor),
):
    role, user_id = actor

    thread = await run_in_threadpool(svc.get_thread_or_404, thread_id, role, user_id)

    message = await run_in_threadpool(
        svc.delete_message, thread_id, message_id, role, user_id
    )

    await manager.send_to_keys(
        _participant_keys(thread),
        {"type": "message:deleted", "threadId": thread_id, "messageId": message_id},
    )

    return {"success": True, "message": message}


# ---------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------

def _decode_ws_token(token: Optional[str]):
    """
    Browsers cannot set an Authorization header on a WebSocket handshake,
    so the token travels as a query parameter -- the standard workaround,
    and safe over wss:// since the URL never leaves the TLS tunnel.
    """

    if not token:
        return None

    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


async def _announce_presence(role: str, user_id: str, online: bool):
    """
    Tells everyone this account has a thread with that they came online
    or went offline, so their chat headers can update live.
    """

    threads = await run_in_threadpool(svc.list_threads, role, user_id)

    if not threads:
        return

    keys = [
        svc.connection_key(thread["participant"]["role"], thread["participant"]["id"])
        for thread in threads
    ]

    await manager.send_to_keys(
        keys,
        {
            "type": "presence",
            "role": role,
            "id": user_id,
            "online": online,
        },
    )


@router.websocket("/ws")
async def messaging_socket(websocket: WebSocket, token: Optional[str] = Query(default=None)):

    payload = _decode_ws_token(token)

    if not payload:
        # Rejecting before `accept()` answers the handshake with an HTTP
        # error, which is what a browser reports as a failed connection.
        await websocket.close(code=1008)
        return

    try:
        role, user_id = svc.actor_from_payload(payload)
    except HTTPException:
        await websocket.close(code=1008)
        return

    key = svc.connection_key(role, user_id)

    await websocket.accept()

    came_online = await manager.connect(key, websocket)

    try:
        await websocket.send_json({"type": "ready", "role": role, "id": user_id})

        await _push_unread_badge(role, user_id)

        if came_online:
            await run_in_threadpool(svc.touch_last_seen, role, user_id)
            await _announce_presence(role, user_id, True)

        while True:
            event = await websocket.receive_json()

            await _handle_socket_event(role, user_id, event)

    except WebSocketDisconnect:
        pass
    except Exception as error:
        # A malformed frame (e.g. non-JSON) kills this socket only; the
        # client reconnects. Never let it bubble up and take the worker
        # with it.
        logger.debug("Messaging socket closed for %s: %s", key, error)
    finally:
        went_offline = await manager.disconnect(key, websocket)

        if went_offline:
            await run_in_threadpool(svc.touch_last_seen, role, user_id)
            await _announce_presence(role, user_id, False)


async def _handle_socket_event(role: str, user_id: str, event: dict):
    """
    Client -> server frames. Deliberately limited to ephemera: anything
    that must survive a dropped connection goes over HTTP instead.
    """

    if not isinstance(event, dict):
        return

    event_type = event.get("type")

    if event_type == "ping":
        # The client heartbeats so that idle proxies (and Render's 100s
        # idle timeout) don't quietly drop the connection.
        await manager.send_to_keys(
            [svc.connection_key(role, user_id)], {"type": "pong"}
        )
        return

    if event_type == "typing":
        thread_id = event.get("threadId")

        if not thread_id:
            return

        try:
            thread = await run_in_threadpool(
                svc.get_thread_or_404, thread_id, role, user_id
            )
        except HTTPException:
            return

        await manager.send_to_keys(
            [_other_key(thread, role)],
            {
                "type": "typing",
                "threadId": thread_id,
                "role": role,
                "isTyping": bool(event.get("isTyping")),
            },
        )
