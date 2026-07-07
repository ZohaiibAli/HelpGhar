from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from config.db import worker_collection, gig_collection,worker_details_collection
from model.worker_model import WorkerRegister, WorkerLogin, GigCreate, WorkerUpdate, WorkerPasswordUpdate,WorkerDetailsUpdate
from bson import ObjectId
from helper.password_helper import hash_password, verify_password
from helper.cloudinary_helper import upload_image
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from fastapi import HTTPException, Depends
from helper.id_helper import generate_worker_id

router = APIRouter(prefix="/worker", tags=["Worker"])


@router.post("/register")
def register_worker(worker: WorkerRegister):

    existing = worker_collection.find_one(
        {
            "email": worker.email
        }
    )

    if existing:
        return {
            "success": False,
            "message": "Email already exists"
        }

    worker_data = worker.dict()

    worker_data["password"] = hash_password(worker.password)

    worker_data["workerId"] = generate_worker_id()

    worker_data["status"] = "Active"

    result = worker_collection.insert_one(worker_data)

    worker_details_collection.insert_one({
        "workerId": str(result.inserted_id),
        "workerCode": worker_data["workerId"],
        "about": "",
        "skills": "",
        "certifications": ""
    })

    return {
        "success": True,
        "message": "Worker Registered Successfully",
        "workerId": worker_data["workerId"]
    }


@router.post("/login")
def worker_login(worker: WorkerLogin):

    existing_worker = worker_collection.find_one(
        {
            "email": worker.email
        }
    )
    if existing_worker is None:
        return {
            "success": False,
            "message": "Worker not found"
        }

    if not verify_password(
        worker.password,
        existing_worker["password"]
    ):
        return {
            "success": False,
            "message": "Incorrect password"
        }

    token = create_access_token(
    {
        "id": str(existing_worker["_id"]),
        "email": existing_worker["email"],
        "role": "worker"
    }
)

    return {
        "success": True,
        "message": "Login Successful",
        "token": token,
        "worker": {
            "id": str(existing_worker["_id"]),
            "workerId": existing_worker["workerId"],
            "fullName": existing_worker["fullName"],
            "email": existing_worker["email"],
            "category": existing_worker["category"],
             "status": existing_worker["status"]
        }
    }

@router.get("/profile")
def get_worker_profile(user=Depends(verify_token)):

    if user["role"] != "worker":

        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    worker = worker_collection.find_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    if not worker:

        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    return {

        "id": str(worker["_id"]),

        "workerId":worker["workerId"],

        "fullName": worker["fullName"],

        "email": worker["email"],

        "phone": worker["phone"],

        "address": worker["address"],

        "cnic": worker["cnic"],

        "dob": worker["dob"],

        "gender": worker["gender"],

        "category": worker["category"],

        "experience": worker["experience"],

        "pricing": worker["pricing"],

        "skills": worker["skills"],

        "status": worker["status"],

    }

@router.put("/profile")
def update_worker_profile(

    worker: WorkerUpdate,

    user=Depends(verify_token)

):

    if user["role"] != "worker":

        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    if worker.email:

        existing_email = worker_collection.find_one(
            {
                "email": worker.email,
                "_id": {"$ne": ObjectId(user["id"])}
            }
        )

        if existing_email:

            raise HTTPException(
                status_code=400,
                detail="Email already in use"
            )

    worker_collection.update_one(

        {
            "_id": ObjectId(user["id"])
        },

        {
            "$set": worker.dict()
        }

    )

    return {

        "success": True,

        "message": "Profile Updated Successfully"
    }

@router.get("/details")
def get_worker_details(user=Depends(verify_token)):

    if user["role"] != "worker":
        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    details = worker_details_collection.find_one(
        {
            "workerId": user["id"]
        }
    )

    if not details:
        raise HTTPException(
            status_code=404,
            detail="Details not found"
        )

    return {
        "about": details.get("about", ""),
        "skills": details.get("skills", ""),
        "certifications": details.get("certifications", "")
    }


@router.put("/details")
def update_worker_details(
    payload: WorkerDetailsUpdate,
    user=Depends(verify_token)
):

    if user["role"] != "worker":
        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    result = worker_details_collection.update_one(
        {
            "workerId": user["id"]
        },
        {
            "$set": payload.dict()
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Details not found"
        )

    return {
        "success": True,
        "message": "Details Updated Successfully"
    }

@router.put("/password")
def update_worker_password(

    payload: WorkerPasswordUpdate,

    user=Depends(verify_token)

):

    if user["role"] != "worker":

        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    worker = worker_collection.find_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    if not worker:

        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    if not verify_password(
        payload.currentPassword,
        worker["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect"
        )

    worker_collection.update_one(

        {
            "_id": ObjectId(user["id"])
        },

        {
            "$set": {
                "password": hash_password(payload.newPassword)
            }
        }

    )

    return {

        "success": True,

        "message": "Password Updated Successfully"

    }

@router.post("/gig")
def create_gig(
    gig: GigCreate,
    user=Depends(verify_token)
):
    if user["role"] != "worker":
        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    worker = worker_collection.find_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    if not worker:
        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    gig_data = gig.dict()

    gig_data["workerId"] = user["id"]

    gig_data["status"] = worker["status"]

    result = gig_collection.insert_one(gig_data)

    return {
        "success": True,
        "message": "Gig created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/gigs")
def get_gigs():
    gigs = []

    for gig in gig_collection.find(
    {
        "status": "Active"
    }
):
        gig["id"] = str(gig["_id"])
        del gig["_id"]
        gigs.append(gig)

    return {
        "success": True,
        "gigs": gigs
    }

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(verify_token)
):
    if user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Worker Only")

    image_url = upload_image(file)

    return {
        "success": True,
        "url": image_url
    }


# @router.get("/worker/profile")
# def profile(user=Depends(verify_token)):

#     if user["role"] != "worker":

#         raise HTTPException(
#             status_code=403,
#             detail="Worker Only"
#         )

#     return user

