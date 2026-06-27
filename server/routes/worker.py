from fastapi import APIRouter
from config.db import worker_collection
from model.worker_model import WorkerRegister

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