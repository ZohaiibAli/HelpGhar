from fastapi import APIRouter, HTTPException, Depends
from config.db import (
    admin_collection,
    dispute_collection,
    customer_collection,
    worker_collection
)
from model.admin_model import AdminLogin
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from helper.password_helper import verify_password
from helper.auth_helper import get_current_admin


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

        result.append({
            "id": dispute["disputeId"],
            "customerId": dispute["customerId"],
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

@router.patch("/users/{role}/{id}/status")
def toggle_user_status(
    role: str,
    id: str,
    current_admin=Depends(get_current_admin)
):

    collection = customer_collection if role == "customer" else worker_collection

    user = collection.find_one({"_id": __import__("bson").ObjectId(id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "suspended" if user.get("status", "active") == "active" else "active"

    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"status": new_status}}
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

    collection = customer_collection if role == "customer" else worker_collection

    result = collection.delete_one(
        {"_id": __import__("bson").ObjectId(id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "success": True,
        "message": "User deleted"
    }

