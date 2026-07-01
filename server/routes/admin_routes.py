from fastapi import APIRouter
from config.db import admin_collection
from model.admin_model import AdminLogin
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from helper.password_helper import verify_password
from fastapi import HTTPException, Depends


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