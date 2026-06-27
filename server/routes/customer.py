from fastapi import APIRouter
from config.db import customer_collection
from model.customer_model import CustomerRegister

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