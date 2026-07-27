from fastapi import APIRouter, UploadFile, File
from pymongo.errors import DuplicateKeyError
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
from helper.id_helper import generate_customer_id
from helper.cloudinary_helper import upload_image, delete_image

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

    customer_data = customer.dict()
    customer_data["customerId"] = generate_customer_id()

    customer_data["status"] = "Active"

    customer_data["password"] = hash_password(customer.password)

    try:
        customer_collection.insert_one(customer_data)
    except DuplicateKeyError:
        # The find_one check above can't catch two concurrent
        # registrations for the same email -- the unique index on
        # customer_collection.email (config/db.py) is what actually
        # closes that race, and this is what surfaces it as a clean
        # response instead of an unhandled 500.
        return {
            "success": False,
            "message": "Email already exists"
        }

    return {
        "success": True,
        "message": "Customer Registered Successfully",
        "customerId": customer_data["customerId"]
    }

@router.post("/login")
def login_customer(customer: CustomerLogin):

    existing = customer_collection.find_one(
        {
            "email": customer.email
        }
    )

    # Same generic message whether the email doesn't exist or the
    # password is wrong -- distinguishing the two (as this used to)
    # lets an attacker enumerate registered emails by brute-forcing
    # this endpoint. Matches what /admin/login already does.
    if not existing:
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    if not verify_password(
    customer.password,
    existing["password"]
    ):
        return {
            "success": False,
            "message": "Invalid Email or Password"
    }

    token = create_access_token({

    "id": str(existing["_id"]),

    "customerId": existing["customerId"],

    "email": existing["email"],

    "role":"customer"

})
    return {
        "success": True,
        "message": "Login Successful",
        "token": token,
        "user":{

"id":str(existing["_id"]),

"customerId":existing["customerId"],

"fullName":existing["fullName"],

"email":existing["email"],

"phone":existing["phone"],

"address":existing["address"],

"status":existing["status"],
"role":"customer"

}
    }


@router.get("/profile")
def get_profile(user=Depends(verify_token)):


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
    "customerId": customer["customerId"],
    "status": customer["status"],

    "fullName": customer["fullName"],
    "email": customer["email"],
    "phone": customer["phone"],
    "address": customer["address"],
    "profileImage": customer.get("profileImage")

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
@router.put("/profile-image")
async def update_profile_image(
    file: UploadFile = File(...),
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

    old_image = customer.get("profileImage")

    image_url = upload_image(
        file,
        folder="HelpGhar/ProfilePictures"
    )

    if old_image:
        delete_image(old_image)

    customer_collection.update_one(
        {
            "_id": ObjectId(user["id"])
        },
        {
            "$set": {
                "profileImage": image_url
            }
        }
    )

    return {
        "success": True,
        "message": "Profile picture updated successfully.",
        "profileImage": image_url
    }
@router.delete("/delete-account")
def delete_account(
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

    customer_collection.delete_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    return {

        "success": True,

        "message": "Account deleted successfully"

    }