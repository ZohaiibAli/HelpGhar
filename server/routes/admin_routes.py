from fastapi import APIRouter
from config.db import admin_collection
from config.db import (
    admin_collection,
    dispute_collection,
    customer_collection,
    worker_collection
)
from bson import ObjectId
from datetime import datetime
from model.admin_model import AdminLogin
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from helper.password_helper import verify_password
from fastapi import HTTPException, Depends
from model.admin_model import AdminLogin, AdminUpdate, ChangePassword
from helper.password_helper import hash_password, verify_password


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


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

@router.get("/profile")
def get_admin_profile(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    admin = admin_collection.find_one({"_id": ObjectId(user["id"])})

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    return {
        "id": str(admin["_id"]),
        "fullName": admin.get("fullName") or admin.get("name", ""),
        "email": admin["email"],
        "phone": admin.get("phone", ""),
        "address": admin.get("address", "")
    }


@router.put("/profile")
def update_admin_profile(admin: AdminUpdate, user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    existing = admin_collection.find_one({
        "email": admin.email,
        "_id": {"$ne": ObjectId(user["id"])}
    })

    if existing:
        return {
            "success": False,
            "message": "Email already exists"
        }

    admin_collection.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": admin.dict()}
    )

    return {
        "success": True,
        "message": "Profile Updated Successfully",
        "user": {
            "id": user["id"],
            "fullName": admin.fullName,
            "email": admin.email,
            "phone": admin.phone,
            "address": admin.address
        }
    }


@router.put("/change-password")
def change_admin_password(password: ChangePassword, user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    admin = admin_collection.find_one({"_id": ObjectId(user["id"])})

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if not verify_password(password.currentPassword, admin["password"]):
        return {
            "success": False,
            "message": "Current password is incorrect"
        }

    hashed = hash_password(password.newPassword)

    admin_collection.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password": hashed}}
    )

    return {
        "success": True,
        "message": "Password Updated Successfully"
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

@router.get("/disputes/customer")
def get_customer_disputes_admin(user=Depends(verify_token)):

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin Only")

    disputes = dispute_collection.find({"filedBy": "customer"})

    result = []

    for dispute in disputes:

        customer = customer_collection.find_one({"_id": ObjectId(dispute["customerId"])})
        worker = worker_collection.find_one({"_id": ObjectId(dispute["workerId"])})

        result.append({
            "id": str(dispute["_id"]),
            "customerName": customer["fullName"] if customer else "Unknown Customer",
            "workerName": worker["fullName"] if worker else "Unknown Worker",
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "date": dispute["createdAt"].strftime("%Y-%m-%d")
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

        customer = customer_collection.find_one({"_id": ObjectId(dispute["customerId"])})
        worker = worker_collection.find_one({"_id": ObjectId(dispute["workerId"])})

        result.append({
            "id": str(dispute["_id"]),
            "customerName": customer["fullName"] if customer else "Unknown Customer",
            "workerName": worker["fullName"] if worker else "Unknown Worker",
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "date": dispute["createdAt"].strftime("%Y-%m-%d")
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
        {"_id": ObjectId(dispute_id)},
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

    result = dispute_collection.delete_one({"_id": ObjectId(dispute_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dispute not found")

    return {
        "success": True,
        "message": "Dispute deleted"
    }