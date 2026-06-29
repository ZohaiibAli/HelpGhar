from fastapi import APIRouter
from config.db import customer_collection
from model.customer_model import CustomerRegister, CustomerLogin
from helper.password import hash_password, verify_password

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

    #customer_collection.insert_one(customer.dict())
    customer_data = customer.dict()

    customer_data["password"] = hash_password(customer.password)

    customer_collection.insert_one(customer_data)

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

    if not verify_password(
    customer.password,
    existing["password"]
    ):
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