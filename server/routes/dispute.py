from fastapi import APIRouter, Depends, HTTPException
from config.db import (
    dispute_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import DisputeCreate
from helper.auth_helper import verify_token
from datetime import datetime
from bson import ObjectId

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

         "workerId": dispute.workerId

    }

)

    if worker is None:

        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    dispute_collection.insert_one({
     "customerId": user["customerId"],
    "workerId": worker["workerId"],
    "workerName": worker["fullName"],
    "subject": dispute.subject,
    "description": dispute.description,
    "status": "Open",
    "filedBy": "customer",          # 👈 added
    "createdAt": datetime.utcnow()
})

    return {

        "success": True,

        "message": "Dispute Submitted Successfully"

    }
"""
@router.get("/disputes")
def get_customer_disputes(

    user=Depends(verify_token)

):

    disputes = list(

        dispute_collection.find(

            {

                "customerId": user["customerId"]

            },

            {

                "_id":0

            }

        )

    )

    return {

        "success":True,

        "data":disputes

    }
"""
@router.get("/disputes")
def get_customer_disputes(user=Depends(verify_token)):

    disputes = dispute_collection.find(
        {
            "customerId": user["customerId"]
        }
    )

    result = []

    for dispute in disputes:

        result.append({

    "id": str(dispute["_id"]),

    "workerId": dispute["workerId"],

    "workerName": dispute["workerName"],

    "subject": dispute["subject"],

    "description": dispute["description"],

    "status": dispute["status"].lower(),

    "createdAt": dispute["createdAt"]

})

    return {

        "success": True,

        "complaints": result

    }

@router.get("/workers")
def get_workers():

    workers = worker_collection.find()

    result = []

    for worker in workers:

        result.append({

    "workerId": worker["workerId"],

    "fullName": worker["fullName"]

})

    return {

        "success": True,

        "workers": result

    }