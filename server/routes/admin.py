from fastapi import APIRouter
from config.db import admin_collection
from model.admin_model import AdminLogin

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

    if admin_data["password"] != admin.password:
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    return {
        "success": True,
        "message": "Login Successful",
        "admin": {
            "name": admin_data["name"],
            "email": admin_data["email"]
        }
    }