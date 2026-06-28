from fastapi import APIRouter
from config.db import customer_collection
from model.customer_model import CustomerRegister, CustomerLogin

router = APIRouter(prefix="/customer", tags=["Customer"])


@router.post("/register")
def register_customer(customer: CustomerRegister):

    existing = customer_collection.find_one(
        {
            "email": customer.email
        }
    )

    if existing:

        return {
            "success": False,
            "message": "Email already exists"
        }

    customer_collection.insert_one(customer.dict())

    return {
        "success": True,
        "message": "Customer Registered Successfully"
    }

@router.post("/login")
def login_customer(customer: CustomerLogin):

    existing = customer_collection.find_one(
        {
            "email": customer.email
        }
    )

    if not existing:
        return {
            "success": False,
            "message": "Email not found"
        }

    if existing["password"] != customer.password:
        return {
            "success": False,
            "message": "Incorrect password"
        }

    return {
        "success": True,
        "message": "Login Successful",
        "user": {
            "id": str(existing["_id"]),
            "fullName": existing["fullName"],
            "email": existing["email"]
        }
    }