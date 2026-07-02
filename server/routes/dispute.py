from fastapi import APIRouter, Depends, HTTPException
from config.db import (
    dispute_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import DisputeCreate
from helper.auth_helper import verify_token
from datetime import datetime

router = APIRouter(
    prefix="/customer",
    tags=["Customer Disputes"]
)


@router.post("/dispute")
def create_dispute(
    dispute: DisputeCreate,
    user=Depends(verify_token)
):

    #customer = customer_collection.find_one(
        #{
       #     "_id": user["id"]
        #}
    #)

    worker = worker_collection.find_one(
        {
            "fullName": dispute.workerName
        }
    )

    if worker is None:

        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    dispute_collection.insert_one({

        "customerId": user["id"],

        "workerId": str(worker["_id"]),

        "subject": dispute.subject,

        "description": dispute.description,

        "status": "Open",

        "createdAt": datetime.utcnow()

    })

    return {

        "success": True,

        "message": "Dispute Submitted Successfully"

    }
