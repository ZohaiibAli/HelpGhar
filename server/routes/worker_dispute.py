from fastapi import APIRouter, Depends, HTTPException
from config.db import (
    dispute_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import WorkerDisputeCreate
from helper.auth_helper import verify_token
from datetime import datetime
from bson import ObjectId

router = APIRouter(
    prefix="/worker",
    tags=["Worker Disputes"]
)


@router.post("/dispute")
def create_worker_dispute(
    dispute: WorkerDisputeCreate,
    user=Depends(verify_token)
):

    customer = customer_collection.find_one(
        {
            "_id": ObjectId(dispute.customerId)
        }
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    dispute_collection.insert_one({

        "workerId": user["id"],

        "customerId": dispute.customerId,

        "subject": dispute.subject,

        "description": dispute.description,

        "status": "Open",

        "filedBy": "worker",

        "createdAt": datetime.utcnow()

    })

    return {

        "success": True,

        "message": "Dispute Submitted Successfully"

    }


@router.get("/disputes")
def get_worker_disputes(user=Depends(verify_token)):

    disputes = dispute_collection.find(
        {
            "workerId": user["id"],
            "filedBy": "worker"
        }
    )

    result = []

    for dispute in disputes:

        customer = customer_collection.find_one(
            {
                "_id": ObjectId(dispute["customerId"])
            }
        )

        result.append({

            "id": str(dispute["_id"]),

            "customerName": customer["fullName"] if customer else "Unknown Customer",

            "subject": dispute["subject"],

            "description": dispute["description"],

            "status": dispute["status"].lower(),

            "date": dispute["createdAt"].strftime("%Y-%m-%d")

        })

    return {

        "success": True,

        "complaints": result

    }


@router.get("/customers")
def get_customers():

    customers = customer_collection.find()

    result = []

    for customer in customers:

        result.append({

            "id": str(customer["_id"]),

            "fullName": customer["fullName"]

        })

    return {

        "success": True,

        "customers": result

    }