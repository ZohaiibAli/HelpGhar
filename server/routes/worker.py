from fastapi import APIRouter
from config.db import worker_collection
from model.worker_model import WorkerRegister, WorkerLogin

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

    worker_collection.insert_one(worker.dict())

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

    if existing_worker["password"] != worker.password:

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