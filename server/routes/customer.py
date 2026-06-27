from fastapi import APIRouter
from model.customer_model import CustomerRegister
from config.db import customer_collection

router = APIRouter()


@router.post("/register")
async def register(user: CustomerRegister):

    existing = customer_collection.find_one({
        "email": user.email
    })

    if existing:
        return {
            "success": False,
            "message": "Email already exists"
        }

    customer_collection.insert_one(user.dict())

    return {
        "success": True,
        "message": "User Registered Successfully"
    }