from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from config.db import worker_collection, gig_collection,worker_details_collection
from model.worker_model import WorkerRegister, WorkerLogin, GigCreate, WorkerUpdate, WorkerPasswordUpdate,WorkerDetailsUpdate
from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from helper.password_helper import hash_password, verify_password
from helper.cloudinary_helper import upload_image, delete_image
from helper.jwt_helper import create_access_token
from helper.auth_helper import verify_token
from fastapi import HTTPException, Depends
from helper.id_helper import generate_worker_id
from config.db import review_collection

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

    try:
        result = worker_collection.insert_one(worker_data)
    except DuplicateKeyError:
        # The find_one check above can't catch two concurrent
        # registrations for the same email -- the unique index on
        # worker_collection.email (config/db.py) is what actually
        # closes that race.
        return {
            "success": False,
            "message": "Email already exists"
        }

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
    # Same generic message whether the email doesn't exist or the
    # password is wrong -- distinguishing the two lets an attacker
    # enumerate registered emails by brute-forcing this endpoint.
    if existing_worker is None:
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    if not verify_password(
        worker.password,
        existing_worker["password"]
    ):
        return {
            "success": False,
            "message": "Invalid Email or Password"
        }

    token = create_access_token(
    {
        "id": str(existing_worker["_id"]),
        "workerId": existing_worker["workerId"],
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
            "status": existing_worker["status"],
            "role": "worker"
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
        "profileImage": worker.get("profileImage"),   # ← add this line
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

    # Gig listings snapshot fullName/category/gender at creation time
    # and otherwise never see profile edits again -- without this, a
    # worker who changes their name or switches category keeps
    # showing the old values on every gig (and search/recommendation
    # results, which read directly off the gig document) forever.
    gig_collection.update_many(
        {
            "workerId": user["workerId"]
        },
        {
            "$set": {
                "fullName": worker.fullName,
                "category": worker.category,
                "gender": worker.gender,
            }
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
            status_code=400,
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

    gig_data["workerId"] = user["workerId"]

    gig_data["status"] = "Active"

    result = gig_collection.insert_one(gig_data)

    return {
        "success": True,
        "message": "Gig created successfully",
        "id": str(result.inserted_id)
    }


def _parse_gig_id(gig_id: str) -> ObjectId:
    try:
        return ObjectId(gig_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid gig id")


@router.put("/gig/{gig_id}")
def update_gig(
    gig_id: str,
    gig: GigCreate,
    user=Depends(verify_token)
):
    if user["role"] != "worker":
        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    existing = gig_collection.find_one(
        {
            "_id": _parse_gig_id(gig_id),
            "workerId": user["workerId"]
        }
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Gig not found"
        )

    update_data = gig.dict()
    update_data["workerId"] = user["workerId"]
    update_data["status"] = existing.get("status", "Active")

    gig_collection.update_one(
        {"_id": existing["_id"]},
        {"$set": update_data}
    )

    return {
        "success": True,
        "message": "Gig updated successfully"
    }


@router.delete("/gig/{gig_id}")
def delete_gig(
    gig_id: str,
    user=Depends(verify_token)
):
    if user["role"] != "worker":
        raise HTTPException(
            status_code=403,
            detail="Worker Only"
        )

    result = gig_collection.update_one(
        {
            "_id": _parse_gig_id(gig_id),
            "workerId": user["workerId"]
        },
        {"$set": {"status": "Removed"}}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Gig not found"
        )

    return {
        "success": True,
        "message": "Gig removed"
    }


@router.get("/gigs")
def get_gigs():

    gigs = list(gig_collection.find({"status": "Active"}))

    # One bulk lookup instead of a find_one() per gig -- with a handful
    # of gigs the per-gig round trip was invisible, but at hundreds+ it
    # turned every /worker/gigs call into hundreds of sequential remote
    # queries (tens of seconds), well past the frontend's request
    # timeout, so the page silently rendered zero workers.
    worker_ids = {gig["workerId"] for gig in gigs if "workerId" in gig}

    workers_by_id = {
        worker["workerId"]: worker
        for worker in worker_collection.find({"workerId": {"$in": list(worker_ids)}})
    }

    for gig in gigs:

        worker = workers_by_id.get(gig.get("workerId"))

        if worker:

            gig["rating"] = worker.get("rating", 0)
            gig["reviewsCount"] = worker.get("reviewsCount", 0)

            # ------------------------
            # AI Fields
            # ------------------------

            gig["marketplaceScore"] = worker.get(
                "marketplaceScore",
                0
            )

            gig["reputationLabel"] = worker.get(
                "reputationLabel",
                "New Worker"
            )

            gig["reviewSummary"] = worker.get(
                "reviewSummary",
                {}
            )

            gig["aiSummary"] = worker.get(
                "aiSummary",
                {}
            )

            gig["badges"] = worker.get(
                "badges",
                []
            )

        gig["id"] = str(gig["_id"])

        del gig["_id"]

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

@router.get("/details/public/{worker_id}")
def get_worker_details_public(worker_id: str):

    # worker_id here is the human-readable worker code (e.g.
    # "HGW-007") that the frontend gets from the gig list. The
    # "workerId" key in worker_details_collection instead holds the
    # Mongo _id string (set at registration for the authenticated
    # GET/PUT /worker/details routes) -- the code is stored separately
    # under "workerCode". Querying "workerId" here could never match,
    # which silently blanked out every worker's public About/Skills/
    # Certifications section.
    details = worker_details_collection.find_one(
        {
            "workerCode": worker_id
        }
    )

    if not details:
        return {
            "about": "",
            "skills": "",
            "certifications": ""
        }

    return {
        "about": details.get("about", ""),
        "skills": details.get("skills", ""),
        "certifications": details.get("certifications", "")
    }

@router.put("/profile-image")
async def update_worker_profile_image(
    file: UploadFile = File(...),
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

    old_image = worker.get("profileImage")

    image_url = upload_image(
        file,
        folder="HelpGhar/ProfilePictures"
    )

    if old_image:
        delete_image(old_image)

    worker_collection.update_one(
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

    worker_collection.delete_one(
        {
            "_id": ObjectId(user["id"])
        }
    )

    return {

        "success": True,

        "message": "Account deleted successfully"

    }