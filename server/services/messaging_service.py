"""
Customer <-> worker direct messaging.

Shape of the system, and why:

* One thread per (customer, worker) pair, not per booking. This is the
  Upwork/Fiverr model: you talk to a *person*, and the conversation
  survives across however many bookings you make with them. A message
  can still carry a `bookingId` for context.

* Threads are denormalised with the counterparty's name/avatar so the
  inbox renders from a single query, but those snapshots are refreshed
  from the source collections on every read, so a renamed user or a new
  profile picture shows up immediately.

* Unread is a per-side counter on the thread (`unread.customer` /
  `unread.worker`) rather than a count() over messages -- the inbox badge
  is read on nearly every page load, and a counter keeps that O(1).

* Timestamps are stored as native BSON datetimes, not ISO strings. The
  rest of this codebase stores ISO strings, but message paging sorts and
  ranges over these values, and `datetime.isoformat()` drops the
  microseconds field when it happens to be zero -- which makes string
  ordering subtly wrong. Serialisation to ISO happens on the way out.

Everything here is synchronous pymongo. The WebSocket layer calls into
it via `run_in_threadpool` so a slow query never stalls the event loop.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from config.db import (
    message_thread_collection,
    message_collection,
    customer_collection,
    worker_collection,
    gig_collection,
    booking_collection,
)
from helper.id_helper import generate_thread_id

# How many messages a single history page returns. The client asks for
# older pages as the user scrolls up.
DEFAULT_PAGE_SIZE = 30
MAX_PAGE_SIZE = 100

ROLE_CUSTOMER = "customer"
ROLE_WORKER = "worker"

# thread field holding each side's id, keyed by role.
ID_FIELD = {
    ROLE_CUSTOMER: "customerId",
    ROLE_WORKER: "workerId",
}

OTHER_ROLE = {
    ROLE_CUSTOMER: ROLE_WORKER,
    ROLE_WORKER: ROLE_CUSTOMER,
}


# ---------------------------------------------------------------------
# Identity
# ---------------------------------------------------------------------

def actor_from_payload(payload: dict):
    """
    (role, business id) for the caller, taken from the JWT only.

    Customers are identified by their customerId ("HGC-001") and workers
    by their workerId ("HGW-007") -- the same codes bookings, gigs and
    reviews already key on.
    """

    role = payload.get("role")

    if role == ROLE_CUSTOMER:
        user_id = payload.get("customerId")
    elif role == ROLE_WORKER:
        user_id = payload.get("workerId")
    else:
        raise HTTPException(
            status_code=403,
            detail="Only customers and workers can use messaging"
        )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Your session is missing an account id. Please sign in again."
        )

    return role, user_id


def connection_key(role: str, user_id: str) -> str:
    """Stable per-account key used by the WebSocket registry."""
    return f"{role}:{user_id}"


# ---------------------------------------------------------------------
# Counterparty lookups
# ---------------------------------------------------------------------

def _worker_avatar(worker: dict, worker_id: str) -> str:
    """
    Workers upload a profile picture (`profileImage`), but the older gig
    listing carries its own `avatar` and is what the public worker cards
    render. Prefer the profile picture, fall back to the gig, so a chat
    header never shows a blank avatar for a worker who has one visible
    elsewhere on the site.
    """

    if worker.get("profileImage"):
        return worker["profileImage"]

    gig = gig_collection.find_one(
        {"workerId": worker_id},
        {"avatar": 1}
    )

    return (gig or {}).get("avatar", "") or ""


def resolve_customers(customer_ids: List[str]) -> Dict[str, dict]:
    if not customer_ids:
        return {}

    docs = customer_collection.find(
        {"customerId": {"$in": list(set(customer_ids))}},
        {"customerId": 1, "fullName": 1, "profileImage": 1, "status": 1, "lastSeenAt": 1}
    )

    return {
        doc["customerId"]: {
            "id": doc["customerId"],
            "role": ROLE_CUSTOMER,
            "name": doc.get("fullName") or "Customer",
            "avatar": doc.get("profileImage") or "",
            "status": doc.get("status", "active"),
            "lastSeenAt": _iso(doc.get("lastSeenAt")),
        }
        for doc in docs
    }


def resolve_workers(worker_ids: List[str]) -> Dict[str, dict]:
    if not worker_ids:
        return {}

    unique_ids = list(set(worker_ids))

    docs = list(
        worker_collection.find(
            {"workerId": {"$in": unique_ids}},
            {
                "workerId": 1,
                "fullName": 1,
                "profileImage": 1,
                "category": 1,
                "status": 1,
                "lastSeenAt": 1,
            }
        )
    )

    # One bulk gig lookup for the avatar fallback rather than a query per
    # worker -- the inbox resolves every counterparty at once.
    missing_avatar = [
        doc["workerId"] for doc in docs if not doc.get("profileImage")
    ]

    gig_avatars: Dict[str, str] = {}

    if missing_avatar:
        for gig in gig_collection.find(
            {"workerId": {"$in": missing_avatar}},
            {"workerId": 1, "avatar": 1}
        ):
            gig_avatars.setdefault(gig["workerId"], gig.get("avatar", "") or "")

    return {
        doc["workerId"]: {
            "id": doc["workerId"],
            "role": ROLE_WORKER,
            "name": doc.get("fullName") or "Worker",
            "avatar": doc.get("profileImage") or gig_avatars.get(doc["workerId"], ""),
            "category": doc.get("category", ""),
            "status": doc.get("status", "active"),
            "lastSeenAt": _iso(doc.get("lastSeenAt")),
        }
        for doc in docs
    }


def resolve_participant(role: str, user_id: str) -> Optional[dict]:
    lookup = resolve_customers([user_id]) if role == ROLE_CUSTOMER else resolve_workers([user_id])

    return lookup.get(user_id)


def touch_last_seen(role: str, user_id: str):
    """Records when someone was last connected, for the "last seen" line."""

    collection = customer_collection if role == ROLE_CUSTOMER else worker_collection

    collection.update_one(
        {ID_FIELD[role]: user_id},
        {"$set": {"lastSeenAt": datetime.utcnow()}}
    )


# ---------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------

def _iso(value) -> Optional[str]:
    if isinstance(value, datetime):
        return value.isoformat() + "Z"

    # Older documents (or anything written elsewhere) may already hold a
    # string; pass it through rather than crashing the whole response.
    return value if isinstance(value, str) else None


def serialize_message(doc: dict) -> dict:
    deleted = bool(doc.get("deletedAt"))

    return {
        "messageId": doc["messageId"],
        "threadId": doc["threadId"],
        "senderRole": doc["senderRole"],
        "senderId": doc["senderId"],
        "senderName": doc.get("senderName", ""),
        "type": doc.get("type", "text"),
        # A deleted message keeps its slot in the thread (so the
        # conversation still reads in order) but loses its content.
        "text": "" if deleted else doc.get("text", ""),
        "attachments": [] if deleted else doc.get("attachments", []),
        "bookingId": doc.get("bookingId"),
        "clientId": doc.get("clientId"),
        "createdAt": _iso(doc.get("createdAt")),
        "readAt": _iso(doc.get("readAt")),
        "deleted": deleted,
    }


def serialize_thread(doc: dict, viewer_role: str, counterparty: Optional[dict]) -> dict:
    other_role = OTHER_ROLE[viewer_role]
    other_id = doc[ID_FIELD[other_role]]

    participant = counterparty or {
        "id": other_id,
        "role": other_role,
        "name": "Deleted account",
        "avatar": "",
        "status": "deleted",
        "lastSeenAt": None,
    }

    last_message = doc.get("lastMessage") or None

    if last_message:
        last_message = {
            "text": last_message.get("text", ""),
            "type": last_message.get("type", "text"),
            "senderRole": last_message.get("senderRole"),
            "senderId": last_message.get("senderId"),
            "createdAt": _iso(last_message.get("createdAt")),
            "deleted": bool(last_message.get("deleted")),
        }

    blocked_by = doc.get("blockedBy", [])

    return {
        "threadId": doc["threadId"],
        "participant": participant,
        "lastMessage": last_message,
        "lastMessageAt": _iso(doc.get("lastMessageAt")),
        "unreadCount": (doc.get("unread") or {}).get(viewer_role, 0),
        "bookingId": doc.get("bookingId"),
        # Who blocked whom matters to the UI: "you blocked this user"
        # (unblockable) reads very differently from "you can't reply".
        "blockedByMe": connection_key(viewer_role, doc[ID_FIELD[viewer_role]]) in blocked_by,
        "blockedByThem": connection_key(other_role, other_id) in blocked_by,
        "createdAt": _iso(doc.get("createdAt")),
    }


# ---------------------------------------------------------------------
# Threads
# ---------------------------------------------------------------------

def get_or_create_thread(customer_id: str, worker_id: str, booking_id: Optional[str] = None) -> dict:
    """
    Returns the single thread for this pair, creating it if needed.

    Both accounts are verified to exist first -- otherwise a typo'd or
    stale id would silently create a thread pointing at nobody, which
    then shows up in one person's inbox forever.
    """

    if not customer_collection.find_one({"customerId": customer_id}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Customer not found")

    if not worker_collection.find_one({"workerId": worker_id}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="Worker not found")

    existing = message_thread_collection.find_one({
        "customerId": customer_id,
        "workerId": worker_id,
    })

    if existing:
        if booking_id and not existing.get("bookingId"):
            message_thread_collection.update_one(
                {"threadId": existing["threadId"]},
                {"$set": {"bookingId": booking_id}}
            )
            existing["bookingId"] = booking_id

        # Reopening a thread you previously cleared from your inbox.
        if existing.get("hiddenFor"):
            message_thread_collection.update_one(
                {"threadId": existing["threadId"]},
                {"$set": {"hiddenFor": []}}
            )
            existing["hiddenFor"] = []

        return existing

    now = datetime.utcnow()

    thread = {
        "threadId": generate_thread_id(),
        "customerId": customer_id,
        "workerId": worker_id,
        "bookingId": booking_id,
        "lastMessage": None,
        # Sorted on by the inbox; seeding it with the creation time keeps
        # a brand-new empty thread at the top instead of at the bottom
        # with a null sort key.
        "lastMessageAt": now,
        "unread": {ROLE_CUSTOMER: 0, ROLE_WORKER: 0},
        "hiddenFor": [],
        "blockedBy": [],
        "createdAt": now,
    }

    try:
        message_thread_collection.insert_one(thread)
    except Exception:
        # Lost a race against a concurrent "Message" click on the other
        # side -- the unique index rejected the duplicate, so the thread
        # the winner created is the one we want.
        existing = message_thread_collection.find_one({
            "customerId": customer_id,
            "workerId": worker_id,
        })

        if not existing:
            raise

        return existing

    return thread


def get_thread_or_404(thread_id: str, role: str, user_id: str) -> dict:
    """
    Loads a thread and proves the caller is one of its two participants.

    The ownership check is part of the query rather than a follow-up
    `if`, so there is no path that reads a thread without it.
    """

    thread = message_thread_collection.find_one({
        "threadId": thread_id,
        ID_FIELD[role]: user_id,
    })

    if not thread:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return thread


def list_threads(role: str, user_id: str, search: Optional[str] = None) -> List[dict]:
    me = connection_key(role, user_id)

    threads = list(
        message_thread_collection.find({
            ID_FIELD[role]: user_id,
            "hiddenFor": {"$ne": me},
        }).sort("lastMessageAt", -1)
    )

    if not threads:
        return []

    other_role = OTHER_ROLE[role]
    other_ids = [thread[ID_FIELD[other_role]] for thread in threads]

    lookup = (
        resolve_workers(other_ids)
        if other_role == ROLE_WORKER
        else resolve_customers(other_ids)
    )

    serialized = [
        serialize_thread(thread, role, lookup.get(thread[ID_FIELD[other_role]]))
        for thread in threads
    ]

    if search:
        needle = search.strip().lower()

        if needle:
            serialized = [
                item for item in serialized
                if needle in item["participant"]["name"].lower()
                or needle in ((item.get("lastMessage") or {}).get("text") or "").lower()
            ]

    return serialized


def hide_thread(thread_id: str, role: str, user_id: str):
    """
    Clears a conversation from one side's inbox without destroying the
    other side's copy. A new message un-hides it (see `send_message`).
    """

    get_thread_or_404(thread_id, role, user_id)

    message_thread_collection.update_one(
        {"threadId": thread_id},
        {
            "$addToSet": {"hiddenFor": connection_key(role, user_id)},
            "$set": {f"unread.{role}": 0},
        }
    )


def set_blocked(thread_id: str, role: str, user_id: str, blocked: bool) -> dict:
    thread = get_thread_or_404(thread_id, role, user_id)

    me = connection_key(role, user_id)

    operator = "$addToSet" if blocked else "$pull"

    message_thread_collection.update_one(
        {"threadId": thread_id},
        {operator: {"blockedBy": me}}
    )

    return message_thread_collection.find_one({"threadId": thread["threadId"]})


# ---------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------

def _object_id(value: str, what: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {what}")


def list_messages(
    thread_id: str,
    before: Optional[str] = None,
    limit: int = DEFAULT_PAGE_SIZE,
) -> Dict[str, Any]:
    """
    One page of history, newest first, using keyset pagination on _id.

    Offset paging (`skip`) would be wrong here as well as slow: new
    messages arriving while the user scrolls up shift every offset, so
    pages overlap or skip. An _id cursor is stable under insertion.
    """

    limit = max(1, min(limit, MAX_PAGE_SIZE))

    query: Dict[str, Any] = {"threadId": thread_id}

    if before:
        query["_id"] = {"$lt": _object_id(before, "cursor")}

    # One extra document tells us whether another page exists without a
    # second count query.
    docs = list(
        message_collection.find(query).sort("_id", -1).limit(limit + 1)
    )

    has_more = len(docs) > limit
    docs = docs[:limit]

    return {
        # Returned oldest-first: that is the order they render in, and it
        # saves the client from reversing every page.
        "messages": [serialize_message(doc) for doc in reversed(docs)],
        "hasMore": has_more,
        "nextCursor": str(docs[-1]["_id"]) if docs and has_more else None,
    }


def send_message(
    thread: dict,
    role: str,
    user_id: str,
    text: str = "",
    attachments: Optional[List[dict]] = None,
    client_id: Optional[str] = None,
    booking_id: Optional[str] = None,
    message_type: str = "text",
) -> dict:
    """
    Persists a message and updates the thread's preview/unread counters.
    Returns the serialised message ready to broadcast.
    """

    attachments = attachments or []

    if not text and not attachments:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    blocked_by = thread.get("blockedBy", [])

    if blocked_by:
        me = connection_key(role, user_id)
        other_role = OTHER_ROLE[role]
        them = connection_key(other_role, thread[ID_FIELD[other_role]])

        if me in blocked_by:
            raise HTTPException(
                status_code=403,
                detail="You blocked this user. Unblock them to send a message."
            )

        if them in blocked_by:
            raise HTTPException(
                status_code=403,
                detail="You can no longer send messages in this conversation."
            )

    # A retry of a send whose response was lost must not post twice. The
    # unique (threadId, clientId) index is the real guard; this check
    # just turns the common case into a clean 200 with the original
    # message instead of a duplicate-key error.
    if client_id:
        duplicate = message_collection.find_one({
            "threadId": thread["threadId"],
            "clientId": client_id,
        })

        if duplicate:
            return serialize_message(duplicate)

    sender = resolve_participant(role, user_id)
    now = datetime.utcnow()

    object_id = ObjectId()

    message = {
        "_id": object_id,
        "messageId": str(object_id),
        "threadId": thread["threadId"],
        "senderRole": role,
        "senderId": user_id,
        "senderName": (sender or {}).get("name", ""),
        "type": message_type,
        "text": text,
        "attachments": attachments,
        "bookingId": booking_id or thread.get("bookingId"),
        "clientId": client_id,
        "createdAt": now,
        "readAt": None,
        "deletedAt": None,
    }

    try:
        message_collection.insert_one(message)
    except Exception:
        # Concurrent retry with the same clientId beat us to the insert.
        if client_id:
            duplicate = message_collection.find_one({
                "threadId": thread["threadId"],
                "clientId": client_id,
            })

            if duplicate:
                return serialize_message(duplicate)

        raise

    preview_text = text if text else _attachment_preview(attachments)

    recipient_role = OTHER_ROLE[role]

    message_thread_collection.update_one(
        {"threadId": thread["threadId"]},
        {
            "$set": {
                "lastMessage": {
                    "text": preview_text,
                    "type": message_type,
                    "senderRole": role,
                    "senderId": user_id,
                    "createdAt": now,
                    "deleted": False,
                },
                "lastMessageAt": now,
            },
            "$inc": {f"unread.{recipient_role}": 1},
            # A new message pulls the thread back into both inboxes --
            # clearing a conversation hides history, it doesn't opt you
            # out of future messages.
            "$pull": {"hiddenFor": {"$in": [
                connection_key(role, user_id),
                connection_key(recipient_role, thread[ID_FIELD[recipient_role]]),
            ]}},
        }
    )

    return serialize_message(message)


def _attachment_preview(attachments: List[dict]) -> str:
    if not attachments:
        return ""

    if len(attachments) == 1:
        kind = attachments[0].get("type", "file")
        return "📷 Photo" if kind == "image" else f"📎 {attachments[0].get('name', 'Attachment')}"

    return f"📎 {len(attachments)} attachments"


def mark_thread_read(thread_id: str, role: str, user_id: str) -> List[str]:
    """
    Marks every unread inbound message as read and zeroes the badge.
    Returns the ids that changed, so the sender's ticks can be updated
    over the socket -- an empty list means there is nothing to broadcast.
    """

    unread = list(
        message_collection.find(
            {
                "threadId": thread_id,
                "senderRole": {"$ne": role},
                "readAt": None,
            },
            {"messageId": 1}
        )
    )

    message_thread_collection.update_one(
        {"threadId": thread_id},
        {"$set": {f"unread.{role}": 0}}
    )

    if not unread:
        return []

    read_at = datetime.utcnow()

    message_collection.update_many(
        {
            "threadId": thread_id,
            "senderRole": {"$ne": role},
            "readAt": None,
        },
        {"$set": {"readAt": read_at}}
    )

    return [doc["messageId"] for doc in unread]


def delete_message(thread_id: str, message_id: str, role: str, user_id: str) -> dict:
    """
    Delete-for-everyone, restricted to your own messages. The document is
    tombstoned rather than removed so both clients converge on the same
    "This message was deleted" placeholder.
    """

    message = message_collection.find_one({
        "threadId": thread_id,
        "messageId": message_id,
    })

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message["senderRole"] != role or message["senderId"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own messages"
        )

    if message.get("deletedAt"):
        return serialize_message(message)

    now = datetime.utcnow()

    message_collection.update_one(
        {"messageId": message_id},
        {"$set": {"deletedAt": now, "text": "", "attachments": []}}
    )

    message.update({"deletedAt": now, "text": "", "attachments": []})

    # If this was the thread preview, the inbox has to stop showing the
    # deleted text too.
    thread = message_thread_collection.find_one({"threadId": thread_id})
    last_message = (thread or {}).get("lastMessage") or {}

    if last_message.get("createdAt") == message.get("createdAt"):
        message_thread_collection.update_one(
            {"threadId": thread_id},
            {
                "$set": {
                    "lastMessage": {
                        **last_message,
                        "text": "This message was deleted",
                        "deleted": True,
                    }
                }
            }
        )

    return serialize_message(message)


def unread_total(role: str, user_id: str) -> int:
    """Badge count for the navbar: unread messages across all threads."""

    me = connection_key(role, user_id)

    pipeline = [
        {"$match": {ID_FIELD[role]: user_id, "hiddenFor": {"$ne": me}}},
        {"$group": {"_id": None, "total": {"$sum": f"$unread.{role}"}}},
    ]

    result = list(message_thread_collection.aggregate(pipeline))

    return int(result[0]["total"]) if result else 0


# ---------------------------------------------------------------------
# Contacts ("who am I allowed to start a conversation with")
# ---------------------------------------------------------------------

def list_contacts(role: str, user_id: str) -> List[dict]:
    """
    People this account has a booking history with, minus anyone they
    already have a thread with. Powers the "New message" picker.

    Customers can additionally message any worker straight from that
    worker's public profile, so this is a convenience list rather than a
    permission boundary.
    """

    other_role = OTHER_ROLE[role]

    bookings = booking_collection.find(
        {ID_FIELD[role]: user_id},
        {ID_FIELD[other_role]: 1}
    )

    other_ids = {
        booking[ID_FIELD[other_role]]
        for booking in bookings
        if booking.get(ID_FIELD[other_role])
    }

    if not other_ids:
        return []

    existing = message_thread_collection.find(
        {ID_FIELD[role]: user_id},
        {ID_FIELD[other_role]: 1}
    )

    for thread in existing:
        other_ids.discard(thread[ID_FIELD[other_role]])

    if not other_ids:
        return []

    lookup = (
        resolve_workers(list(other_ids))
        if other_role == ROLE_WORKER
        else resolve_customers(list(other_ids))
    )

    return sorted(lookup.values(), key=lambda item: item["name"].lower())
