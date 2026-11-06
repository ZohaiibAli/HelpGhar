from bson import ObjectId
from fastapi import UploadFile, File
from helper.cloudinary_helper import upload_image, delete_image
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Depends
from config.db import (
    admin_collection,
    dispute_collection,
    customer_collection,
    worker_collection,
    gig_collection,
)
from model.admin_model import AdminLogin,ForgotPasswordRequest,ResetPasswordRequest
from model.admin_model import WorkerVerification
from pydantic import BaseModel
from datetime import datetime
from helper.password_helper import hash_password
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from helper.password_helper import verify_password
from helper.auth_helper import get_current_admin
from helper.email_helper import send_reset_email
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

@router.get("/disputes/customer")
def get_customer_disputes_admin(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    disputes = dispute_collection.find({"filedBy": "customer"})

    result = []

    for dispute in disputes:

        result.append({
            "id": dispute["disputeId"],
            "customerId": dispute["customerId"],
            "customerName": dispute.get("customerName", "Unknown Customer"),
            "workerId": dispute["workerId"],
            "workerName": dispute.get("workerName", "Unknown Worker"),
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "createdAt": dispute["createdAt"]
        })

    return {
        "success": True,
        "complaints": result
    }


@router.get("/disputes/worker")
def get_worker_disputes_admin(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    disputes = dispute_collection.find({"filedBy": "worker"})

    result = []

    for dispute in disputes:

        result.append({
            "id": dispute["disputeId"],
            "customerId": dispute["customerId"],
            "customerName": dispute.get("customerName", "Unknown Customer"),
            "workerId": dispute["workerId"],
            "workerName": dispute.get("workerName", "Unknown Worker"),
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "createdAt": dispute["createdAt"]
        })

    return {
        "success": True,
        "complaints": result
    }


@router.patch("/dispute/{dispute_id}/resolve")
def resolve_dispute(dispute_id: str, user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    result = dispute_collection.update_one(
        {"disputeId": dispute_id},
        {"$set": {"status": "Resolved"}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dispute not found")

    return {
        "success": True,
        "message": "Dispute marked as resolved"
    }


@router.delete("/dispute/{dispute_id}")
def delete_dispute(dispute_id: str, user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    result = dispute_collection.delete_one({"disputeId": dispute_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dispute not found")

    return {
        "success": True,
        "message": "Dispute deleted"
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
            "status": customer.get("status", "active"),
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
            "status": worker.get("status", "active"),
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
    current_admin=Depends(get_current_admin)
):

    collection = _resolve_user_collection(role)

    user = collection.find_one({"_id": _parse_object_id(id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "suspended" if user.get("status", "active") == "active" else "active"

    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"status": new_status}}
    )

    # A suspended worker's existing gigs must stop being bookable --
    # otherwise their listings stay live and customers can keep
    # hiring someone the admin just suspended. Reactivating flips
    # them back; gigs currently have no independent "worker turned
    # this one off" state of their own, so this is safe to do in bulk.
    if role == "worker":
        gig_collection.update_many(
            {"workerId": user.get("workerId")},
            {"$set": {"status": "Active" if new_status == "active" else "Suspended"}}
        )

    return {
        "success": True,
        "status": new_status
    }

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

    return {
        "success": True,
        "message": (
            "Worker verified" if approved else "Worker verification rejected"
        ),
        "workerId": worker_id,
        "verificationStatus": "approved" if approved else "rejected",
    }

