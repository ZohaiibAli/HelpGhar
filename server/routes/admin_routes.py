from bson import ObjectId
from fastapi import UploadFile, File
from helper.cloudinary_helper import upload_image, delete_image
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from config.db import (
    admin_collection,
    dispute_collection,
    customer_collection,
    worker_collection,
    gig_collection,
)
from model.admin_model import AdminLogin,ForgotPasswordRequest,ResetPasswordRequest
from model.admin_model import WorkerVerification, ModerationAction
from model.dispute_model import PaymentDisputeDecision
from helper.payment_dispute_helper import PAYMENT_DISPUTE, decide_payment_dispute
from helper.account_helper import (
    ACTIVE,
    BLOCKED,
    SUSPENDED,
    ROLE_COLLECTION,
    ROLE_ID_FIELD,
    apply_moderation,
    warn_account,
    normalise_status,
    refresh,
    restore_account,
)
from pydantic import BaseModel
from datetime import datetime
from helper.password_helper import hash_password
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from helper.password_helper import verify_password
from helper.auth_helper import get_current_admin
from helper.email_helper import (
    send_reset_email,
    send_worker_approved_email,
    send_worker_rejected_email,
    send_plain_email,
    complaint_action_taken_email,
    complaint_resolved_email,
    account_moderated_email,
    account_restored_email,
    account_warning_email,
    booking_cancelled_by_admin_email,
)
from fastapi import BackgroundTasks
import secrets
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()
FRONTEND_URL = os.getenv("FRONTEND_URL")


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

class UpdateAdminProfile(BaseModel):
    fullName: str
    email: str
    phone: str
    address: str


class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str


@router.post("/login")
def admin_login(admin: AdminLogin):

    admin_data = admin_collection.find_one(
        {
            "email": admin.email
        }
    )

    if admin_data is None:
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    if not verify_password(
            admin.password,
            admin_data["password"]
        ):
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    token = create_access_token(
        {
            "id": str(admin_data["_id"]),
            "email": admin_data["email"],
            "role": "admin"
        }
    )

    return {
        "success": True,
        "message": "Login Successful",
        "token": token,
        "admin": {
            "fullName": admin_data["name"],
            "email": admin_data["email"],
            "role": "admin"
        }
    }
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):

    admin = admin_collection.find_one(
        {
            "email": request.email
        }
    )

    # Always return the same response
    if not admin:
        return {
            "success": True,
            "message": "If this email exists, a reset link has been sent."
        }

    # Generate secure random token
    token = secrets.token_urlsafe(32)

    # Token expires after 15 minutes
    expiry = datetime.utcnow() + timedelta(minutes=15)

    admin_collection.update_one(
        {
            "_id": admin["_id"]
        },
        {
            "$set": {
                "resetToken": token,
                "resetTokenExpiry": expiry
            }
        }
    )

    reset_link = f"{FRONTEND_URL}/admin-reset-password?token={token}"

    await send_reset_email(
        request.email,
        reset_link
    )

    return {
        "success": True,
        "message": "If this email exists, a reset link has been sent."
    }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):

    admin = admin_collection.find_one(
        {
            "resetToken": request.token
        }
    )

    if not admin:
        return {
            "success": False,
            "message": "Invalid or expired reset link."
        }

    expiry = admin.get("resetTokenExpiry")

    if not expiry or datetime.utcnow() > expiry:

        admin_collection.update_one(
            {
                "_id": admin["_id"]
            },
            {
                "$unset": {
                    "resetToken": "",
                    "resetTokenExpiry": ""
                }
            }
        )

        return {
            "success": False,
            "message": "Reset link has expired."
        }

    hashed_password = hash_password(request.password)

    admin_collection.update_one(
        {
            "_id": admin["_id"]
        },
        {
            "$set": {
                "password": hashed_password
            },
            "$unset": {
                "resetToken": "",
                "resetTokenExpiry": ""
            }
        }
    )

    return {
        "success": True,
        "message": "Password reset successfully."
    }

@router.get("/dashboard")
def dashboard(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin Only"
        )

    return {
        "success": True
    }

@router.get("/profile")
def get_admin_profile(current_admin=Depends(get_current_admin)):

    return {
        "id": str(current_admin["_id"]),
        "fullName": current_admin.get("fullName", current_admin.get("name", "")),
        "email": current_admin["email"],
        "phone": current_admin.get("phone", ""),
        "address": current_admin.get("address", ""),
        "profileImage": current_admin.get("profileImage", "")
    }

@router.put("/profile")
def update_admin_profile(
    data: UpdateAdminProfile,
    current_admin=Depends(get_current_admin)
):

    admin_collection.update_one(
        {"_id": current_admin["_id"]},
        {
            "$set": {
                "name": data.fullName,
                "fullName": data.fullName,
                "email": data.email,
                "phone": data.phone,
                "address": data.address
            }
        }
    )

    return {
        "success": True,
        "message": "Profile updated successfully"
    }
@router.put("/profile-image")
async def update_profile_image(
    file: UploadFile = File(...),
    current_admin=Depends(get_current_admin)
):
    admin = admin_collection.find_one(
        {
            "_id": current_admin["_id"]
        }
    )

    old_image = admin.get("profileImage")

    image_url = upload_image(
        file,
        folder="HelpGhar/admins"
    )

    admin_collection.update_one(
        {
            "_id": current_admin["_id"]
        },
        {
            "$set": {
                "profileImage": image_url
            }
        }
    )

    if old_image:
        delete_image(old_image)

    return {
        "success": True,
        "message": "Profile picture updated successfully.",
        "profileImage": image_url
    }
@router.put("/change-password")
def change_password(
    data: ChangePassword,
    current_admin=Depends(get_current_admin)
):

    if not verify_password(
        data.currentPassword,
        current_admin["password"]
    ):
        return {
            "success": False,
            "message": "Current password is incorrect"
        }

    admin_collection.update_one(
        {"_id": current_admin["_id"]},
        {
            "$set": {
                "password": hash_password(data.newPassword)
            }
        }
    )

    return {
        "success": True,
        "message": "Password updated successfully"
    }

def _admin_disputes(filed_by: str):
    """
    Complaints filed by one side, newest first, each carrying the live
    account status of the person complained about so the admin can see
    at a glance whether action has already been taken.
    """

    against_role = "worker" if filed_by == "customer" else "customer"
    against_field = ROLE_ID_FIELD[against_role]

    disputes = list(
        dispute_collection.find({"filedBy": filed_by}).sort("createdAt", -1)
    )

    accused = {
        doc[against_field]: refresh(against_role, doc)
        for doc in ROLE_COLLECTION[against_role].find(
            {against_field: {"$in": [d.get(against_field) for d in disputes]}}
        )
    }

    result = []

    for dispute in disputes:
        target = accused.get(dispute.get(against_field)) or {}

        result.append({
            "id": dispute["disputeId"],
            "bookingId": dispute.get("bookingId"),
            "customerId": dispute["customerId"],
            "customerName": dispute.get("customerName", "Unknown Customer"),
            "workerId": dispute["workerId"],
            "workerName": dispute.get("workerName", "Unknown Worker"),
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "createdAt": dispute["createdAt"],
            "actionTaken": dispute.get("actionTaken"),
            "type": dispute.get("type", "complaint"),
            "amount": dispute.get("amount"),
            "resolution": dispute.get("resolution"),
            "against": {
                "role": against_role,
                "id": dispute.get(against_field),
                "name": dispute.get(f"{against_role}Name"),
                "status": normalise_status(target.get("status")) if target else None,
                "suspendedUntil": target.get("suspendedUntil"),
                "reason": target.get("moderationReason"),
            },
        })

    return result


def _complainant(dispute: dict):
    role = dispute.get("filedBy")
    if role not in ROLE_COLLECTION:
        return None
    return ROLE_COLLECTION[role].find_one({ROLE_ID_FIELD[role]: dispute.get(ROLE_ID_FIELD[role])})


@router.get("/disputes/customer")
def get_customer_disputes_admin(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    return {
        "success": True,
        "complaints": _admin_disputes("customer")
    }


@router.get("/disputes/worker")
def get_worker_disputes_admin(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    return {
        "success": True,
        "complaints": _admin_disputes("worker")
    }


@router.patch("/dispute/{dispute_id}/resolve")
def resolve_dispute(
    dispute_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(verify_token)
):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    dispute = dispute_collection.find_one({"disputeId": dispute_id})

    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    if dispute.get("type") == PAYMENT_DISPUTE:
        raise HTTPException(
            status_code=400,
            detail="Decide a payment dispute with Release to worker or Refund customer."
        )

    already_resolved = dispute.get("status", "").lower() == "resolved"

    dispute_collection.update_one(
        {"disputeId": dispute_id},
        {"$set": {"status": "Resolved", "resolvedAt": datetime.utcnow()}}
    )

    complainant = _complainant(dispute)
    if not already_resolved and complainant and complainant.get("email"):
        background_tasks.add_task(
            send_plain_email,
            complainant["email"],
            *complaint_resolved_email(
                complainant.get("fullName"), dispute_id, dispute.get("subject", "")
            ),
        )

    return {
        "success": True,
        "message": "Dispute marked as resolved"
    }


@router.patch("/payment-dispute/{dispute_id}/decide")
def decide_payment_dispute_route(
    dispute_id: str,
    payload: PaymentDisputeDecision,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin)
):
    """Release the held payment to the worker, or refund the customer."""

    dispute = dispute_collection.find_one({"disputeId": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    message = decide_payment_dispute(
        dispute,
        payload.decision,
        str(current_admin["_id"]),
        (payload.note or "").strip() or None,
        background_tasks,
    )
    return {"success": True, "message": message}


@router.delete("/dispute/{dispute_id}")
def delete_dispute(dispute_id: str, user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    pending_payment = dispute_collection.find_one({
        "disputeId": dispute_id, "type": PAYMENT_DISPUTE, "status": {"$ne": "Resolved"},
    })
    if pending_payment:
        raise HTTPException(
            status_code=400,
            detail="Decide this payment dispute (release or refund) before deleting it."
        )

    result = dispute_collection.delete_one({"disputeId": dispute_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dispute not found")

    return {
        "success": True,
        "message": "Dispute deleted"
    }

def _moderation_view(role: str, user: dict) -> dict:
    user = refresh(role, user)
    return {
        "status": normalise_status(user.get("status")),
        "suspendedUntil": user.get("suspendedUntil"),
        "moderationReason": user.get("moderationReason"),
    }


@router.get("/users")
def get_users(current_admin=Depends(get_current_admin)):

    users = []

    for customer in customer_collection.find():
        users.append({
            "id": str(customer["_id"]),
            "customerId": customer.get("customerId"),
            "fullName": customer["fullName"],
            "email": customer["email"],
            "phone": customer["phone"],
            "role": "customer",
            **_moderation_view("customer", customer),
            "joined": customer.get("createdAt", "")
        })

    for worker in worker_collection.find():
        users.append({
            "id": str(worker["_id"]),
            "workerId": worker.get("workerId"),
            "fullName": worker["fullName"],
            "email": worker["email"],
            "phone": worker["phone"],
            "role": "worker",
            **_moderation_view("worker", worker),
            "joined": worker.get("createdAt", "")
        })

    return {
        "success": True,
        "users": users
    }

def _resolve_user_collection(role: str):
    """
    role was previously trusted as an arbitrary client-supplied
    string (`worker_collection if role == "customer" else ...`), so
    anything other than the literal string "customer" silently fell
    through to worker_collection and operated on whatever document
    happened to share that ObjectId there.
    """

    if role == "customer":
        return customer_collection

    if role == "worker":
        return worker_collection

    raise HTTPException(
        status_code=400,
        detail="role must be 'customer' or 'worker'"
    )


def _parse_object_id(id: str) -> ObjectId:
    try:
        return ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user id")


@router.patch("/users/{role}/{id}/status")
def toggle_user_status(
    role: str,
    id: str,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin)
):

    collection = _resolve_user_collection(role)

    user = collection.find_one({"_id": _parse_object_id(id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Kept for older clients. Same rules as /moderation: blocking an
    # active account, restoring anything else.
    user = refresh(role, user)
    action = "block" if normalise_status(user.get("status")) == ACTIVE else "restore"

    _moderate(
        role, user,
        ModerationAction(action=action, reason="Blocked by admin" if action == "block" else None),
        current_admin, background_tasks,
    )

    return {
        "success": True,
        "status": BLOCKED if action == "block" else ACTIVE
    }

def _until_text(until_iso):
    try:
        return datetime.fromisoformat(until_iso).strftime("%d %b %Y, %H:%M UTC")
    except (TypeError, ValueError):
        return "further notice"


def _record_dispute_action(dispute, action, days, admin_id, background_tasks):
    """Stamp the complaint with the action taken and, the first time, tell
    the person who filed it that something was done."""
    if not dispute:
        return

    first_action = not dispute.get("actionTaken")
    dispute_collection.update_one(
        {"disputeId": dispute["disputeId"]},
        {"$set": {"actionTaken": {
            "action": action,
            "days": days,
            "at": datetime.utcnow().isoformat(),
            "by": admin_id,
        }}}
    )

    complainant = _complainant(dispute)
    if first_action and complainant and complainant.get("email"):
        background_tasks.add_task(
            send_plain_email,
            complainant["email"],
            *complaint_action_taken_email(
                complainant.get("fullName"), dispute["disputeId"], dispute.get("subject", "")
            ),
        )


def _moderate(role, user, payload: ModerationAction, current_admin, background_tasks):
    """Shared by the moderation endpoint and the legacy toggle."""

    admin_id = str(current_admin["_id"])
    status = normalise_status(user.get("status"))

    dispute = None
    if payload.disputeId:
        dispute = dispute_collection.find_one({"disputeId": payload.disputeId})
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        # Only the person complained ABOUT can be actioned from a
        # complaint -- never the one who filed it.
        if (
            dispute.get("filedBy") == role
            or dispute.get(ROLE_ID_FIELD[role]) != user.get(ROLE_ID_FIELD[role])
        ):
            raise HTTPException(status_code=400, detail="This complaint is not about that user")

    if payload.action == "warn":
        if status != ACTIVE:
            raise HTTPException(
                status_code=400,
                detail=f"This account is already {status} -- a warning isn't needed",
            )

        note = (payload.reason or "").strip() or None
        warn_account(role, user, note, admin_id, payload.disputeId)

        if user.get("email"):
            background_tasks.add_task(
                send_plain_email,
                user["email"],
                *account_warning_email(
                    user.get("fullName"),
                    role,
                    dispute["disputeId"] if dispute else None,
                    dispute.get("subject") if dispute else None,
                    note,
                ),
            )

        _record_dispute_action(dispute, "warned", None, admin_id, background_tasks)

        return {"status": ACTIVE, "warned": True, "cancelledBookings": 0}

    if payload.action == "restore":
        if status == ACTIVE:
            raise HTTPException(status_code=400, detail="This account is already active")

        restore_account(role, user, f"admin:{admin_id}")

        if user.get("email"):
            background_tasks.add_task(
                send_plain_email, user["email"], *account_restored_email(user.get("fullName"))
            )

        return {"status": ACTIVE, "cancelledBookings": 0}

    action = SUSPENDED if payload.action == "suspend" else BLOCKED

    if action == SUSPENDED and payload.days is None:
        raise HTTPException(status_code=400, detail="Choose a suspension length: 3, 7 or 30 days")

    reason = (payload.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Please give a reason")

    cancelled = apply_moderation(
        role, user, action, reason, payload.days, admin_id, payload.disputeId
    )

    updated = ROLE_COLLECTION[role].find_one({"_id": user["_id"]})

    if user.get("email"):
        background_tasks.add_task(
            send_plain_email,
            user["email"],
            *account_moderated_email(
                user.get("fullName"), action, reason, _until_text(updated.get("suspendedUntil"))
            ),
        )

    # Tell every customer whose booking was cancelled, and whether they
    # were refunded (only paid bookings had money in escrow).
    for booking in cancelled:
        customer = customer_collection.find_one({"customerId": booking.get("customerId")})
        if customer and customer.get("email"):
            background_tasks.add_task(
                send_plain_email,
                customer["email"],
                *booking_cancelled_by_admin_email(
                    customer.get("fullName"),
                    booking["bookingId"],
                    booking.get("workerName", "your worker"),
                    booking.get("status") in ("confirmed", "in_progress"),
                ),
            )

    _record_dispute_action(
        dispute, action, payload.days if action == SUSPENDED else None, admin_id, background_tasks
    )

    return {
        "status": action,
        "suspendedUntil": updated.get("suspendedUntil"),
        "cancelledBookings": len(cancelled),
    }


@router.patch("/users/{role}/{user_code}/moderation")
def moderate_user(
    role: str,
    user_code: str,
    payload: ModerationAction,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin)
):
    """
    Suspend (3/7/30 days), block (until restored) or restore a customer
    or worker. user_code is the public ID (CUS-.../WRK-...), which is
    what complaints carry. Suspending/blocking a worker also hides their
    gigs and cancels their open bookings with a full refund.
    """

    collection = _resolve_user_collection(role)
    user = collection.find_one({ROLE_ID_FIELD[role]: user_code})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = _moderate(role, refresh(role, user), payload, current_admin, background_tasks)

    messages = {
        ACTIVE: "Account restored",
        SUSPENDED: f"Account suspended for {payload.days} days",
        BLOCKED: "Account blocked",
    }
    message = (
        "Warning email sent" if result.get("warned") else messages[result["status"]]
    )
    if result.get("cancelledBookings"):
        message += f" • {result['cancelledBookings']} open booking(s) cancelled and refunded"

    return {"success": True, "message": message, **result}


@router.delete("/users/{role}/{id}")
def delete_user(
    role: str,
    id: str,
    current_admin=Depends(get_current_admin)
):

    collection = _resolve_user_collection(role)

    user = collection.find_one({"_id": _parse_object_id(id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    collection.delete_one({"_id": user["_id"]})

    # Same reasoning as suspension above -- a deleted worker's gigs
    # must not remain live/bookable. Soft-removed rather than
    # deleted outright so existing bookings/reviews/receipts that
    # reference this workerId keep working.
    if role == "worker":
        gig_collection.update_many(
            {"workerId": user.get("workerId")},
            {"$set": {"status": "Removed"}}
        )

    return {
        "success": True,
        "message": "User deleted"
    }


@router.patch("/workers/{worker_id}/verification")
def set_worker_verification(
    worker_id: str,
    payload: WorkerVerification,
    background_tasks: BackgroundTasks,
    current_admin=Depends(get_current_admin)
):
    """
    Approve or reject a worker's CNIC verification. Backs the admin
    overview's verification queue, whose Approve/Reject buttons were
    previously wired to nothing at all.
    """

    worker = worker_collection.find_one({"workerId": worker_id})

    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    approved = payload.action == "approve"

    worker_collection.update_one(
        {"workerId": worker_id},
        {
            "$set": {
                "cnicVerified": approved,
                "verificationStatus": "approved" if approved else "rejected",
                "verifiedAt": datetime.utcnow().isoformat(),
                "verifiedBy": str(current_admin["_id"]),
            }
        }
    )

    # The public Services listing reads the badge off the gig, so the
    # decision has to reach the gigs too or the two disagree.
    gig_collection.update_many(
        {"workerId": worker_id},
        {"$set": {"cnicVerified": approved}}
    )

    # Tell the worker about the decision. Sent in the background so the
    # admin's click returns immediately and an SMTP error can't fail it.
    if worker.get("email"):
        background_tasks.add_task(
            send_worker_approved_email if approved else send_worker_rejected_email,
            worker["email"],
            worker.get("fullName") or "worker",
        )

    return {
        "success": True,
        "message": (
            "Worker verified" if approved else "Worker verification rejected"
        ),
        "workerId": worker_id,
        "verificationStatus": "approved" if approved else "rejected",
    }

