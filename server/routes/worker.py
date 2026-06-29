# This is worker.py, which contains the routes for worker registration, login, and gig management. It uses FastAPI to define the API endpoints and interacts with a MongoDB database to store worker and gig information. The code also includes functionality for uploading avatar images and returning their URLs.
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from config.db import worker_collection, gig_collection
from model.worker_model import WorkerRegister, WorkerLogin, GigCreate
from bson import ObjectId
from helper.password import hash_password, verify_password
import uuid
import os

router = APIRouter(prefix="/worker", tags=["Worker"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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

    worker_collection.insert_one(worker_data)

    return {
        "success": True,
        "message": "Worker Registered Successfully"
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

    return {
        "success": True,
        "message": "Login Successful",
        "worker": {
            "id": str(existing_worker["_id"]),
            "fullName": existing_worker["fullName"],
            "email": existing_worker["email"],
            "category": existing_worker["category"]
        }
    }

# 👇 new: upload avatar image, returns a URL
@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]  # e.g. .jpg .png
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    url = f"http://localhost:8000/uploads/{filename}"
    return {"success": True, "url": url}


# 👇 save gig — avatar is now a short URL, not base64
@router.post("/gig")
def create_gig(gig: GigCreate):
    gig_data = gig.dict()
    
    # Safety: if somehow base64 slips through, strip it
    if gig_data.get("avatar", "").startswith("data:image"):
        gig_data["avatar"] = ""
    
    result = gig_collection.insert_one(gig_data)
    return {
        "success": True,
        "message": "Gig created successfully",
        "id": str(result.inserted_id)
    }


# 👇 fetch all gigs
@router.get("/gigs")
def get_gigs():
    gigs = []
    for gig in gig_collection.find():
        gig["id"] = str(gig["_id"])
        del gig["_id"]
        gigs.append(gig)
    return {"success": True, "gigs": gigs}