from fastapi import APIRouter
from config.db import customer_collection
from model.customer_model import (
    CustomerRegister,
    CustomerLogin,
    CustomerUpdate,
    ChangePassword
)
from helper.password_helper import hash_password, verify_password
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from fastapi import HTTPException, Depends
from bson import ObjectId

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

    token = create_access_token(
    {
        "id": str(existing["_id"]),
        "email": existing["email"],
        "role": "customer"
    }
)

    return {
        "success": True,
        "message": "Login Successful",
        "token": token,
        "user": {
            "id": str(existing["_id"]),
            "fullName": existing["fullName"],
            "email": existing["email"]
        }
    }


@router.get("/profile")
def get_profile(user=Depends(verify_token)):

    #print("User received:", user)   # <-- ADD THIS

    if user["role"] != "customer":


        raise HTTPException(
            status_code=403,
            detail="Customer Only"
        )

    customer = customer_collection.find_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {

        "id": str(customer["_id"]),

        "fullName": customer["fullName"],

        "email": customer["email"],

        "phone": customer["phone"],

        "address": customer["address"]

    }

@router.put("/profile")
def update_profile(

    customer: CustomerUpdate,

    user=Depends(verify_token)

):

    if user["role"] != "customer":

        raise HTTPException(
            status_code=403,
            detail="Customer Only"
        )
    existing = customer_collection.find_one(
    {
        "email": customer.email,
        "_id": {
            "$ne": ObjectId(user["id"])
        }
    }
)

    if existing:

        return {

        "success": False,

        "message": "Email already exists"

 }
    customer_collection.update_one(

        {
            "_id": ObjectId(user["id"])
        },

        {
            "$set": customer.dict()
        }

    )

    return {

    "success": True,

    "message": "Profile Updated Successfully",

    "user":{

        "id":user["id"],

        "fullName":customer.fullName,

        "email":customer.email,

        "phone":customer.phone,

        "address":customer.address

    }

}

@router.put("/change-password")
def change_password(

    password: ChangePassword,

    user=Depends(verify_token)

):

    if user["role"] != "customer":

        raise HTTPException(
            status_code=403,
            detail="Customer Only"
        )

    customer = customer_collection.find_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    if not customer:

        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if not verify_password(
        password.currentPassword,
        customer["password"]
    ):

        return {

            "success": False,

            "message": "Current password is incorrect"

        }

    hashed = hash_password(
        password.newPassword
    )

    customer_collection.update_one(

        {
            "_id": ObjectId(user["id"])
        },

        {
            "$set": {
                "password": hashed
            }
        }

    )

    return {

        "success": True,

        "message": "Password Updated Successfully"

    }